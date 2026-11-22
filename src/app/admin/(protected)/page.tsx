"use client";

import { ChangeEvent, useCallback, useEffect, useState } from "react";
import {
  Activity,
  FileImage,
  LayoutDashboard,
  LogOut,
  PackageCheck,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  UserRound,
  Users,
} from "lucide-react";
import {
  AnimatePresence,
  MotionConfig,
  m,
  useReducedMotion,
} from "framer-motion";
import StatsCard from "@/components/stats-card";
import { AdminAccount } from "@/components/admin-account";
import { MotionButton } from "@/components/motion-button";
import { ScrollReveal } from "@/components/scroll-reveal";
import {
  fadeDown,
  fadeUp,
} from "@/animations/variants";
import type { AdminProfile } from "@/lib/admin-types";

type AdminSection =
  | "overview"
  | "etsy"
  | "profile"
  | "security"
  | "settings"
  | "activity"
  | "accounts";

type ProductRow = {
  title: string;
  category: string;
  type: string;
  price: string;
  slug: string;
};

type SyncMetrics = {
  totalProducts: number;
  activeListings: number;
  successfulProducts: number | null;
  failedImageDownloads: number;
  status: "success" | "partial" | null;
  syncedAt: string | null;
};

const emptyMetrics: SyncMetrics = {
  totalProducts: 0,
  activeListings: 0,
  successfulProducts: null,
  failedImageDownloads: 0,
  status: null,
  syncedAt: null,
};

const navigation: {
  id: AdminSection;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "etsy", label: "Etsy integration", icon: ShoppingBag },
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "settings", label: "Settings", icon: Settings2 },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "accounts", label: "Admin accounts", icon: Users },
];

async function readJson(response: Response) {
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || `Request failed (HTTP ${response.status}).`);
  }
  return result;
}

export default function Admin() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [notice, setNotice] = useState(
    "CSV import and export are local previews; they do not publish catalog changes.",
  );
  const [etsyStatus, setEtsyStatus] = useState("Loading synchronization status…");
  const [syncing, setSyncing] = useState(false);
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const systemReduceMotion = useReducedMotion();
  const reduceMotion = Boolean(
    systemReduceMotion || profile?.preferences.reduceMotion,
  );

  const refreshMetrics = useCallback(async () => {
    const response = await fetch("/api/etsy/products", { cache: "no-store" });
    const data = await readJson(response);
    const products = Array.isArray(data.products) ? data.products : [];
    const status = data.status;
    setMetrics({
      totalProducts: products.length,
      activeListings:
        status?.activeListings ??
        products.filter((product: { available?: boolean }) => product.available).length,
      successfulProducts: status?.successfulProducts ?? null,
      failedImageDownloads: status?.failedImageDownloads ?? 0,
      status: status?.status ?? null,
      syncedAt: status?.syncedAt ?? null,
    });
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/profile", { cache: "no-store" })
      .then(readJson)
      .then((result) => {
        if (active) setProfile(result.profile);
      })
      .catch((cause: unknown) => {
        if (active) {
          setProfileError(
            cause instanceof Error ? cause.message : "Admin profile could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });

    refreshMetrics()
      .then(() => setEtsyStatus("Synchronization status loaded."))
      .catch((cause: unknown) =>
        setEtsyStatus(
          cause instanceof Error ? cause.message : "Could not load synchronization status.",
        ),
      );
    return () => {
      active = false;
    };
  }, [refreshMetrics]);

  async function syncEtsy() {
    setSyncing(true);
    setEtsyStatus("Synchronizing active Etsy listings and refreshing product images…");
    try {
      const response = await fetch("/api/etsy/sync", { method: "POST" });
      const data = await readJson(response);
      setMetrics({
        totalProducts: data.count,
        activeListings: data.activeListings,
        successfulProducts: data.successfulProducts,
        failedImageDownloads: data.failedImageDownloads,
        status: data.status,
        syncedAt: data.syncedAt,
      });
      setEtsyStatus(
        `${data.count} products synchronized at ${new Date(data.syncedAt).toLocaleString()}. ${
          data.failedImageDownloads
            ? `${data.failedImageDownloads} image request(s) failed; existing cached images were retained where available.`
            : "All image requests completed."
        }`,
      );
    } catch (cause) {
      setEtsyStatus(
        cause instanceof Error ? cause.message : "Etsy synchronization failed.",
      );
    } finally {
      setSyncing(false);
    }
  }

  function importCsv(file?: File) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv") || file.size > 5 * 1024 * 1024) {
      setNotice("Choose a CSV file no larger than 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const lines = String(reader.result).split(/\r?\n/).filter(Boolean);
      const parsed = lines.slice(1).map((line) => {
        const columns = line.split(",");
        return {
          title: columns[0] || "",
          category: columns[1] || "",
          type: columns[2] || "physical",
          price: columns[3] || "",
          slug: columns[4] || "",
        };
      });
      setRows(parsed);
      setNotice(
        `${parsed.length} rows loaded in this browser preview. Review and verify before importing to a live catalog.`,
      );
    };
    reader.onerror = () => setNotice("The selected CSV file could not be read.");
    reader.readAsText(file);
  }

  function exportCsv() {
    const csv = [
      "title,category,type,price,slug",
      ...rows.map((row) =>
        [row.title, row.category, row.type, row.price, row.slug]
          .map((value) => `"${value.replaceAll('"', '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "sm-studios-products.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function signOut() {
    setLoggingOut(true);
    setLogoutError("");
    try {
      const response = await fetch("/api/admin/auth/logout", { method: "POST" });
      await readJson(response);
      window.location.assign("/admin/login");
    } catch (cause) {
      setLogoutError(
        cause instanceof Error ? cause.message : "Sign out could not be completed.",
      );
      setLoggingOut(false);
    }
  }

  const currentLabel =
    navigation.find((item) => item.id === activeSection)?.label || "Overview";
  const statusLabel =
    metrics.status === "partial"
      ? "Partial sync"
      : metrics.status === "success"
        ? "Successful sync"
        : "Not synchronized yet";

  return (
    <MotionConfig reducedMotion={reduceMotion ? "always" : "never"}>
      <div
        className={`admin-shell${profile?.preferences.compactDashboard ? " is-compact" : ""}`}
        data-reduce-motion={profile?.preferences.reduceMotion ? "true" : undefined}
      >
      <m.aside
        className="admin-side"
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        variants={fadeDown}
      >
        <div className="admin-side-brand">
          <strong>THE SM <i>STUDIOS</i></strong>
          <span>ADMINISTRATION</span>
        </div>
        <nav className="admin-side-nav" aria-label="Admin sections">
          {navigation.filter((item) => item.id !== "accounts" || profile?.role === "Owner").map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={activeSection === item.id ? "admin-active" : ""}
                aria-current={activeSection === item.id ? "page" : undefined}
                onClick={() => setActiveSection(item.id)}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <a className="admin-side-nav-link" href="/admin/support"> <span>Customer support inbox</span> </a>
        <div className="admin-side-bottom">
          {profile && (
            <div className="admin-side-user">
              <span className="admin-side-user-avatar">
                <UserRound size={15} aria-hidden="true" />
              </span>
              <span>
                <strong>{profile.fullName || profile.username}</strong>
                <small>{profile.role}</small>
              </span>
            </div>
          )}
          <MotionButton
            className="admin-logout-button"
            type="button"
            onClick={signOut}
            disabled={loggingOut}
          >
            <LogOut size={15} aria-hidden="true" />
            {loggingOut ? "SIGNING OUT…" : "SIGN OUT"}
          </MotionButton>
          {logoutError && <p className="admin-sidebar-error" role="alert">{logoutError}</p>}
        </div>
      </m.aside>

      <m.section
        id="admin-content"
        className="admin-main"
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        variants={fadeUp}
      >
        <div className="admin-main-topline">
          <span className="eyebrow">STUDIO MANAGEMENT</span>
          <span className="admin-current-section">{currentLabel}</span>
        </div>

        {profileLoading ? (
          <div className="admin-profile-loading" role="status">Loading your admin profile…</div>
        ) : profileError ? (
          <p className="admin-form-message is-error" role="alert">{profileError}</p>
        ) : !profile ? (
          <p className="admin-form-message is-error" role="alert">Admin profile is unavailable.</p>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={activeSection}
              className="admin-section-content"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
            >
              {activeSection === "overview" && (
                <OverviewSection
                  metrics={metrics}
                  statusLabel={statusLabel}
                  onOpenEtsy={() => setActiveSection("etsy")}
                  onOpenProfile={() => setActiveSection("profile")}
                />
              )}
              {activeSection === "etsy" && (
                <EtsySection
                  metrics={metrics}
                  statusLabel={statusLabel}
                  etsyStatus={etsyStatus}
                  syncing={syncing}
                  rows={rows}
                  notice={notice}
                  reduceMotion={reduceMotion}
                  onSync={syncEtsy}
                  onImport={importCsv}
                  onExport={exportCsv}
                />
              )}
              {activeSection === "accounts" && profile.role === "Owner" && <AdminAccountsSection />}
              {activeSection !== "overview" && activeSection !== "etsy" && activeSection !== "accounts" && (
                <AdminAccount
                  section={activeSection}
                  profile={profile}
                  onProfileChange={setProfile}
                />
              )}
            </m.div>
          </AnimatePresence>
        )}
      </m.section>
      </div>
    </MotionConfig>
  );
}

function AdminAccountsSection() {
  const [accounts, setAccounts] = useState<Array<{ username: string; fullName: string; email: string; role: string; status: string; accountCreatedAt: string; lastLoginAt: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/accounts", { cache: "no-store" });
      const data = await readJson(response);
      setAccounts(data.accounts || []);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Accounts could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function review(username: string, decision: "approve" | "reject") {
    setBusy(username);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, decision }),
      });
      await readJson(response);
      setMessage(`${username} was ${decision === "approve" ? "approved" : "rejected"}.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The account could not be reviewed.");
    } finally {
      setBusy("");
    }
  }

  async function remove(username: string) {
    const confirmed = window.confirm(`Permanently remove the administrator account “${username}”? Their active sessions will be revoked and they will no longer be able to sign in.`);
    if (!confirmed) return;
    setBusy(username);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      await readJson(response);
      setMessage(`${username} was removed and their active sessions were revoked.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The account could not be removed.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="admin-account-view">
      <div className="admin-intro">
        <span className="eyebrow">OWNER CONTROLS</span>
        <h1>Admin <em>accounts.</em></h1>
        <p>Review registration requests and manage access to the studio dashboard.</p>
      </div>
      {error && <p className="admin-form-message is-error" role="alert">{error}</p>}
      {message && <p className="admin-form-message is-success" role="status">{message}</p>}
      <section className="admin-card glass-surface">
        <div className="admin-card-heading-row">
          <div>
            <span className="eyebrow">ACCESS REQUESTS</span>
            <h3>Administrator registrations</h3>
          </div>
          <MotionButton className="btn btn-outline-light" type="button" onClick={() => void load()} disabled={loading || !!busy}>REFRESH</MotionButton>
        </div>
        {loading ? (
          <p className="admin-list-status">Loading accounts…</p>
        ) : accounts.length === 0 ? (
          <p className="admin-list-status">No administrator accounts found.</p>
        ) : (
          <div className="admin-table">
            {accounts.map((account) => (
              <article key={account.username} className="admin-account-review-row">
                <div>
                  <strong>{account.fullName || account.username}</strong>
                  <span>{account.email} · @{account.username}</span>
                  <small>{account.role} · {account.status} · Registered {new Date(account.accountCreatedAt).toLocaleDateString()}</small>
                </div>
                {account.role === "Owner" ? (
                  <strong className="admin-status-active">OWNER · PROTECTED</strong>
                ) : (
                  <div className="admin-form-actions">
                    {account.status === "Pending" && (
                      <>
                        <MotionButton className="btn btn-light" type="button" disabled={!!busy} onClick={() => void review(account.username, "approve")}>{busy === account.username ? "SAVING…" : "APPROVE"}</MotionButton>
                        <MotionButton className="btn btn-outline-light" type="button" disabled={!!busy} onClick={() => void review(account.username, "reject")}>REJECT</MotionButton>
                      </>
                    )}
                    <strong className={account.status === "Active" ? "admin-status-active" : ""}>{account.status}</strong>
                    <MotionButton className="btn btn-outline-light" type="button" disabled={!!busy} onClick={() => void remove(account.username)}>{busy === account.username ? "REMOVING…" : "REMOVE"}</MotionButton>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
      <p className="admin-form-help">Only the Owner can approve, reject, or remove administrator accounts. The Owner account is protected. Removing an administrator immediately revokes their active sessions.</p>
    </div>
  );
}

function OverviewSection({
  metrics,
  statusLabel,
  onOpenEtsy,
  onOpenProfile,
}: {
  metrics: SyncMetrics;
  statusLabel: string;
  onOpenEtsy: () => void;
  onOpenProfile: () => void;
}) {
  return (
    <div className="admin-overview-view">
      <ScrollReveal className="admin-intro">
        <h1>Good things<br /><em>in progress.</em></h1>
        <p>Manage your verified catalog and administrator account from one place.</p>
      </ScrollReveal>
      <div className="admin-stats-grid">
        <StatsCard title="Etsy products" value={metrics.totalProducts} icon={ShoppingBag} gradient="from-[#C6A477] to-[#8B6B42]" />
        <StatsCard title="Active listings" value={metrics.activeListings} icon={Activity} gradient="from-[#762F3C] to-[#A44C5C]" />
        <StatsCard title="Products synchronized" value={metrics.successfulProducts ?? "—"} icon={PackageCheck} gradient="from-[#4F6654] to-[#8A9B79]" />
        <StatsCard title="Failed image downloads" value={metrics.failedImageDownloads} icon={FileImage} gradient="from-[#762F3C] to-[#A44C5C]" />
      </div>
      <div className="admin-quick-actions">
        <section className="admin-card glass-surface">
          <span className="eyebrow">ETSY STORE CONNECTION</span>
          <h2>{statusLabel}</h2>
          <p>
            {metrics.syncedAt
              ? `Last synchronized ${new Date(metrics.syncedAt).toLocaleString()}.`
              : "No Etsy synchronization has been recorded yet."}
          </p>
          <MotionButton className="btn btn-light" type="button" onClick={onOpenEtsy}>
            OPEN ETSY INTEGRATION
          </MotionButton>
        </section>
        <section className="admin-card glass-surface">
          <span className="eyebrow">YOUR ADMIN ACCOUNT</span>
          <h2>Profile and security.</h2>
          <p>Update your profile details, password, and dashboard preferences.</p>
          <MotionButton className="btn btn-outline-light" type="button" onClick={onOpenProfile}>
            OPEN PROFILE
          </MotionButton>
        </section>
      </div>
    </div>
  );
}

function EtsySection({
  metrics,
  statusLabel,
  etsyStatus,
  syncing,
  rows,
  notice,
  reduceMotion,
  onSync,
  onImport,
  onExport,
}: {
  metrics: SyncMetrics;
  statusLabel: string;
  etsyStatus: string;
  syncing: boolean;
  rows: ProductRow[];
  notice: string;
  reduceMotion: boolean;
  onSync: () => void;
  onImport: (file?: File) => void;
  onExport: () => void;
}) {
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    onImport(event.target.files?.[0]);
    event.target.value = "";
  }

  return (
    <div className="admin-etsy-view">
      <ScrollReveal className="admin-intro">
        <span className="eyebrow">CATALOG OPERATIONS</span>
        <h1>Etsy <em>integration.</em></h1>
        <p>Keep the storefront catalog synchronized with your active Etsy listings.</p>
        <p className="admin-alert glass-surface--subtle" role="status">{notice}</p>
      </ScrollReveal>

      <div className="admin-stats-grid">
        <StatsCard title="Etsy products" value={metrics.totalProducts} icon={ShoppingBag} gradient="from-[#C6A477] to-[#8B6B42]" />
        <StatsCard title="Active listings" value={metrics.activeListings} icon={Activity} gradient="from-[#762F3C] to-[#A44C5C]" />
        <StatsCard title="Products synchronized" value={metrics.successfulProducts ?? "—"} icon={PackageCheck} gradient="from-[#4F6654] to-[#8A9B79]" />
        <StatsCard title="Failed image downloads" value={metrics.failedImageDownloads} icon={FileImage} gradient="from-[#762F3C] to-[#A44C5C]" />
      </div>

      <m.section
        className="admin-card sync-admin-card glass-surface"
        initial={reduceMotion ? false : "hidden"}
        whileInView={reduceMotion ? undefined : "visible"}
        viewport={{ once: true, amount: 0.1 }}
        variants={fadeUp}
      >
        <div>
          <span className="eyebrow">ETSY STORE CONNECTION</span>
          <h2>Synchronize your Etsy shop.</h2>
          <p>
            Active listings are refreshed from Etsy and upserted by listing ID.
            Inactive listings are removed from the storefront cache. If an image
            request fails, synchronization continues and the previous cached
            image is retained when available.
          </p>
          <p className="admin-alert glass-surface--subtle" role="status">{etsyStatus}</p>
          <div className="sync-summary">
            <span>STATUS <strong>{statusLabel}</strong></span>
            <span>LAST SYNCHRONIZED <strong>{metrics.syncedAt ? new Date(metrics.syncedAt).toLocaleString() : "Never"}</strong></span>
          </div>
        </div>
        <MotionButton className="btn btn-light" onClick={onSync} disabled={syncing}>
          {syncing ? "SYNCHRONIZING…" : "SYNC ETSY LISTINGS"}
        </MotionButton>
        <a className="btn btn-outline-light" href="/api/etsy/products" target="_blank" rel="noreferrer">
          VIEW CATALOG JSON 
        </a>
      </m.section>

      <section className="admin-card glass-surface">
        <div>
          <span className="eyebrow">CATALOG PREVIEW</span>
          <h2>Review a CSV locally.</h2>
          <p>
            This import is a browser-only preview and does not change the live
            Etsy catalog. Use the Etsy sync above to update verified listings.
          </p>
        </div>
        <label className="btn btn-outline-light admin-file-button">
          CHOOSE CSV
          <input type="file" accept=".csv,text/csv" onChange={handleFileChange} />
        </label>
        <MotionButton className="btn btn-outline-light" onClick={onExport}>
          EXPORT PREVIEW CSV 
        </MotionButton>
      </section>

      {rows.length > 0 && (
        <section className="admin-table glass-surface" aria-live="polite">
          <h3>Imported preview</h3>
          {rows.map((row, index) => (
            <div key={`${row.slug}-${index}`}>
              <strong>{row.title || "Untitled row"}</strong>
              <span>{row.category} · {row.type} · {row.price}</span>
            </div>
          ))}
        </section>
      )}
      <p className="admin-warning">
        Customer and revenue analytics are omitted because no order or customer
        data source is configured.
      </p>
    </div>
  );
}
