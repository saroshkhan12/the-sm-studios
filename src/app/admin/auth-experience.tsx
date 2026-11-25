"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import styles from "./admin-auth-experience.module.css";

type Props = { initialView?: "signin" | "signup" };

export function AdminAuthExperience({ initialView = "signin" }: Props) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [view, setView] = useState<"signin" | "signup">(initialView);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function switchView(next: "signin" | "signup") {
    setView(next); setError(""); setMessage(""); setPassword(""); setConfirm("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    if (view === "signup") {
      if (password.length < 12) { setError("Use at least 12 characters for your password."); return; }
      if (password !== confirm) { setError("The passwords do not match."); return; }
      if (!accepted) { setError("Please agree to the terms before submitting your request."); return; }
    }
    setBusy(true);
    try {
      const response = await fetch(view === "signin" ? "/api/admin/auth/login" : "/api/admin/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(view === "signin" ? { username, password } : { username, fullName, email, password }),
      });
      const result = await response.json();
      if (!response.ok) { setError(result.error || (view === "signin" ? "Unable to sign in." : "Registration could not be submitted.")); return; }
      if (view === "signin") { router.replace("/admin"); router.refresh(); return; }
      setMessage(result.message || "Your administrator request has been submitted for Owner approval.");
      setPassword(""); setConfirm(""); setAccepted(false);
    } catch {
      setError("The admin service could not be reached. Please try again.");
    } finally { setBusy(false); }
  }

  return (
    <main className={styles.page}>
      <m.section className={styles.card} initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : .45 }}>
        <aside className={styles.rail}>
          <div className={styles.brand}><span className={styles.brandMark}>SM</span><span>THE SM STUDIOS</span></div>
          <div className={styles.hero}>
            <div className={styles.orbit} aria-hidden="true"><span /><span /><span /></div>
            <div className={styles.heroIcon}><ShieldCheck size={29} /></div>
            <span className={styles.kicker}>PRIVATE STUDIO ACCESS</span>
            <AnimatePresence mode="wait">
              <m.div key={view} initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -10 }} transition={{ duration: reduceMotion ? 0 : .28 }} className={styles.heroCopy}>
                <h2>{view === "signin" ? <>Welcome<br /><em>back.</em></> : <>Your place<br />in the <em>studio.</em></>}</h2>
                <p>{view === "signin" ? "A considered space for the people behind the work." : "Request secure access to the THE SM STUDIOS administration workspace."}</p>
              </m.div>
            </AnimatePresence>
          </div>
          <div className={styles.railFoot}><Sparkles size={14} /> ART THAT SPEAKS · DESIGN THAT CONNECTS</div>
        </aside>

        <section className={styles.formPanel}>
          <div className={styles.tabs} role="tablist" aria-label="Account access">
            <button type="button" role="tab" aria-selected={view === "signin"} className={view === "signin" ? styles.activeTab : ""} onClick={() => switchView("signin")}>Sign In</button>
            <button type="button" role="tab" aria-selected={view === "signup"} className={view === "signup" ? styles.activeTab : ""} onClick={() => switchView("signup")}>Request Access</button>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <m.div key={view} className={styles.formContent} initial={reduceMotion ? false : { opacity: 0, x: view === "signin" ? -14 : 14 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: view === "signin" ? 14 : -14 }} transition={{ duration: reduceMotion ? 0 : .25 }}>
              <span className={styles.eyebrow}>{view === "signin" ? "YOUR WORKSPACE" : "ADMINISTRATOR APPLICATION"}</span>
              <h1>{view === "signin" ? "Sign in" : "Create access request"}</h1>
              <p className={styles.intro}>{view === "signin" ? "Enter your credentials to continue to the studio dashboard." : "New administrator accounts require approval from the studio Owner."}</p>
              <form onSubmit={submit}>
                {view === "signup" && <>
                  <label htmlFor="auth-fullname">FULL NAME</label>
                  <input id="auth-fullname" autoComplete="name" maxLength={100} required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" />
                  <label htmlFor="auth-email">EMAIL ADDRESS</label>
                  <input id="auth-email" type="email" autoComplete="email" maxLength={254} required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
                </>}
                <label htmlFor="auth-username">USERNAME</label>
                <input id="auth-username" autoComplete="username" maxLength={200} minLength={view === "signup" ? 3 : undefined} pattern={view === "signup" ? "[A-Za-z0-9._-]+" : undefined} required value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter your username" />
                <label htmlFor="auth-password">PASSWORD</label>
                <div className={styles.passwordField}>
                  <input id="auth-password" type={showPassword ? "text" : "password"} autoComplete={view === "signin" ? "current-password" : "new-password"} minLength={view === "signup" ? 12 : undefined} maxLength={1024} required value={password} onChange={e => setPassword(e.target.value)} placeholder={view === "signin" ? "Enter your password" : "At least 12 characters"} />
                  <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
                {view === "signup" && <>
                  <label htmlFor="auth-confirm">CONFIRM PASSWORD</label>
                  <input id="auth-confirm" type="password" autoComplete="new-password" maxLength={1024} required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Enter your password again" />
                  <label className={styles.agreement}><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} /> <span>I agree to the studio access terms and security policies.</span></label>
                </>}
                {error && <p className={styles.error} role="alert">{error}</p>}
                {message && <p className={styles.success} role="status">{message}</p>}
                <button className={styles.submit} type="submit" disabled={busy}>{busy ? (view === "signin" ? "SIGNING IN…" : "SUBMITTING…") : (view === "signin" ? "SIGN IN" : "SUBMIT REQUEST")} <ArrowRight size={17} /></button>
              </form>
              <div className={styles.footer}>
                {view === "signin" ? <>Need an administrator account? <button type="button" onClick={() => switchView("signup")}>Request access</button></> : <>Already approved? <button type="button" onClick={() => switchView("signin")}>Sign in</button></>}
              </div>
              <p className={styles.security}><LockKeyhole size={13} /> Protected sign-in · Owner and approved Administrators only</p>
            </m.div>
          </AnimatePresence>
        </section>
      </m.section>
    </main>
  );
}
