import { NextRequest } from "next/server";
import {
  listAdminSessions,
  revokeOtherAdminSessions,
} from "@/lib/admin-auth";
import {
  adminErrorResponse,
  adminJson,
  requestAdminSession,
  requestAdminToken,
} from "@/lib/admin-http";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!(await requestAdminSession(request))) {
    return adminJson({ error: "Authentication required." }, 401);
  }
  try {
    return adminJson({
      sessions: await listAdminSessions(requestAdminToken(request) || ""),
    });
  } catch (error) {
    return adminErrorResponse(error, "session list");
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await requestAdminSession(request))) {
    return adminJson({ error: "Authentication required." }, 401);
  }
  try {
    return adminJson({
      revoked: await revokeOtherAdminSessions(requestAdminToken(request) || ""),
      sessions: await listAdminSessions(requestAdminToken(request) || ""),
    });
  } catch (error) {
    return adminErrorResponse(error, "session revocation");
  }
}
