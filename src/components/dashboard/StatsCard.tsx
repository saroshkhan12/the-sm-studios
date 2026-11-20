"use client";

import { m, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";

type StatsCardProps = {
  title: string;
  value: number | string;
  change?: number;
  icon: LucideIcon;
  gradient: string;
  note?: string;
};

export function StatsCard({ title, value, change, icon: Icon, gradient, note }: StatsCardProps) {
  const reduceMotion = useReducedMotion();
  return (
    <m.article
      whileHover={reduceMotion ? undefined : { y: -5 }}
      transition={{ duration: 0.3 }}
      className="glass-card stats-card"
    >
      <div className="stats-card-copy">
        <p>{title}</p>
        <h2>
          {typeof value === "number" ? <AnimatedCounter value={value} /> : value}
        </h2>
        {typeof change === "number" && (
          <p className="stats-change"><ArrowUpRight size={16} /> {change}%</p>
        )}
        {note && <p className="stats-note">{note}</p>}
      </div>
      <div className={`stats-icon ${gradient}`} aria-hidden="true">
        <Icon size={24} />
      </div>
    </m.article>
  );
}
