
"use client";

import { memo, useEffect } from "react";
import { animate, m, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

export type StatsCardProps = {
  title: string;
  value: string | number;
  change?: string | number;
  icon?: LucideIcon;
  gradient?: string;
};

const StatsCard = memo(function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  gradient = "from-[#C6A477] to-[#762F3C]",
}: StatsCardProps) {
  const reduceMotion = useReducedMotion();
  const count = useMotionValue(0);
  const displayValue = useTransform(count, (latest) =>
    typeof value === "number" ? Math.round(latest).toLocaleString() : value,
  );

  useEffect(() => {
    if (typeof value !== "number" || reduceMotion) {
      count.set(typeof value === "number" ? value : 0);
      return;
    }
    const controls = animate(count, value, { duration: 0.8, ease: "easeOut" });
    return controls.stop;
  }, [count, reduceMotion, value]);

  return (
    <m.article
      whileHover={reduceMotion ? undefined : { y: -5 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="glass-card group rounded-2xl p-5 sm:p-6"
      aria-label={`${title}: ${value}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-[0.12em] text-[#B8B3AD] uppercase">
            {title}
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-[#F5F0E8] sm:text-3xl">
            {typeof value === "number" ? <m.span>{displayValue}</m.span> : value}
          </p>
          {change !== undefined && (
            <p className="mt-2 flex items-center gap-1 text-xs font-medium text-[#C6A477]">
              <ArrowUpRight size={15} aria-hidden="true" />
              <span>{typeof change === "number" ? `${change}%` : change}</span>
            </p>
          )}
        </div>

        <div
          className={`shrink-0 rounded-xl bg-gradient-to-br ${gradient} p-3 shadow-md transition-transform duration-300 group-hover:scale-105`}
        >
          {Icon ? <Icon size={23} className="text-white" aria-hidden="true" /> : null}
        </div>
      </div>
    </m.article>
  );
});

StatsCard.displayName = "StatsCard";

export default StatsCard;
