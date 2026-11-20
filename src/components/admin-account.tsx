"use client";

import Image from "next/image";
import {
  useEffect,
  useState,
} from "react";
import type { FormEvent } from "react";
import {
  Activity,
  Check,
  Eye,
  EyeOff,
  ImagePlus,
  Monitor,
  Trash2,
  UserRound,
} from "lucide-react";
import { MotionButton } from "@/components/motion-button";
import {
  ADMIN_PASSWORD_MIN_LENGTH,
  type AdminActivity,
  type AdminProfile,
} from "@/lib/admin-types";

type AdminAccountSection = "profile" | "security" | "settings" | "activity";

type SessionInfo = {
  id: string;
  createdAt: string;
  expiresAt: string;
  userAgent: string;
  current: boolean;
};

type Props = {
  section: AdminAccountSection;
  profile: AdminProfile;
  onProfileChange: (profile: AdminProfile) => void;
};

function formatDate(value: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not recorded"
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

async function responseJson(response: Response) {
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || `Request failed (${response.status}).`);
  }
  return result;
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="admin-section-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </header>
  );
}

export function AdminAccount({
  section,
  profile,
  onProfileChange,
}: Props) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [editing, setEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [activity, setActivity] = useState<AdminActivity[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    setFullName(profile.fullName);
    setEmail(profile.email);
    setEditing(false);
    setAvatarFile(null);
  }, [profile]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  useEffect(() => {
    setMessage("");
    setError("");
    if (section !== "security" && section !== "activity") return;

    let active = true;
    setLoadingList(true);
    const url = section === "security" ? "/api/admin/sessions" : "/api/admin/activity";
    fetch(url, { cache: "no-store" })
      .then(responseJson)
      .then((result) => {
        if (!active) return;
        if (section === "security") setSessions(result.sessions);
        else setActivity(result.activity);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load account data.");
      })
      .finally(() => {
        if (active) setLoadingList(false);
      });

    return () => {
      active = false;
    };
  }, [section]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email }),
      });
      const result = await responseJson(response);
      onProfileChange(result.profile);
      setMessage("Profile details saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Profile changes could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  function cancelProfileEdit() {
    if (
      (fullName !== profile.fullName || email !== profile.email || avatarFile) &&
      !window.confirm("Discard your unsaved profile changes?")
    ) {
      return;
    }
    setFullName(profile.fullName);
    setEmail(profile.email);
    setAvatarFile(null);
    setEditing(false);
    setError("");
    setMessage("");
  }

  function chooseAvatar(file?: File) {
    setError("");
    setMessage("");
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setAvatarFile(null);
      setError("Choose a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      setAvatarFile(null);
      setError("Choose an image between 1 byte and 5 MB.");
      return;
    }
    setAvatarFile(file);
  }

  async function saveAvatar() {
    if (!avatarFile) return;
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const form = new FormData();
      form.set("avatar", avatarFile);
      const response = await fetch("/api/admin/avatar", { method: "POST", body: form });
      const result = await responseJson(response);
      onProfileChange(result.profile);
      setAvatarFile(null);
      setMessage("Profile picture updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Profile picture could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function removeAvatar() {
    if (!profile.avatarUrl || !window.confirm("Remove your profile picture?")) return;
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch("/api/admin/avatar", { method: "DELETE" });
      const result = await responseJson(response);
      onProfileChange(result.profile);
      setAvatarFile(null);
      setMessage("Profile picture removed.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Profile picture could not be removed.");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    if (newPassword.length < ADMIN_PASSWORD_MIN_LENGTH) {
      setError(`Use at least ${ADMIN_PASSWORD_MIN_LENGTH} characters for your new password.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/admin/security/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      await responseJson(response);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password changed. Other active sessions have been signed out.");
      const sessionResponse = await fetch("/api/admin/sessions", { cache: "no-store" });
      const result = await responseJson(sessionResponse);
      setSessions(result.sessions);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Password could not be changed.");
    } finally {
      setBusy(false);
    }
  }

  async function revokeOtherSessions() {
    if (!window.confirm("Sign out all other active admin sessions?")) return;
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch("/api/admin/sessions", { method: "DELETE" });
      const result = await responseJson(response);
      setSessions(result.sessions);
      setMessage(
        result.revoked === 1
          ? "1 other session was signed out."
          : `${result.revoked} other sessions were signed out.`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Other sessions could not be signed out.");
    } finally {
      setBusy(false);
    }
  }

  async function updatePreference(
    key: "compactDashboard" | "reduceMotion",
    value: boolean,
  ) {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: { [key]: value } }),
      });
      const result = await responseJson(response);
      onProfileChange(result.profile);
      setMessage("Preference saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Preference could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  const passwordStrength = (() => {
    if (!newPassword) return { label: "Not entered", value: 0 };
    const score =
      Number(newPassword.length >= ADMIN_PASSWORD_MIN_LENGTH) +
      Number(/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) +
      Number(/\d/.test(newPassword)) +
      Number(/[^A-Za-z0-9]/.test(newPassword));
    return {
      label: score <= 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong",
      value: score,
    };
  })();

  if (section === "profile") {
    const imageSrc = avatarPreview || profile.avatarUrl;
    return (
      <div className="admin-account-view">
        <SectionHeader
          eyebrow="ACCOUNT PROFILE"
          title="Your profile."
          description="Manage the administrator details shown in this workspace."
        />
        <section className="admin-profile-card glass-surface">
          <div className="admin-profile-identity">
            <div className="admin-avatar" aria-label="Profile picture">
              {imageSrc ? (
                <Image src={imageSrc} alt="" width={104} height={104} unoptimized />
              ) : (
                <UserRound size={36} aria-hidden="true" />
              )}
            </div>
            <div>
              <span className="eyebrow">ADMINISTRATOR</span>
              <h3>{profile.fullName || "Name not provided"}</h3>
              <p>{profile.email || "Email not provided"}</p>
            </div>
            {!editing && (
              <MotionButton className="btn btn-outline-light" onClick={() => setEditing(true)}>
                EDIT PROFILE
              </MotionButton>
            )}
          </div>

          <div className="admin-profile-facts">
            <div><span>LOGIN USERNAME</span><strong>{profile.username}</strong></div>
            <div><span>ROLE</span><strong>{profile.role}</strong></div>
            <div><span>ACCOUNT STATUS</span><strong className="admin-status-active"><Check size={14} /> {profile.status}</strong></div>
            <div><span>ACCOUNT CREATED</span><strong>{formatDate(profile.accountCreatedAt)}</strong></div>
            <div><span>LAST LOGIN</span><strong>{formatDate(profile.lastLoginAt)}</strong></div>
          </div>

          {editing && (
            <form className="admin-profile-form" onSubmit={saveProfile}>
              <div className="admin-form-grid">
                <label>
                  FULL NAME
                  <input
                    autoComplete="name"
                    maxLength={100}
                    required
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                  />
                </label>
                <label>
                  EMAIL ADDRESS
                  <input
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
              </div>
              <p className="admin-form-help">
                Your email is contact information only. The login username is managed by the server.
              </p>
              <div className="admin-form-actions">
                <MotionButton className="btn btn-light" type="submit" disabled={busy}>
                  {busy ? "SAVING…" : "SAVE PROFILE"}
                </MotionButton>
                <MotionButton className="btn btn-outline-light" type="button" onClick={cancelProfileEdit} disabled={busy}>
                  CANCEL
                </MotionButton>
                <MotionButton
                  className="btn btn-text"
                  type="button"
                  onClick={() => {
                    setFullName(profile.fullName);
                    setEmail(profile.email);
                    setError("");
                  }}
                  disabled={busy}
                >
                  RESET UNSAVED CHANGES
                </MotionButton>
              </div>
            </form>
          )}
        </section>

        <section className="admin-card admin-avatar-card glass-surface">
          <div>
            <span className="eyebrow">PROFILE IMAGE</span>
            <h3>Make this account recognizable.</h3>
            <p>PNG, JPEG, or WebP only. Maximum file size: 5 MB. Images are stored outside the public directory.</p>
          </div>
          <div className="admin-form-actions">
            <label className="btn btn-outline-light admin-file-button">
              <ImagePlus size={16} aria-hidden="true" />
              CHOOSE IMAGE
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => chooseAvatar(event.target.files?.[0])}
              />
            </label>
            {avatarFile && (
              <>
                <MotionButton className="btn btn-light" type="button" onClick={saveAvatar} disabled={busy}>
                  {busy ? "SAVING…" : "SAVE IMAGE"}
                </MotionButton>
                <MotionButton className="btn btn-outline-light" type="button" onClick={() => setAvatarFile(null)} disabled={busy}>
                  CANCEL PHOTO
                </MotionButton>
              </>
            )}
            {profile.avatarUrl && !avatarFile && (
              <MotionButton className="btn btn-outline-light" type="button" onClick={removeAvatar} disabled={busy}>
                <Trash2 size={15} aria-hidden="true" /> REMOVE IMAGE
              </MotionButton>
            )}
          </div>
        </section>
        <Feedback message={message} error={error} />
      </div>
    );
  }

  if (section === "security") {
    return (
      <div className="admin-account-view">
        <SectionHeader
          eyebrow="ACCOUNT SECURITY"
          title="Keep access secure."
          description="Change your password and review active administrator sessions."
        />
        <section className="admin-card admin-password-card glass-surface">
          <div>
            <span className="eyebrow">PASSWORD</span>
            <h3>Change your password.</h3>
            <p>Passwords are stored as salted scrypt hashes. Use at least {ADMIN_PASSWORD_MIN_LENGTH} characters.</p>
          </div>
          <form onSubmit={changePassword}>
            <PasswordField id="current-password" label="CURRENT PASSWORD" value={currentPassword} onChange={setCurrentPassword} visible={showPasswords} autoComplete="current-password" />
            <PasswordField id="new-password" label="NEW PASSWORD" value={newPassword} onChange={setNewPassword} visible={showPasswords} autoComplete="new-password" />
            <div className="admin-password-strength" aria-live="polite">
              <div className={`strength-meter strength-${passwordStrength.value}`}><span /></div>
              <span>Password strength: <strong>{passwordStrength.label}</strong></span>
            </div>
            <PasswordField id="confirm-password" label="CONFIRM NEW PASSWORD" value={confirmPassword} onChange={setConfirmPassword} visible={showPasswords} autoComplete="new-password" />
            <div className="admin-form-actions">
              <MotionButton className="btn btn-light" type="submit" disabled={busy}>
                {busy ? "UPDATING…" : "CHANGE PASSWORD"}
              </MotionButton>
              <MotionButton className="btn btn-outline-light" type="button" onClick={() => setShowPasswords((value) => !value)}>
                {showPasswords ? <EyeOff size={15} /> : <Eye size={15} />}
                {showPasswords ? "HIDE PASSWORDS" : "SHOW PASSWORDS"}
              </MotionButton>
            </div>
          </form>
        </section>

        <section className="admin-card admin-sessions-card glass-surface">
          <div className="admin-card-heading-row">
            <div>
              <span className="eyebrow">ACTIVE SESSIONS</span>
              <h3>Signed-in devices.</h3>
            </div>
            <MotionButton className="btn btn-outline-light" type="button" onClick={revokeOtherSessions} disabled={busy || sessions.filter((item) => !item.current).length === 0}>
              SIGN OUT OTHER SESSIONS
            </MotionButton>
          </div>
          {loadingList ? (
            <p className="admin-list-status">Loading active sessions…</p>
          ) : sessions.length ? (
            <ul className="admin-session-list">
              {sessions.map((session) => (
                <li key={session.id}>
                  <Monitor size={18} aria-hidden="true" />
                  <div>
                    <strong>{session.current ? "This device · Current session" : session.userAgent || "Browser session"}</strong>
                    <span>Signed in {formatDate(session.createdAt)} · Expires {formatDate(session.expiresAt)}</span>
                  </div>
                  {session.current && <span className="admin-current-tag">CURRENT</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-list-status">No active sessions were found.</p>
          )}
        </section>
        <Feedback message={message} error={error} />
      </div>
    );
  }

  if (section === "settings") {
    return (
      <div className="admin-account-view">
        <SectionHeader
          eyebrow="WORKSPACE SETTINGS"
          title="Set your preferences."
          description="These preferences are saved to your administrator profile and apply to this dashboard."
        />
        <section className="admin-settings-list glass-surface">
          <PreferenceToggle
            title="Compact dashboard"
            description="Reduce spacing in dashboard cards to show more information at once."
            checked={profile.preferences.compactDashboard}
            disabled={busy}
            onChange={(value) => updatePreference("compactDashboard", value)}
          />
          <PreferenceToggle
            title="Reduce motion"
            description="Disable nonessential dashboard movement and animated transitions."
            checked={profile.preferences.reduceMotion}
            disabled={busy}
            onChange={(value) => updatePreference("reduceMotion", value)}
          />
          <div className="admin-setting-unavailable">
            <span className="eyebrow">EMAIL NOTIFICATIONS</span>
            <p>Email delivery is not configured for this project, so notification preferences are unavailable.</p>
          </div>
        </section>
        <Feedback message={message} error={error} />
      </div>
    );
  }

  return (
    <div className="admin-account-view">
      <SectionHeader
        eyebrow="ACCOUNT ACTIVITY"
        title="A clear activity record."
        description="Recent sign-ins and account changes recorded by this admin workspace."
      />
      <section className="admin-activity-list glass-surface">
        {loadingList ? (
          <p className="admin-list-status">Loading account activity…</p>
        ) : activity.length ? (
          activity.map((item) => (
            <article key={item.id}>
              <span className="admin-activity-icon"><Activity size={16} aria-hidden="true" /></span>
              <div>
                <strong>{item.description}</strong>
                <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
              </div>
            </article>
          ))
        ) : (
          <p className="admin-list-status">No activity has been recorded yet.</p>
        )}
      </section>
      <Feedback message={message} error={error} />
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  autoComplete: string;
}) {
  return (
    <label className="admin-password-field" htmlFor={id}>
      {label}
      <input
        id={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </label>
  );
}

function PreferenceToggle({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="admin-preference-row">
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function Feedback({ message, error }: { message: string; error: string }) {
  if (!message && !error) return null;
  return (
    <p className={`admin-form-message ${error ? "is-error" : "is-success"}`} role={error ? "alert" : "status"}>
      {error || message}
    </p>
  );
}
