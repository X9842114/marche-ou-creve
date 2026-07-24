"use client";

import { TriangleAlert } from "lucide-react";
import { MAX_WARNINGS } from "@/types/participant";
import { cn } from "@/lib/utils";

export function warningLabel(warnings: number, eliminated: boolean) {
  if (eliminated || warnings >= MAX_WARNINGS) return "Éliminé";
  if (warnings === 0) return "En course";
  if (warnings === 1) return "1 avertissement";
  return `${warnings} avertissements`;
}

export function WarningMeter({
  count,
  eliminated = false,
  size = "md",
  interactive = false,
  disabled = false,
  onSet,
  className,
}: {
  count: number;
  eliminated?: boolean;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  disabled?: boolean;
  onSet?: (n: number) => void;
  className?: string;
}) {
  const dim =
    size === "sm"
      ? "size-2.5"
      : size === "lg"
        ? "size-4"
        : "size-3.5";

  return (
    <div
      className={cn("inline-flex items-center gap-1.5", className)}
      role={interactive ? "group" : "img"}
      aria-label={warningLabel(count, eliminated)}
    >
      {Array.from({ length: MAX_WARNINGS }).map((_, i) => {
        const filled = i < count;
        const isKill = eliminated || count >= MAX_WARNINGS;
        const pip = (
          <span
            className={cn(
              "rounded-full transition",
              dim,
              filled
                ? isKill
                  ? "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.55)]"
                  : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.45)]"
                : "bg-white/15 ring-1 ring-white/10"
            )}
          />
        );

        if (!interactive || !onSet) return <span key={i}>{pip}</span>;

        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            title={`${i + 1} avertissement${i > 0 ? "s" : ""}`}
            onClick={() => onSet(count === i + 1 ? i : i + 1)}
            className={cn(
              "rounded-full p-0.5 transition hover:scale-110 disabled:opacity-40",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c084fc]/50"
            )}
          >
            {pip}
          </button>
        );
      })}
    </div>
  );
}

export function WarningBadge({
  warnings,
  eliminated,
}: {
  warnings: number;
  eliminated: boolean;
}) {
  const label = warningLabel(warnings, eliminated);
  const danger = eliminated || warnings >= MAX_WARNINGS;
  const warn = !danger && warnings > 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        danger && "bg-red-500/20 text-red-300 ring-1 ring-red-400/30",
        warn && "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25",
        !danger && !warn && "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25"
      )}
    >
      {(warn || danger) && <TriangleAlert className="size-3" />}
      {label}
    </span>
  );
}
