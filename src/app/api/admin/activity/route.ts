import { NextRequest } from "next/server";
import { readAdminActivity } from "@/lib/admin-auth";
import { adminErrorResponse, adminJson, requestAdminSession, requestAdminToken } from "@/lib/admin-http";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  if (!(await requestAdminSession(request))) return adminJson({ error: "Authentication required." }, 401);
  try { return adminJson({ activity: await readAdminActivity(requestAdminToken(request) || "") }); }
  catch (error) { return adminErrorResponse(error, "activity read"); }
}