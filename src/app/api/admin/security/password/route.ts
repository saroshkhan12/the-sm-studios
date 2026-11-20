import { NextRequest } from "next/server";
import {
  ADMIN_PASSWORD_MIN_LENGTH,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  changeAdminPassword,
} from "@/lib/admin-auth";
import {
  adminErrorResponse,
  adminJson,
  readAdminJson,
  requestAdminSession,
  requestAdminToken,
} from "@/lib/admin-http";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!(await requestAdminSession(request))) {
    return adminJson({ error: "Authentication required." }, 401);
  }

  let body: unknown;
  try {
    body = await readAdminJson(request, "The password request is invalid.");
  } catch (error) {
    return adminErrorResponse(error, "password request");
  }
  if (!body || typeof body !== "object") {
    return adminJson({ error: "The password request is invalid." }, 400);
  }
  const values = body as {
    currentPassword?: unknown;
    newPassword?: unknown;
    confirmPassword?: unknown;
  };
  if (
    typeof values.currentPassword !== "string" ||
    typeof values.newPassword !== "string" ||
    typeof values.confirmPassword !== "string"
  ) {
    return adminJson({ error: "Complete all password fields." }, 400);
  }
  if (values.newPassword.length < ADMIN_PASSWORD_MIN_LENGTH) {
    return adminJson(
      { error: `Use at least ${ADMIN_PASSWORD_MIN_LENGTH} characters for your new password.` },
      400,
    );
  }
  if (values.newPassword.length > 1024) {
    return adminJson({ error: "The new password is too long." }, 400);
  }
  if (values.newPassword !== values.confirmPassword) {
    return adminJson({ error: "The new passwords do not match." }, 400);
  }
  if (values.newPassword === values.currentPassword) {
    return adminJson({ error: "Choose a different new password." }, 400);
  }

  try {
    const replacement = await changeAdminPassword(
      requestAdminToken(request) || "",
      values.currentPassword,
      values.newPassword,
      request.headers.get("user-agent") || "Unknown browser",
    );
    if (!replacement) {
      return adminJson({ error: "The current password is incorrect." }, 400);
    }

    const response = adminJson({ ok: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, replacement.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE,
    });
    return response;
  } catch (error) {
    return adminErrorResponse(error, "password change");
  }
}
