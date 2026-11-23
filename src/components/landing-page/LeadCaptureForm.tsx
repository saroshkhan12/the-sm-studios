"use client";
import { useState, type FormEvent } from "react";

export function LeadCaptureForm({ label = "Email address", buttonLabel = "Request information", onSubmit }: {
  label?: string; buttonLabel?: string; onSubmit: (email: string) => Promise<void>;
}) {
  const [email,setEmail] = useState("");
  const [status,setStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [error,setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email address."); setStatus("error"); return; }
    setError(""); setStatus("loading");
    try { await onSubmit(email); setStatus("success"); }
    catch { setError("We couldn't submit your request. Please try again."); setStatus("error"); }
  }
  return <form className="lp-lead-form" onSubmit={submit} noValidate>
    <label htmlFor="lp-lead-email">{label}</label>
    <div className="lp-lead-row"><input id="lp-lead-email" type="email" autoComplete="email" value={email} onChange={e=>{setEmail(e.target.value);if(status==="error")setStatus("idle");}} aria-invalid={status==="error"} aria-describedby="lp-lead-feedback" required />
    <button className="lp-button" type="submit" disabled={status==="loading"}>{status==="loading" ? "Sending…" : buttonLabel}</button></div>
    <p id="lp-lead-feedback" role="status" aria-live="polite" className={status==="error"?"lp-form-error":""}>{status==="success" ? "Thank you. Your request has been received." : error}</p>
  </form>;
}
