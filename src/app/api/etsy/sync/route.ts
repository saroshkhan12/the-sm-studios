
import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getAdminSession } from "@/lib/admin-auth";
import { EtsyIntegrationError, syncEtsyProducts } from "@/lib/etsy";

export const runtime = 'nodejs';

function isValidSyncSecret(candidate: string | null, configured: string | undefined) {
  if (!candidate || !configured || candidate.length > 1024) return false;
  const candidateHash = createHash("sha256").update(candidate).digest();
  const configuredHash = createHash("sha256").update(configured).digest();
  return timingSafeEqual(candidateHash, configuredHash);
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
  );
  const trustedCron = isValidSyncSecret(
    request.headers.get("x-etsy-sync-secret"),
    process.env.ETSY_SYNC_SECRET,
  );
  if (!session && !trustedCron) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  try {
    const result = await syncEtsyProducts();
    return NextResponse.json({
      count: result.totalProducts,
      syncedAt: result.syncedAt,
      status: result.status,
      activeListings: result.activeListings,
      successfulProducts: result.successfulProducts,
      failedImageDownloads: result.failedImageDownloads,
    });
  }
  catch (error) {
    if (error instanceof EtsyIntegrationError) {
      console.error('[Etsy sync] Integration failure', { status: error.status, message: error.message });
      return NextResponse.json({ error: error.message }, { status: error.status >= 400 && error.status <= 599 ? error.status : 502 });
    }
    const message = error instanceof Error ? error.message : 'Etsy synchronization failed.';
    const safeMessage = /key|secret|token|authorization/i.test(message)
      ? 'Etsy rejected or failed to complete the synchronization.'
      : message;
    console.error('[Etsy sync] Unexpected failure', { message: safeMessage });
    return NextResponse.json({ error: safeMessage }, { status: 502 });
  }
}
