import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  authenticateAdmin,
} from "@/lib/admin-auth";
import {
  adminErrorResponse,
  adminJson,
  readAdminJson,
} from "@/lib/admin-http";

export const runtime = "nodejs";

const attempts = new Map<string, { count: number; resetAt: number }>();
const attemptWindow = 15 * 60 * 1000;
const maximumAttempts = 8;

function attemptKey(request: NextRequest, username: string) {
  const address =
    request.ip ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return createHash("sha256")
    .update(`${username}\u0000${address}`)
    .digest("hex");
}

function getAttemptBucket(key: string) {
  const now = Date.now();
  let bucket = attempts.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (attempts.size >= 5000) {
      for (const [storedKey, entry] of attempts) {
        if (entry.resetAt <= now) attempts.delete(storedKey);
      }
      if (attempts.size >= 5000) {
        const oldestKey = attempts.keys().next().value;
        if (oldestKey) attempts.delete(oldestKey);
      }
    }
    bucket = { count: 0, resetAt: now + attemptWindow };
    attempts.set(key, bucket);
  }
  return bucket;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await readAdminJson(request, "The login request is invalid.");
  } catch (error) {
    return adminErrorResponse(error, "login request");
  }
  if (!body || typeof body !== "object") {
    return adminJson({ error: "The login request is invalid." }, 400);
  }

  const username = (body as { username?: unknown }).username;
  const password = (body as { password?: unknown }).password;
  if (typeof username !== "string" || typeof password !== "string") {
    return adminJson({ error: "Enter your admin username and password." }, 400);
  }
  if (username.length > 200 || password.length > 1024) {
    return adminJson({ error: "The username or password is too long." }, 400);
  }

  const key = attemptKey(request, username);
  const bucket = getAttemptBucket(key);
  if (bucket.count >= maximumAttempts) {
    return adminJson(
      { error: "Too many sign-in attempts. Try again in 15 minutes." },
      429,
    );
  }

  try {
    const result = await authenticateAdmin(
      username,
      password,
      request.headers.get("user-agent") || "Unknown browser",
    );
    if (!result) {
      bucket.count += 1;
      return adminJson({ error: "The username or password is incorrect." }, 401);
    }
    attempts.delete(key);

    const response = adminJson({ profile: result.profile });
    response.cookies.set(ADMIN_SESSION_COOKIE, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE,
    });
    return response;
  } catch (error) {
    return adminErrorResponse(error, "login");
  }
}
