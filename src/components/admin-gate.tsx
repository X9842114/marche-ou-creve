"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEvent } from "@/contexts/event-context";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { isAdmin, login, loading: eventLoading } = useEvent();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!eventLoading) setReady(true);
  }, [eventLoading]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ok = await login(password);
      if (!ok) {
        toast.error("Mot de passe incorrect");
        return;
      }
      setPassword("");
      toast.success("Accès admin");
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-white/40" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4">
        <Link href="/" className="moc-back mb-4 w-fit">
          <ArrowLeft className="size-3.5" />
          Retour
        </Link>
        <form
          onSubmit={handleLogin}
          className="space-y-4 rounded-2xl border border-white/10 bg-[#12101a] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#c084fc]/15 text-[#c084fc] ring-1 ring-[#c084fc]/25">
              <Shield className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/45">
                Accès organisateur
              </p>
              <h1 className="text-xl font-semibold text-white">Admin</h1>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password" className="text-white/70">
              Mot de passe
            </Label>
            <Input
              id="admin-password"
              type="password"
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 border-white/12 bg-black/50 text-white"
            />
          </div>
          <Button
            type="submit"
            className="h-11 w-full bg-white text-black hover:bg-violet-100"
            disabled={submitting || !password}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Lock className="size-4" />
            )}
            Se connecter
          </Button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
