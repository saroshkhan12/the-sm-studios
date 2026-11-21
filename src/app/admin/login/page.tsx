
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { m, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  LockKeyhole,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { MotionButton } from "@/components/motion-button";

export default function AdminLoginPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Unable to sign in.");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError("The admin service could not be reached. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-login-page">
      <m.section
        className="admin-login-card glass-surface"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.3 }}
      >
        <span className="admin-login-icon" aria-hidden="true">
          <LockKeyhole size={20} />
        </span>

        <span className="eyebrow">PRIVATE STUDIO ACCESS</span>

        <h1>
          Welcome <em>back.</em>
        </h1>

        <p>
          Sign in with the administrator credentials configured for this studio.
        </p>

        <form onSubmit={submit}>
          <label htmlFor="admin-username">ADMIN USERNAME</label>

          <input
            id="admin-username"
            autoComplete="username"
            maxLength={200}
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />

          <label htmlFor="admin-password">PASSWORD</label>

          <div className="admin-password-wrapper">
            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <button
              type="button"
              className="admin-password-toggle"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff size={19} aria-hidden="true" />
              ) : (
                <Eye size={19} aria-hidden="true" />
              )}
            </button>
          </div>

          {error && (
            <p className="admin-form-message is-error" role="alert">
              {error}
            </p>
          )}

          <MotionButton
            className="btn btn-light"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "SIGNING IN…" : "SIGN IN"}
            {!submitting && <ArrowUpRight size={16} aria-hidden="true" />}
          </MotionButton>
        </form>

        <small>
          Admin access is private. Keep your credentials confidential.
        </small>

        {/* Prominent administrator registration section */}
        <div className="admin-register-link">
          <span>NEW TO THE STUDIO?</span>

          <Link href="/admin/register">
            REQUEST AN ADMINISTRATOR ACCOUNT
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>

          <p>
            Apply for access to the THE SM STUDIOS administration dashboard.
          </p>
        </div>
      </m.section>
    </main>
  );
}
