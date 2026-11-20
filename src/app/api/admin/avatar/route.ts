import { NextRequest, NextResponse } from "next/server";
import {
  removeAdminAvatar,
  readAdminAvatar,
  saveAdminAvatar,
} from "@/lib/admin-auth";
import {
  adminErrorResponse,
  adminJson,
  requestAdminSession,
} from "@/lib/admin-http";

export const runtime = "nodejs";

const maximumAvatarSize = 5 * 1024 * 1024;
const maximumRequestSize = maximumAvatarSize + 64 * 1024;

class AvatarTooLargeError extends Error {}

async function readBoundedFormData(request: NextRequest) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Avatar upload body is unavailable.");
  const chunks: Uint8Array[] = [];
  let totalSize = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      totalSize += value.byteLength;
      if (totalSize > maximumRequestSize) {
        await reader.cancel();
        throw new AvatarTooLargeError("Profile images must be 5 MB or smaller.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalSize);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const headers = new Headers(request.headers);
  headers.delete("content-length");
  return new Request(request.url, {
    method: "POST",
    headers,
    body: bytes,
  }).formData();
}

export async function GET(request: NextRequest) {
  if (!(await requestAdminSession(request))) {
    return adminJson({ error: "Authentication required." }, 401);
  }
  try {
    const avatar = await readAdminAvatar();
    if (!avatar) return new NextResponse(null, { status: 404 });
    return new NextResponse(new Uint8Array(avatar.buffer), {
      headers: {
        "Content-Type": avatar.mime,
        "Content-Length": String(avatar.buffer.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (error) {
    return adminErrorResponse(error, "avatar read");
  }
}

export async function POST(request: NextRequest) {
  if (!(await requestAdminSession(request))) {
    return adminJson({ error: "Authentication required." }, 401);
  }
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maximumRequestSize) {
    return adminJson({ error: "Profile images must be 5 MB or smaller." }, 413);
  }

  let form: FormData;
  try {
    form = await readBoundedFormData(request);
  } catch (error) {
    if (error instanceof AvatarTooLargeError) {
      return adminJson({ error: error.message }, 413);
    }
    return adminJson({ error: "Choose a valid image file." }, 400);
  }
  const file = form.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return adminJson({ error: "Choose an image to upload." }, 400);
  }
  if (file.size > maximumAvatarSize) {
    return adminJson({ error: "Profile images must be 5 MB or smaller." }, 413);
  }
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    return adminJson({ error: "Use a PNG, JPEG, or WebP image." }, 400);
  }

  try {
    const profile = await saveAdminAvatar(Buffer.from(await file.arrayBuffer()));
    return adminJson({ profile });
  } catch (error) {
    return adminErrorResponse(error, "avatar upload");
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await requestAdminSession(request))) {
    return adminJson({ error: "Authentication required." }, 401);
  }
  try {
    return adminJson({ profile: await removeAdminAvatar() });
  } catch (error) {
    return adminErrorResponse(error, "avatar removal");
  }
}
