"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  Dices,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogOut,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Skull,
  Trash2,
  Unlock,
  Users,
} from "lucide-react";
import { AdminGate } from "@/components/admin-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEvent } from "@/contexts/event-context";
import {
  DISTRICTS,
  PICKS_PER_DISTRICT,
  countByDistrict,
} from "@/lib/districts";
import { MAX_WARNINGS, type DistrictId, type Participant } from "@/types/participant";
import { cn } from "@/lib/utils";
import {
  WarningBadge,
  WarningMeter,
  warningLabel,
} from "@/components/warning-meter";
import "./admin.css";

function formatRegisteredAt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format Discord-friendly pour coller dans un salon */
function formatPickedForDiscord(
  groups: { label: string; picked: Participant[] }[]
) {
  const blocks = groups
    .filter((g) => g.picked.length > 0)
    .map((g) => {
      const lines = g.picked.map(
        (p) =>
          `• ${p.prenom} ${p.nom} - Matricule \`${p.matricule}\` - ID \`${p.idUnique}\`${
            p.status === "elimine" ? " *(éliminé)*" : ""
          }`
      );
      return `**${g.label}** (${g.picked.length})\n${lines.join("\n")}`;
    });

  if (blocks.length === 0) return "";
  return `📋 **Sélection Marche ou Crève**\n\n${blocks.join("\n\n")}`;
}

async function copyText(text: string, okMessage: string) {
  if (!text.trim()) {
    toast.error("Rien à copier");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    toast.success(okMessage);
  } catch {
    toast.error("Impossible de copier");
  }
}

function StatusPill({
  on,
  onLabel,
  offLabel,
}: {
  on: boolean;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        on
          ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30"
          : "bg-white/8 text-white/55 ring-1 ring-white/10"
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          on ? "bg-emerald-400" : "bg-white/35"
        )}
      />
      {on ? onLabel : offLabel}
    </span>
  );
}

function AdminDashboard() {
  const {
    participants,
    settings,
    loading,
    refresh,
    setMode,
    setShowDrawn,
    runMixerAll,
    runMixerDistrict,
    resetMixer,
    patchRace,
    removeParticipant,
    logout,
  } = useEvent();
  const [mixingAll, setMixingAll] = useState(false);
  const [mixingDistrict, setMixingDistrict] = useState<DistrictId | null>(null);
  const [raceBusy, setRaceBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [raceFilter, setRaceFilter] = useState<"all" | "warned" | "out">("all");

  const selected = useMemo(
    () => participants.filter((p) => p.selected),
    [participants]
  );

  const byDistrict = useMemo(() => {
    return DISTRICTS.map((d) => ({
      ...d,
      list: participants.filter((p) => p.district === d.id),
      picked: participants.filter((p) => p.district === d.id && p.selected),
    }));
  }, [participants]);

  const filteredParticipants = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return participants;
    return participants.filter((p) => {
      const hay = `${p.prenom} ${p.nom} ${p.matricule} ${p.idUnique}`.toLowerCase();
      return hay.includes(q);
    });
  }, [participants, query]);

  async function handleSetMode(mode: "inscription" | "closed") {
    try {
      await setMode(mode);
      toast.success(
        mode === "closed" ? "Inscriptions fermées" : "Inscriptions rouvertes"
      );
    } catch {
      toast.error("Impossible de changer le mode");
    }
  }

  async function handleToggleShowDrawn() {
    const next = !settings.showDrawn;
    try {
      await setShowDrawn(next);
      toast.success(
        next ? "Sélection visible sur le site" : "Sélection masquée du site"
      );
    } catch {
      toast.error("Impossible de publier");
    }
  }

  async function handleMixerAll() {
    setMixingAll(true);
    try {
      const data = await runMixerAll();
      toast.success(
        `${data.totalPicked} agents tirés (${PICKS_PER_DISTRICT}/district)`
      );
    } catch {
      toast.error("Erreur tirage");
    } finally {
      setMixingAll(false);
    }
  }

  async function handleMixerDistrict(district: DistrictId) {
    setMixingDistrict(district);
    try {
      const block = await runMixerDistrict(district);
      toast.success(`${block.label} : ${block.picked.length} tiré(s)`);
    } catch {
      toast.error("Erreur tirage");
    } finally {
      setMixingDistrict(null);
    }
  }

  async function handleResetMixer() {
    if (!window.confirm("Réinitialiser tous les tirages ?")) return;
    try {
      await resetMixer();
      toast.success("Tirages réinitialisés");
    } catch {
      toast.error("Impossible de réinitialiser");
    }
  }

  async function handlePatchRace(
    id: string,
    body: { warnings?: number; status?: "en_course" | "elimine" },
    name?: string
  ) {
    setRaceBusy(id);
    try {
      const result = await patchRace(id, body);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      const p = result.participant;
      const label = name ?? `${p.prenom} ${p.nom}`;
      if (p.status === "elimine") {
        toast.error(`${label} est éliminé`);
      } else if (typeof body.warnings === "number") {
        toast.message(
          `${label} · ${warningLabel(p.warnings, false)} (${p.warnings}/${MAX_WARNINGS})`
        );
      } else {
        toast.success(`${label} remis en course`);
      }
    } finally {
      setRaceBusy(null);
    }
  }

  function handleWarn(id: string, next: number, name: string) {
    handlePatchRace(id, { warnings: next }, name);
  }

  function handleEliminate(id: string, name: string) {
    if (!window.confirm(`Éliminer ${name} ?`)) return;
    handlePatchRace(
      id,
      { status: "elimine", warnings: MAX_WARNINGS },
      name
    );
  }

  function handleRestore(id: string, name: string, warnings: number) {
    handlePatchRace(
      id,
      {
        status: "en_course",
        warnings: Math.min(warnings, MAX_WARNINGS - 1),
      },
      name
    );
  }

  async function handleRemove(id: string, name: string) {
    if (!window.confirm(`Retirer ${name} des inscrits ?`)) return;
    const result = await removeParticipant(id);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Inscrit retiré");
  }

  async function handleLogout() {
    await logout();
  }

  const busy = mixingAll || mixingDistrict !== null;
  const inscriptionsOpen = settings.mode === "inscription";

  const raceList = useMemo(() => {
    const list = [...selected].sort((a, b) => {
      if (a.status !== b.status) return a.status === "elimine" ? 1 : -1;
      return b.warnings - a.warnings || a.prenom.localeCompare(b.prenom);
    });
    if (raceFilter === "warned") {
      return list.filter((p) => p.warnings > 0 && p.status !== "elimine");
    }
    if (raceFilter === "out") {
      return list.filter((p) => p.status === "elimine");
    }
    return list;
  }, [selected, raceFilter]);

  const raceStats = useMemo(
    () => ({
      ok: selected.filter((p) => p.status !== "elimine" && p.warnings === 0)
        .length,
      warned: selected.filter(
        (p) => p.status !== "elimine" && p.warnings > 0
      ).length,
      out: selected.filter((p) => p.status === "elimine").length,
    }),
    [selected]
  );

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Link href="/" className="moc-back w-fit">
            <ArrowLeft className="size-3.5" />
            Retour au site
          </Link>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Administration
              </h1>
              <p className="mt-0.5 text-sm text-white/50">
                {participants.length} inscrits · {selected.length} tirés
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pb-0.5">
              <StatusPill
                on={Boolean(inscriptionsOpen)}
                onLabel="Inscriptions ouvertes"
                offLabel="Inscriptions fermées"
              />
              <StatusPill
                on={Boolean(settings.showDrawn)}
                onLabel="Sélection publiée"
                offLabel="Sélection masquée"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="admin-btn"
            onClick={() => refresh()}
            disabled={loading}
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            Actualiser
          </Button>
          <Button
            size="sm"
            className="admin-btn"
            variant={settings.showDrawn ? "default" : "secondary"}
            onClick={handleToggleShowDrawn}
            disabled={loading}
          >
            {settings.showDrawn ? (
              <Eye className="size-3.5" />
            ) : (
              <EyeOff className="size-3.5" />
            )}
            {settings.showDrawn ? "Masquer sélection" : "Publier sélection"}
          </Button>
          {inscriptionsOpen ? (
            <Button
              size="sm"
              variant="secondary"
              className="admin-btn"
              onClick={() => handleSetMode("closed")}
            >
              <Lock className="size-3.5" />
              Fermer inscriptions
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              className="admin-btn"
              onClick={() => handleSetMode("inscription")}
            >
              <Unlock className="size-3.5" />
              Rouvrir inscriptions
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="admin-btn text-white/60 hover:text-white"
            onClick={handleLogout}
            title="Déconnexion"
          >
            <LogOut className="size-3.5" />
            Quitter
          </Button>
        </div>
      </header>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="admin-stat">
          <Users className="size-4 text-[#c084fc]" />
          <div>
            <p className="admin-stat__label">Inscrits</p>
            <p className="admin-stat__value">{participants.length}</p>
          </div>
        </div>
        <div className="admin-stat">
          <Dices className="size-4 text-[#c084fc]" />
          <div>
            <p className="admin-stat__label">Tirés</p>
            <p className="admin-stat__value">{selected.length}</p>
          </div>
        </div>
        <div className="admin-stat">
          <Skull className="size-4 text-red-400" />
          <div>
            <p className="admin-stat__label">Éliminés</p>
            <p className="admin-stat__value">
              {selected.filter((p) => p.status === "elimine").length}
            </p>
          </div>
        </div>
      </div>

      <section className="admin-panel mb-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/8 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              Tirage par district
            </h2>
            <p className="mt-1 text-sm text-white/45">
              {PICKS_PER_DISTRICT} personnes max par district
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selected.length > 0 && (
              <Button
                variant="outline"
                className="admin-btn"
                onClick={() =>
                  void copyText(
                    formatPickedForDiscord(byDistrict),
                    "Sélection copiée - colle sur Discord"
                  )
                }
                disabled={busy}
              >
                <Copy className="size-3.5" />
                Copier tout (Discord)
              </Button>
            )}
            <Button
              className="admin-btn admin-btn--primary"
              onClick={handleMixerAll}
              disabled={busy || participants.length === 0}
            >
              {mixingAll ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Dices className="size-4" />
              )}
              Tout tirer
            </Button>
            {selected.length > 0 && (
              <Button
                variant="outline"
                className="admin-btn"
                onClick={handleResetMixer}
                disabled={busy}
              >
                <RotateCcw className="size-3.5" />
                Reset tirages
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {byDistrict.map((d) => {
            const n = d.list.length;
            const picked = d.picked.length;
            const mixing = mixingDistrict === d.id;
            const pct = Math.min(100, (picked / PICKS_PER_DISTRICT) * 100);
            const Icon = d.icon;
            return (
              <div key={d.id} className="admin-district">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex items-start gap-2">
                    <span
                      className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg"
                      style={{
                        color: d.color,
                        background: `${d.color}20`,
                      }}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        {d.label}
                      </p>
                      <p className="mt-0.5 text-xs text-white/45">
                        {picked}/{PICKS_PER_DISTRICT} tirés · {n} inscrits
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {d.picked.length > 0 && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="admin-btn"
                        title="Copier ce district pour Discord"
                        onClick={() =>
                          void copyText(
                            formatPickedForDiscord([
                              { label: d.label, picked: d.picked },
                            ]),
                            `${d.label} copié`
                          )
                        }
                      >
                        <Copy className="size-3.5" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      className="admin-btn"
                      disabled={busy || n === 0}
                      onClick={() => handleMixerDistrict(d.id)}
                    >
                      {mixing ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Dices className="size-3.5" />
                      )}
                      Tirer
                    </Button>
                  </div>
                </div>
                <div className="admin-progress" aria-hidden>
                  <div
                    className="admin-progress__bar"
                    style={{
                      width: `${pct}%`,
                      background: d.color,
                    }}
                  />
                </div>
                {d.picked.length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {d.picked.map((p) => (
                      <li
                        key={p.id}
                        className={cn(
                          "rounded-lg bg-black/40 px-2.5 py-2 ring-1 ring-white/8",
                          p.status === "elimine" && "opacity-50"
                        )}
                      >
                        <p className="truncate text-sm font-semibold text-white">
                          {p.prenom} {p.nom}
                          {p.status === "elimine" ? " · Out" : ""}
                          {p.warnings > 0 ? ` · ${p.warnings}⚠` : ""}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-white/55">
                          Matricule {p.matricule}
                          <span className="text-white/25"> · </span>
                          ID {p.idUnique}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-white/35">Aucun tirage</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {selected.length > 0 && (
        <section className="admin-panel mb-5 overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/8 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                Course · avertissements
              </h2>
              <p className="mt-1 text-sm text-white/45">
                Clique sur les pastilles pour régler · 3 = éliminé
              </p>
              <p className="mt-2 text-xs text-white/40">
                {raceStats.ok} en course · {raceStats.warned} avertis ·{" "}
                {raceStats.out} éliminés
              </p>
            </div>
            <div className="flex flex-wrap gap-1 rounded-xl bg-black/40 p-1 ring-1 ring-white/10">
              {(
                [
                  ["all", "Tous"],
                  ["warned", "Avertis"],
                  ["out", "Éliminés"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRaceFilter(id)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                    raceFilter === id
                      ? "bg-white text-black"
                      : "text-white/50 hover:text-white"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-white/6">
            {raceList.length === 0 ? (
              <p className="p-8 text-center text-sm text-white/40">
                Personne dans ce filtre.
              </p>
            ) : (
              raceList.map((p) => {
                const dead = p.status === "elimine";
                const busyRow = raceBusy === p.id;
                const name = `${p.prenom} ${p.nom}`;
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "flex flex-wrap items-center gap-3 px-5 py-4",
                      dead && "bg-red-500/10",
                      !dead && p.warnings > 0 && "bg-amber-500/[0.04]"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-white">
                          {name}
                        </p>
                        <WarningBadge
                          warnings={p.warnings}
                          eliminated={dead}
                        />
                      </div>
                      <p className="mt-1 text-xs text-white/45">
                        {DISTRICTS.find((d) => d.id === p.district)?.label} ·
                        Matricule{" "}
                        <span className="font-mono text-white/70">
                          {p.matricule}
                        </span>{" "}
                        · ID{" "}
                        <span className="font-mono text-white/70">
                          {p.idUnique}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                      <WarningMeter
                        count={p.warnings}
                        eliminated={dead}
                        size="lg"
                        interactive
                        disabled={busyRow}
                        onSet={(n) => handleWarn(p.id, n, name)}
                      />
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-white/35">
                        {p.warnings}/{MAX_WARNINGS}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-xl bg-black/40 p-1 ring-1 ring-white/10">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="admin-stepper-btn"
                        disabled={busyRow || p.warnings <= 0}
                        title="Retirer 1 avertissement"
                        onClick={() =>
                          handleWarn(p.id, p.warnings - 1, name)
                        }
                      >
                        <Minus className="size-3.5" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="admin-stepper-btn"
                        disabled={busyRow || p.warnings >= MAX_WARNINGS}
                        title="Ajouter 1 avertissement"
                        onClick={() =>
                          handleWarn(p.id, p.warnings + 1, name)
                        }
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>

                    {dead ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="admin-btn"
                        disabled={busyRow}
                        onClick={() =>
                          handleRestore(p.id, name, p.warnings)
                        }
                      >
                        <RotateCcw className="size-3.5" />
                        Remettre
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="admin-btn"
                        disabled={busyRow}
                        onClick={() => handleEliminate(p.id, name)}
                      >
                        <Skull className="size-3.5" />
                        Éliminer
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      <section className="admin-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              Tous les inscrits
            </h2>
            <p className="mt-1 text-sm text-white/45">
              {filteredParticipants.length}
              {query ? ` résultat${filteredParticipants.length > 1 ? "s" : ""}` : ""}{" "}
              · {participants.length} au total
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-white/35" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher nom, matricule…"
              className="admin-search h-9 border-white/10 bg-black/50 pl-9 text-white placeholder:text-white/30"
            />
          </div>
        </div>

        <div className="divide-y divide-white/6">
          {participants.length === 0 ? (
            <p className="p-8 text-center text-sm text-white/40">
              Aucun inscrit pour le moment.
            </p>
          ) : filteredParticipants.length === 0 ? (
            <p className="p-8 text-center text-sm text-white/40">
              Aucun résultat pour « {query} ».
            </p>
          ) : (
            DISTRICTS.map((d) => {
              const list = filteredParticipants.filter(
                (p) => p.district === d.id
              );
              if (list.length === 0) return null;
              return (
                <div key={d.id}>
                  <div className="sticky top-0 z-[1] bg-[#12101a] px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-white/50">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ background: d.color }}
                      />
                      {d.label} · {list.length} ·{" "}
                      {countByDistrict(selected, d.id)} tirés
                    </span>
                  </div>
                  {list.map((p) => (
                    <div
                      key={p.id}
                      className="group flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.03]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {p.prenom} {p.nom}
                          {p.selected && (
                            <span className="ml-2 rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                              Tirage
                            </span>
                          )}
                          {p.selected && p.status === "elimine" && (
                            <span className="ml-1 rounded-md bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-300">
                              Out
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-white/45">
                          <span className="text-white/70">{p.matricule}</span>
                          {" · "}
                          {p.idUnique}
                          {p.selected && p.warnings > 0
                            ? ` · ${p.warnings} avert.`
                            : ""}
                        </p>
                        <p className="mt-0.5 text-[11px] text-white/30">
                          Inscrit le {formatRegisteredAt(p.registeredAt)}
                        </p>
                      </div>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="opacity-60 transition group-hover:opacity-100 hover:bg-red-500/15"
                        onClick={() =>
                          handleRemove(p.id, `${p.prenom} ${p.nom}`)
                        }
                        title="Supprimer"
                      >
                        <Trash2 className="size-3.5 text-red-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminDashboard />
    </AdminGate>
  );
}
