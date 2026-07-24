"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEvent } from "@/contexts/event-context";
import { SelectionBoard } from "@/components/selection-board";

export default function SelectionPage() {
  const { loading, getSelection } = useEvent();
  const { published, participants } = getSelection();

  return (
    <main className="moc-stage">
      <div className="moc-stage__inner moc-stage__inner--wide">
        <Link href="/" className="moc-back w-fit">
          <ArrowLeft className="size-3.5" />
          Retour
        </Link>

        <header className="moc-stage__brand">
          <p className="moc-badge">
            <span className="moc-badge__dot" aria-hidden />
            H-47 · Sélection
          </p>
          <h1
            className="moc-title mt-4"
            style={{ fontSize: "clamp(2rem, 6vw, 3rem)" }}
          >
            Tirés au sort
          </h1>
          <p className="moc-subtitle">
            Agents sélectionnés pour la course · avertissements inclus
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-white/40" />
          </div>
        ) : !published ? (
          <div className="rounded-2xl bg-[#12101a] px-5 py-8 text-center ring-1 ring-white/10">
            <p className="text-lg font-semibold text-white">Pas encore publié</p>
            <p className="mt-2 text-sm text-white/45">
              La sélection n&apos;est pas encore affichée. Reviens plus tard.
            </p>
          </div>
        ) : (
          <SelectionBoard participants={participants} />
        )}
      </div>
    </main>
  );
}
