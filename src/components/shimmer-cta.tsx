"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShimmerCta({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Button asChild size="lg" className="shimmer-cta">
      <Link href={href}>
        <span className="shimmer-cta-label">{children}</span>
        <ArrowUpRight size={16} aria-hidden="true" />
        <span className="shimmer-cta-sheen" aria-hidden="true" />
      </Link>
    </Button>
  );
}
