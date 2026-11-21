import { NextRequest } from "next/server";
import { getAdminProfile, updateAdminPreferences, updateAdminProfile } from "@/lib/admin-auth";
import { adminErrorResponse, adminJson, readAdminJson, requestAdminSession, requestAdminToken } from "@/lib/admin-http";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  if (!(await requestAdminSession(request))) return adminJson({ error: "Authentication required." }, 401);
  try { return adminJson({ profile: await getAdminProfile(requestAdminToken(request) || "") }); }
  catch (error) { return adminErrorResponse(error, "profile read"); }
}
export async function PATCH(request: NextRequest) {
  if (!(await requestAdminSession(request))) return adminJson({ error: "Authentication required." }, 401);
  let body: unknown;
  try { body = await readAdminJson(request, "The profile request is invalid."); }
  catch (error) { return adminErrorResponse(error, "profile request"); }
  if (!body || typeof body !== "object") return adminJson({ error: "The profile request is invalid." }, 400);
  const values = body as { fullName?: unknown; email?: unknown; preferences?: unknown };
  try {
    if (values.preferences && typeof values.preferences === "object") {
      const p = values.preferences as Record<string, unknown>;
      if ((p.compactDashboard !== undefined && typeof p.compactDashboard !== "boolean") ||
          (p.reduceMotion !== undefined && typeof p.reduceMotion !== "boolean") ||
          (p.compactDashboard === undefined && p.reduceMotion === undefined) ||
          Object.keys(p).some((k) => k !== "compactDashboard" && k !== "reduceMotion")) {
        return adminJson({ error: "Choose valid dashboard preferences." }, 400);
      }
      return adminJson({ profile: await updateAdminPreferences(requestAdminToken(request) || "", {
        ...(p.compactDashboard !== undefined ? { compactDashboard: p.compactDashboard } : {}),
        ...(p.reduceMotion !== undefined ? { reduceMotion: p.reduceMotion } : {}),
      }) });
    }
    if (typeof values.fullName !== "string" || typeof values.email !== "string") return adminJson({ error: "Provide both a full name and email address." }, 400);
    const fullName=values.fullName.trim(), email=values.email.trim();
    if (!fullName || fullName.length>100) return adminJson({ error: "Full name is required and must be 100 characters or fewer." },400);
    if (email.length>254 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return adminJson({ error: "Enter a valid email address." },400);
    return adminJson({ profile: await updateAdminProfile(requestAdminToken(request) || "", { fullName,email }) });
  } catch(error) { return adminErrorResponse(error,"profile update"); }
}