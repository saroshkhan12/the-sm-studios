
import { NextResponse } from 'next/server';
import { etsyConfigured, readEtsyProducts, readEtsySyncStatus } from '@/lib/etsy';
export const dynamic = 'force-dynamic';
export async function GET() {
  const [products, status] = await Promise.all([
    readEtsyProducts(),
    readEtsySyncStatus(),
  ]);
  return NextResponse.json({
    products,
    status,
    configured: etsyConfigured(),
    count: products.length,
  });
}
