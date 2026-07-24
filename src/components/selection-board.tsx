"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Dices } from "lucide-react";
import { DISTRICTS } from "@/lib/districts";
import { WarningBadge, WarningMeter } from "@/components/warning-meter";
import type { Participant } from "@/types/participant";
import { cn } from "@/lib/utils";

export function SelectionBoard({
  participants,
  compact = false,
}: {
  participants: Participant[];
  compact?: boolean;
}) {
  const reduce = useReducedMotion();

  const byDistrict = useMemo(
    () =>
      DISTRICTS.map((d) => ({
        ...d,
        list: participants.filter((p) => p.district === d.id),
      })).filter((d) => d.list.length > 0),
    [participants]
  );

  const alive = participants.filter((p) => p.status !== "elimine").length;
  const out = participants.length - alive;

  if (participants.length === 0) {
    return (
      <div className="rounded-2xl bg-[#12101a] px-5 py-8 text-center ring-1 ring-white/10">
        <p className="font-semibold text-white">Aucun tirage pour l’instant</p>
        <p className="mt-1 text-sm text-white/45">
          La sélection a été publiée, mais personne n’a encore été tiré.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-wrap items-center justify-center gap-2 text-center"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c084fc]/15 px-3 py-1 text-xs font-semibold text-[#e9d5ff] ring-1 ring-[#c084fc]/30">
          <Dices className="size-3.5" />
          Tirage publié
        </span>
        <span className="text-sm text-white/50">
          {alive} en course · {out} éliminé{out > 1 ? "s" : ""}
        </span>
      </motion.div>

      <div className={cn("space-y-3", compact && "space-y-2.5")}>
        {byDistrict.map((d, di) => {
          const Icon = d.icon;
          return (
            <motion.section
              key={d.id}
              initial={reduce ? false : { opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.45,
                delay: reduce ? 0 : 0.12 + di * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="overflow-hidden rounded-2xl bg-[#12101a] ring-1 ring-white/10"
            >
              <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
                <span
                  className="grid size-8 place-items-center rounded-lg"
                  style={{ color: d.color, background: `${d.color}20` }}
                >
                  <Icon className="size-4" />
                </span>
                <h3 className="font-semibold text-white">{d.label}</h3>
                <span className="ml-auto font-mono text-xs text-white/40">
                  {d.list.length}
                </span>
              </div>

              <ul className="divide-y divide-white/5">
                {d.list.map((p, pi) => {
                  const dead = p.status === "elimine";
                  return (
                    <motion.li
                      key={p.id}
                      initial={
                        reduce ? false : { opacity: 0, x: -12, filter: "blur(4px)" }
                      }
                      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                      transition={{
                        duration: 0.4,
                        delay: reduce ? 0 : 0.22 + di * 0.1 + pi * 0.06,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className={cn(
                        "flex flex-wrap items-center gap-3 px-4 py-3",
                        dead && "bg-red-500/5 opacity-70",
                        !dead && p.warnings > 0 && "bg-amber-500/[0.04]"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {p.prenom} {p.nom}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-white/45">
                          Matricule {p.matricule}
                          {!compact && (
                            <>
                              <span className="text-white/25"> · </span>
                              ID {p.idUnique}
                            </>
                          )}
                        </p>
                      </div>
                      <WarningBadge
                        warnings={p.warnings}
                        eliminated={dead}
                      />
                      <WarningMeter
                        count={p.warnings}
                        eliminated={dead}
                        size="md"
                      />
                    </motion.li>
                  );
                })}
              </ul>
            </motion.section>
          );
        })}
      </div>
    </div>
  );
}
