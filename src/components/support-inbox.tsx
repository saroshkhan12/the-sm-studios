"use client";

import { useCallback, useEffect, useState } from "react";
import { MotionButton } from "@/components/motion-button";

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  status: "open" | "in_progress" | "resolved";
};

export function SupportInbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/support", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Support messages could not be loaded.");
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Support messages could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function changeStatus(id: string, status: Message["status"]) {
    setBusy(id);
    setError("");
    try {
      const response = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Message status could not be updated.");
      setMessages((items) => items.map((item) => item.id === id ? { ...item, status } : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Message status could not be updated.");
    } finally {
      setBusy("");
    }
  }

  const openCount = messages.filter((item) => item.status !== "resolved").length;

  return (
    <div className="admin-account-view">
      <div className="admin-intro">
        <span className="eyebrow">CUSTOMER CARE</span>
        <h1>Support <em>inbox.</em></h1>
        <p>{messages.length} saved enquiries · {openCount} awaiting resolution</p>
      </div>
      {error && <p className="admin-form-message is-error" role="alert">{error}</p>}
      <section className="admin-card glass-surface">
        <div className="admin-card-heading-row">
          <div><span className="eyebrow">WEBSITE ENQUIRIES</span><h3>Customer messages</h3></div>
          <MotionButton className="btn btn-outline-light" type="button" onClick={() => void load()} disabled={loading || !!busy}>REFRESH</MotionButton>
        </div>
        {loading ? <p className="admin-list-status" role="status">Loading enquiries…</p> :
          messages.length === 0 ? <p className="admin-list-status">No customer enquiries yet. New contact-form messages will appear here.</p> :
          <div className="admin-table">
            {messages.map((item) => (
              <article key={item.id} className="admin-account-review-row">
                <div>
                  <strong>{item.subject}</strong>
                  <span>{item.name} · <a href={`mailto:${encodeURIComponent(item.email)}`}>{item.email}</a></span>
                  <p>{item.message}</p>
                  <small>{new Date(item.createdAt).toLocaleString()} · {item.status.replace("_", " ")}</small>
                </div>
                <div className="admin-form-actions">
                  {item.status !== "in_progress" && <MotionButton className="btn btn-outline-light" type="button" disabled={!!busy} onClick={() => void changeStatus(item.id, "in_progress")}>IN PROGRESS</MotionButton>}
                  {item.status !== "resolved" && <MotionButton className="btn btn-light" type="button" disabled={!!busy} onClick={() => void changeStatus(item.id, "resolved")}>RESOLVE</MotionButton>}
                  {item.status !== "open" && <MotionButton className="btn btn-outline-light" type="button" disabled={!!busy} onClick={() => void changeStatus(item.id, "open")}>REOPEN</MotionButton>}
                </div>
              </article>
            ))}
          </div>
        }
      </section>
      <p className="admin-form-help">Messages are stored privately on the website server. Reply directly to the customer using their email address.</p>
    </div>
  );
}
