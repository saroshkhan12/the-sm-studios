import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createSupportMessage } from "@/lib/support-inbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 12_000;
const recentSubmissions = new Map<string, number>();

function json(message: string, status: number) {
  return NextResponse.json(
    { message },
    { status, headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) return json("Message is too large.", 413);

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return json("Invalid request format.", 415);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json("Invalid request.", 400);
  }

  if (!body || typeof body !== "object") return json("Invalid request.", 400);
  const data = body as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim() : "";
  const subject = typeof data.subject === "string" ? data.subject.trim().replace(/[\r\n]+/g, " ") : "";
  const message = typeof data.message === "string" ? data.message.trim() : "";
  const honeypot = typeof data.website === "string" ? data.website.trim() : "";

  // Quietly accept automated honeypot submissions without sending email.
  if (honeypot) return json("Message received.", 200);

  if (!name || name.length > 100 || !subject || subject.length > 150 ||
      !message || message.length > 5000 || email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json("Please check the form fields and try again.", 400);
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const lastSent = recentSubmissions.get(ip) || 0;
  if (now - lastSent < 60_000) return json("Please wait a minute before sending another message.", 429);

  try {
    await createSupportMessage({ name, email, subject, message });
  } catch (error) {
    console.error("Contact enquiry could not be stored:", error instanceof Error ? error.message : "Unknown error");
    return json("We could not receive your message right now. Please try again later.", 503);
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const recipients = (process.env.CONTACT_TO_EMAIL || "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);

  if (!host || !user || !pass || !recipients.length || !Number.isFinite(port)) {
    console.warn("Contact email notification is not configured; enquiry was saved to the private support inbox.");
    recentSubmissions.set(ip, now);
    return json("Your message has been received by the studio.", 200);
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });

    await transporter.sendMail({
      from: { name: "THE SM STUDIOS Website", address: user },
      to: recipients,
      replyTo: { name, address: email },
      subject: `Website enquiry: ${subject}`,
      text: `New contact form enquiry\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
    });

    recentSubmissions.set(ip, now);
    for (const [key, timestamp] of recentSubmissions) {
      if (now - timestamp > 10 * 60_000) recentSubmissions.delete(key);
    }
    return json("Your message has been received by the studio.", 200);
  } catch (error) {
    console.error("Contact email notification failed; enquiry remains in the private support inbox:", error instanceof Error ? error.message : "Unknown error");
    recentSubmissions.set(ip, now);
    return json("Your message has been received by the studio. Email notification may be delayed.", 200);
  }
}
