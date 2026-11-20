import { NextRequest } from "next/server";
import {
  getAdminProfile,
  updateAdminPreferences,
  updateAdminProfile,
} from "@/lib/admin-auth";
import {
  adminErrorResponse,
  adminJson,
  readAdminJson,
  requestAdminSession,
} from "@/lib/admin-http";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!(await requestAdminSession(request))) {
    return adminJson({ error: "Authentication required." }, 401);
  }
  try {
    return adminJson({ profile: await getAdminProfile() });
  } catch (error) {
    return adminErrorResponse(error, "profile read");
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await requestAdminSession(request))) {
    return adminJson({ error: "Authentication required." }, 401);
  }

  let body: unknown;
  try {
    body = await readAdminJson(request, "The profile request is invalid.");
  } catch (error) {
    return adminErrorResponse(error, "profile request");
  }
  if (!body || typeof body !== "object") {
    return adminJson({ error: "The profile request is invalid." }, 400);
  }

  const values = body as {
    fullName?: unknown;
    email?: unknown;
    preferences?: unknown;
  };
  if (values.preferences && typeof values.preferences === "object") {
    const preferences = values.preferences as Record<string, unknown>;
    const compactDashboard = preferences.compactDashboard;
    const reduceMotion = preferences.reduceMotion;
    if (
      (compactDashboard !== undefined && typeof compactDashboard !== "boolean") ||
      (reduceMotion !== undefined && typeof reduceMotion !== "boolean") ||
      (compactDashboard === undefined && reduceMotion === undefined) ||
      Object.keys(preferences).some(
        (key) => key !== "compactDashboard" && key !== "reduceMotion",
      )
    ) {
      return adminJson({ error: "Choose valid dashboard preferences." }, 400);
    }

    try {
      return adminJson({
        profile: await updateAdminPreferences({
          ...(compactDashboard !== undefined ? { compactDashboard } : {}),
          ...(reduceMotion !== undefined ? { reduceMotion } : {}),
        }),
      });
    } catch (error) {
      return adminErrorResponse(error, "preference update");
    }
  }

  if (typeof values.fullName !== "string" || typeof values.email !== "string") {
    return adminJson({ error: "Provide both a full name and email address." }, 400);
  }
  const fullName = values.fullName.trim();
  const email = values.email.trim();
  if (!fullName || fullName.length > 100) {
    return adminJson(
      { error: "Full name is required and must be 100 characters or fewer." },
      400,
    );
  }
  if (email.length > 254 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return adminJson({ error: "Enter a valid email address." }, 400);
  }

  try {
    return adminJson({
      profile: await updateAdminProfile({ fullName, email }),
    });
  } catch (error) {
    return adminErrorResponse(error, "profile update");
  }
}
