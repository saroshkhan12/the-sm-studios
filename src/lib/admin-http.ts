import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  AdminInputError,
  AdminSetupError,
  getAdminSession,
} from "@/lib/admin-auth";

export class AdminRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AdminRequestError";
  }
}

export async function readAdminJson(
  request: NextRequest,
  invalidMessage: string,
  maximumSize = 16 * 1024,
): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    throw new AdminRequestError("Send this request as JSON.", 415);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maximumSize) {
    throw new AdminRequestError("The request is too large.", 413);
  }

  const reader = request.body?.getReader();
  if (!reader) throw new AdminRequestError(invalidMessage, 400);
  const chunks: Uint8Array[] = [];
  let totalSize = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      totalSize += value.byteLength;
      if (totalSize > maximumSize) {
        await reader.cancel();
        throw new AdminRequestError("The request is too large.", 413);
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

  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new AdminRequestError(invalidMessage, 400);
  }
}

export function requestAdminToken(request: NextRequest) {
  return request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
}

export async function requestAdminSession(request: NextRequest) {
  return getAdminSession(requestAdminToken(request));
}

export function adminJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      Vary: "Cookie",
    },
  });
}

export function adminErrorResponse(error: unknown, operation: string) {
  if (error instanceof AdminRequestError) {
    return adminJson({ error: error.message }, error.status);
  }
  if (error instanceof AdminInputError) {
    return adminJson({ error: error.message }, 400);
  }
  if (error instanceof AdminSetupError) {
    return adminJson({ error: error.message }, 503);
  }
  console.error(`[Admin] ${operation} failed`, {
    errorType: error instanceof Error ? error.name : "UnknownError",
  });
  return adminJson(
    { error: "Admin storage is unavailable. Check the configured persistent writable storage." },
    503,
  );
}
