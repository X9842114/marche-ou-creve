"use client";

import { motion, useReducedMotion } from "framer-motion";
import { RegistrationForm } from "@/components/registration-form";
import { SelectionBoard } from "@/components/selection-board";
import { useEvent } from "@/contexts/event-context";

export default function HomePage() {
  const { getSelection, loading } = useEvent();
  const { published, participants } = getSelection();
  const reduce = useReducedMotion();
  const showSelection = published && !loading;

  return (
    <main className="moc-stage">
      <div
        className={
          showSelection
            ? "moc-stage__inner moc-stage__inner--wide"
            : "moc-stage__inner"
        }
      >
        <header className="moc-stage__brand">
          <p className="moc-badge">
            <span className="moc-badge__dot" aria-hidden />
            {showSelection ? "H-47 · Sélection" : "H-47 · Inscription"}
          </p>
          <h1 className="moc-title">Marche ou Crève</h1>
          <p className="moc-subtitle">
            {showSelection
              ? "Voici les personnes tirées au sort."
              : "Remplis ton dossier. Accepte le règlement. Marche… ou crève."}
          </p>
        </header>

        {showSelection ? (
          <motion.section
            key="home-selection"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3"
          >
            <motion.div
              initial={reduce ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{
                duration: 0.7,
                delay: 0.05,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mx-auto h-px w-24 origin-center bg-gradient-to-r from-transparent via-[#c084fc] to-transparent"
            />
            <SelectionBoard participants={participants} />
          </motion.section>
        ) : (
          <RegistrationForm />
        )}
      </div>
    </main>
  );
}
