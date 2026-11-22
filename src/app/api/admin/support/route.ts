import { NextRequest } from "next/server";
import { listSupportMessages, updateSupportMessage, type SupportStatus } from "@/lib/support-inbox";
import { adminErrorResponse, adminJson, requestAdminSession, requestAdminToken } from "@/lib/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await requestAdminSession(request))) return adminJson({ error: "Authentication required." }, 401);
  try {
    return adminJson({ messages: await listSupportMessages() });
  } catch (error) {
    return adminErrorResponse(error, "support inbox read");
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await requestAdminSession(request))) return adminJson({ error: "Authentication required." }, 401);
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return adminJson({ error: "Invalid request." }, 400);
    const data = body as Record<string, unknown>;
    const id = typeof data.id === "string" ? data.id : "";
    const status = data.status as SupportStatus;
    if (!/^[a-f0-9]{24}$/.test(id) || !["open", "in_progress", "resolved"].includes(status)) {
      return adminJson({ error: "Choose a valid message and status." }, 400);
    }
    const updated = await updateSupportMessage(id, status);
    if (!updated) return adminJson({ error: "Message not found." }, 404);
    return adminJson({ success: true });
  } catch (error) {
    return adminErrorResponse(error, "support inbox update");
  }
}
