import { NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  logoutAdminSession,
} from "@/lib/admin-auth";
import {
  adminErrorResponse,
  adminJson,
  requestAdminToken,
} from "@/lib/admin-http";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await logoutAdminSession(requestAdminToken(request));
    const response = adminJson({ ok: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    const response = adminErrorResponse(error, "logout");
    response.cookies.set(ADMIN_SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    return response;
  }
}
