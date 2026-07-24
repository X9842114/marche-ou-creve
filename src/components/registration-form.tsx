"use client";

import { useState, type ComponentType, type CSSProperties } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Fingerprint,
  Hash,
  Loader2,
  Lock,
  User,
  UserRound,
} from "lucide-react";
import { GlassFormCard } from "@/components/ui/glass-form-card";
import { Input } from "@/components/ui/input";
import { useEvent } from "@/contexts/event-context";
import { DISTRICTS, getDistrict } from "@/lib/districts";
import {
  AVAILABILITY_SLOTS,
  EVENT_FLOW,
  EVENT_RULES,
  REWARD_ILLEGAL_WIN,
  REWARD_LE_WIN,
} from "@/lib/event-info";
import {
  districtSchema,
  idUniqueSchema,
  matriculeSchema,
  nameSchema,
} from "@/lib/validation";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  nom: nameSchema,
  prenom: nameSchema,
  matricule: matriculeSchema,
  idUnique: idUniqueSchema,
  district: districtSchema,
});

type FormValues = z.infer<typeof formSchema>;
type FocusKey = "prenom" | "nom" | "matricule" | "idUnique" | null;

function RulesGate({
  submitting,
  onAccept,
  onBack,
}: {
  submitting: boolean;
  onAccept: () => void;
  onBack: () => void;
}) {
  const [checked, setChecked] = useState(false);
  const slot = AVAILABILITY_SLOTS[0];

  return (
    <div className="space-y-4">
      <h2 className="text-center text-xl font-bold text-white">Règlement</h2>

      <div className="max-h-[420px] space-y-5 overflow-y-auto rounded-xl bg-[#0c0a14] p-4 ring-1 ring-white/10">
        <section>
          <h3 className="mb-2 text-base font-bold text-sky-300">Quand ?</h3>
          <p className="text-lg font-semibold text-white">
            {slot.day} · {slot.time}
          </p>
          <p className="mt-1 text-base text-white/60">Durée indéterminée</p>
        </section>

        <section>
          <h3 className="mb-2 text-base font-bold text-[#c084fc]">
            Déroulement
          </h3>
          {EVENT_FLOW.map((line) => (
            <p key={line} className="mb-2 text-base leading-snug text-white">
              • {line}
            </p>
          ))}
        </section>

        <section>
          <h3 className="mb-2 text-base font-bold text-white">Règles</h3>
          {EVENT_RULES.map((line, i) => {
            const isWeapons = i === 0;
            const isWinCondition = i === EVENT_RULES.length - 1;
            return (
              <p
                key={line}
                className={cn(
                  "mb-2 text-base leading-snug",
                  isWeapons && "font-semibold text-red-300",
                  isWinCondition && "font-semibold text-amber-300",
                  !isWeapons && !isWinCondition && "text-white"
                )}
              >
                {i + 1}. {line}
              </p>
            );
          })}
        </section>

        <section>
          <h3 className="mb-2 text-base font-bold text-emerald-300">
            Si les forces de l&apos;ordre gagnent
          </h3>
          {REWARD_LE_WIN.map((line, i) => (
            <p
              key={line}
              className={cn(
                "mb-2 text-base leading-snug",
                i === 0 ? "font-semibold text-emerald-200" : "text-white"
              )}
            >
              • {line}
            </p>
          ))}
        </section>

        <section>
          <h3 className="mb-2 text-base font-bold text-red-300">
            Si les organisations illégales gagnent
          </h3>
          {REWARD_ILLEGAL_WIN.map((line, i) => (
            <p
              key={line}
              className={cn(
                "mb-2 text-base leading-snug",
                i === 0 ? "font-semibold text-red-200" : "text-white"
              )}
            >
              • {line}
            </p>
          ))}
        </section>
      </div>

      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => setChecked((v) => !v)}
        className={cn(
          "flex w-full items-start gap-3.5 rounded-xl px-4 py-3.5 text-left transition ring-1",
          checked
            ? "bg-[#c084fc]/15 ring-[#c084fc]/45"
            : "bg-[#0c0a14] ring-white/15 hover:ring-white/30"
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition",
            checked
              ? "border-[#c084fc] bg-[#c084fc] text-black"
              : "border-white/35 bg-black/40 text-transparent"
          )}
        >
          <Check className="size-3.5 stroke-[3]" />
        </span>
        <span className="min-w-0">
          <span className="block text-base font-semibold text-white">
            J&apos;ai lu et j&apos;accepte le règlement
          </span>
          <span className="mt-1 block text-sm text-white/55">
            Disponible le{" "}
            <strong className="text-white/80">{slot.day}</strong> à{" "}
            <strong className="text-white/80">21h30</strong> (durée
            indéterminée)
          </span>
        </span>
      </button>

      <motion.button
        type="button"
        whileHover={checked && !submitting ? { scale: 1.008 } : undefined}
        whileTap={checked && !submitting ? { scale: 0.992 } : undefined}
        disabled={!checked || submitting}
        onClick={onAccept}
        className="w-full disabled:cursor-not-allowed disabled:opacity-45"
      >
        <div className="flex h-11 items-center justify-center rounded-lg bg-white text-sm font-semibold text-black">
          {submitting ? (
            <Loader2 className="size-4 animate-spin text-black/70" />
          ) : (
            <span className="flex items-center gap-1.5">
              Accepter et valider
              <ArrowRight className="size-3.5" />
            </span>
          )}
        </div>
      </motion.button>

      <button
        type="button"
        onClick={onBack}
        disabled={submitting}
        className="w-full py-2 text-sm text-white/50 hover:text-white disabled:opacity-45"
      >
        ← Modifier mon dossier
      </button>
    </div>
  );
}

function GlassField({
  label,
  icon: Icon,
  error,
  focused,
  children,
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  error?: string;
  focused?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={cn("relative space-y-1.5", focused && "z-10")}
      whileHover={{ scale: 1.005 }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
    >
      <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55">
        <Icon
          className={cn(
            "size-3.5",
            focused ? "text-white" : "text-[#c084fc]"
          )}
        />
        {label}
      </label>
      <div className="relative flex items-center overflow-hidden rounded-lg">
        {children}
        {focused ? (
          <motion.div
            layoutId="reg-input-highlight"
            className="absolute inset-0 -z-10 bg-white/5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        ) : null}
      </div>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </motion.div>
  );
}

function SuccessRecap({
  data,
  onAgain,
}: {
  data: FormValues;
  onAgain: () => void;
}) {
  const d = getDistrict(data.district);
  const rows = [
    { label: "Prénom", value: data.prenom },
    { label: "Nom", value: data.nom },
    { label: "Matricule", value: data.matricule },
    { label: "ID unique", value: data.idUnique },
    { label: "District", value: d.label },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 16 }}
          className="relative mb-3 flex size-14 items-center justify-center"
        >
          <motion.span
            className="absolute inset-0 rounded-full bg-emerald-400/20"
            initial={{ scale: 0.6, opacity: 0.8 }}
            animate={{ scale: 1.55, opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />
          <div className="relative flex size-14 items-center justify-center rounded-full border border-emerald-400/35 bg-emerald-500/15 text-emerald-300">
            <CheckCircle2 className="size-7" />
          </div>
        </motion.div>
        <p className="text-lg font-semibold text-white">Inscription validée</p>
        <p className="mt-1 text-sm text-white/50">
          Voici le récapitulatif de ton dossier
        </p>
      </div>

      <div className="rounded-xl bg-[#c084fc]/12 px-4 py-3.5 text-center ring-1 ring-[#c084fc]/30">
        <p className="text-sm font-semibold text-[#e9d5ff]">
          Cérémonie de sélection
        </p>
        <p className="mt-1.5 text-sm leading-snug text-white/75">
          Une cérémonie avec tous les districts annoncera les personnes
          sélectionnées.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
        {rows.map((row, i) => (
          <motion.div
            key={row.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.06 }}
            className={cn(
              "flex items-center justify-between gap-3 px-3.5 py-2.5",
              i < rows.length - 1 && "border-b border-white/5"
            )}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
              {row.label}
            </span>
            <span
              className={cn(
                "text-right text-sm font-medium text-white",
                (row.label === "Matricule" || row.label === "ID unique") &&
                  "font-mono"
              )}
            >
              {row.label === "District" ? (
                (() => {
                  const DistrictIcon = d.icon;
                  return (
                    <span className="inline-flex items-center gap-1.5">
                      <DistrictIcon
                        className="size-3.5"
                        style={{ color: d.color }}
                      />
                      {row.value}
                    </span>
                  );
                })()
              ) : (
                row.value
              )}
            </span>
          </motion.div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAgain}
        className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        Inscrire un autre agent
      </button>
    </motion.div>
  );
}

const inputClass =
  "h-10 w-full border-transparent bg-white/5 text-white placeholder:text-white/30 focus-visible:border-white/20 focus-visible:bg-white/10 focus-visible:ring-white/15";

type Step = "form" | "rules" | "done";

export function RegistrationForm({ onSuccess }: { onSuccess?: () => void }) {
  const { isOpen, loading: eventLoading, register: registerParticipant } =
    useEvent();
  const [step, setStep] = useState<Step>("form");
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<FormValues | null>(null);
  const [pending, setPending] = useState<FormValues | null>(null);
  const [focusedInput, setFocusedInput] = useState<FocusKey>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      matricule: "",
      idUnique: "",
      district: "mission_row",
    },
  });

  const district = watch("district");
  const activeDistrict = DISTRICTS.find((d) => d.id === district);
  const ActiveIcon = activeDistrict?.icon;

  function goToRules(data: FormValues) {
    setPending({
      nom: data.nom.trim(),
      prenom: data.prenom.trim(),
      matricule: data.matricule.trim(),
      idUnique: data.idUnique.trim(),
      district: data.district,
    });
    setStep("rules");
  }

  async function submitRegistration() {
    if (!pending) {
      toast.error("Dossier incomplet");
      setStep("form");
      return;
    }
    setSubmitting(true);
    try {
      const result = await registerParticipant(pending);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setSummary(pending);
      setPending(null);
      setStep("done");
      reset();
      onSuccess?.();
      toast.success("Inscription enregistrée");
    } catch {
      toast.error("Inscription impossible");
    } finally {
      setSubmitting(false);
    }
  }

  if (eventLoading) {
    return (
      <GlassFormCard>
        <div className="flex justify-center py-10">
          <Loader2 className="size-5 animate-spin text-white/50" />
        </div>
      </GlassFormCard>
    );
  }

  if (!isOpen) {
    return (
      <GlassFormCard>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full border border-[#c084fc]/30 bg-[#c084fc]/10 text-[#c084fc]">
            <Lock className="size-5" />
          </div>
          <p className="text-lg font-semibold text-white">Inscriptions fermées</p>
          <p className="max-w-xs text-sm text-white/55">
            Les inscriptions sont actuellement fermées.
          </p>
        </div>
      </GlassFormCard>
    );
  }

  if (step === "done" && summary) {
    return (
      <GlassFormCard>
        <SuccessRecap
          data={summary}
          onAgain={() => {
            setStep("form");
            setSummary(null);
            setPending(null);
          }}
        />
      </GlassFormCard>
    );
  }

  if (step === "rules") {
    return (
      <GlassFormCard>
        <RulesGate
          submitting={submitting}
          onAccept={submitRegistration}
          onBack={() => setStep("form")}
        />
      </GlassFormCard>
    );
  }

  return (
    <GlassFormCard>
      <form onSubmit={handleSubmit(goToRules)} className="space-y-5">
        <div className="mb-1 text-center">
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c084fc]/80"
          >
            Étape 1 · Dossier
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-2 text-xl font-semibold tracking-tight text-white"
          >
            Inscription
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12 }}
            className="mt-1 text-sm text-white/45"
          >
            Identité agent · choix de district
          </motion.p>
          {activeDistrict && ActiveIcon ? (
            <div
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
              style={{
                borderColor: `${activeDistrict.color}55`,
                background: `${activeDistrict.color}14`,
                color: activeDistrict.color,
              }}
            >
              <ActiveIcon className="size-3" />
              {activeDistrict.label}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <GlassField
            label="Prénom"
            icon={UserRound}
            error={errors.prenom?.message}
            focused={focusedInput === "prenom"}
          >
            <Input
              placeholder="John"
              autoComplete="given-name"
              className={cn(inputClass, "pl-3")}
              {...register("prenom", {
                onBlur: () => setFocusedInput(null),
              })}
              onFocus={() => setFocusedInput("prenom")}
            />
          </GlassField>
          <GlassField
            label="Nom"
            icon={User}
            error={errors.nom?.message}
            focused={focusedInput === "nom"}
          >
            <Input
              placeholder="Doe"
              autoComplete="family-name"
              className={cn(inputClass, "pl-3")}
              {...register("nom", {
                onBlur: () => setFocusedInput(null),
              })}
              onFocus={() => setFocusedInput("nom")}
            />
          </GlassField>
          <GlassField
            label="Matricule"
            icon={Hash}
            error={errors.matricule?.message}
            focused={focusedInput === "matricule"}
          >
            <Input
              placeholder="482"
              inputMode="numeric"
              maxLength={3}
              className={cn(inputClass, "pl-3 font-mono tracking-widest")}
              {...register("matricule", {
                onBlur: () => setFocusedInput(null),
              })}
              onFocus={() => setFocusedInput("matricule")}
            />
          </GlassField>
          <GlassField
            label="ID unique"
            icon={Fingerprint}
            error={errors.idUnique?.message}
            focused={focusedInput === "idUnique"}
          >
            <Input
              placeholder="452189"
              inputMode="numeric"
              maxLength={20}
              className={cn(inputClass, "pl-3 font-mono")}
              {...register("idUnique", {
                onBlur: () => setFocusedInput(null),
              })}
              onFocus={() => setFocusedInput("idUnique")}
            />
          </GlassField>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
            District
          </p>
          <Controller
            name="district"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {DISTRICTS.map((d) => {
                  const active = field.value === d.id;
                  const Icon = d.icon;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => field.onChange(d.id)}
                      className={cn(
                        "relative flex items-center gap-2 rounded-xl border px-2.5 py-2.5 text-left transition",
                        active
                          ? "border-white/25 bg-white/10 text-white"
                          : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white"
                      )}
                      style={
                        active
                          ? ({ "--district-accent": d.color } as CSSProperties)
                          : undefined
                      }
                    >
                      <span
                        className="grid size-8 shrink-0 place-items-center rounded-lg border"
                        style={{
                          color: d.color,
                          background: `${d.color}18`,
                          borderColor: `${d.color}40`,
                        }}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold leading-snug">
                          {d.label}
                        </span>
                      </span>
                      {active ? (
                        <CheckCircle2 className="absolute top-1.5 right-1.5 size-3.5 text-[#c084fc]" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          />
          {errors.district ? (
            <p className="text-xs text-red-400">{errors.district.message}</p>
          ) : null}
        </div>

        <motion.button
          whileHover={{ scale: 1.008 }}
          whileTap={{ scale: 0.992 }}
          type="submit"
          className="group/button relative mt-1 w-full"
        >
          <div className="absolute inset-0 rounded-lg bg-white/10 opacity-0 blur-lg transition-opacity duration-300 group-hover/button:opacity-60" />
          <div className="relative flex h-11 items-center justify-center overflow-hidden rounded-lg bg-white font-medium text-black">
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              Continuer vers le règlement
              <ArrowRight className="size-3.5 transition-transform duration-300 group-hover/button:translate-x-1" />
            </span>
          </div>
        </motion.button>
      </form>
    </GlassFormCard>
  );
}
