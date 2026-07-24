"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  DistrictId,
  MixerDistrictResult,
  Participant,
  ParticipantInput,
  RaceStatus,
} from "@/types/participant";
import type { EventMode, EventSettings } from "@/types/settings";

interface EventContextValue {
  settings: EventSettings;
  participants: Participant[];
  loading: boolean;
  revision: number;
  isOpen: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  ping: () => Promise<void>;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (
    input: ParticipantInput
  ) => Promise<{ participant: Participant } | { error: string }>;
  setMode: (mode: EventMode) => Promise<void>;
  setShowDrawn: (show: boolean) => Promise<void>;
  runMixerAll: () => Promise<{
    results: MixerDistrictResult[];
    totalPicked: number;
  }>;
  runMixerDistrict: (district: DistrictId) => Promise<MixerDistrictResult>;
  resetMixer: () => Promise<void>;
  patchRace: (
    id: string,
    body: { warnings?: number; status?: RaceStatus }
  ) => Promise<{ participant: Participant } | { error: string }>;
  removeParticipant: (
    id: string
  ) => Promise<{ ok: true } | { error: string }>;
  getSelection: () => {
    published: boolean;
    participants: Participant[];
  };
}

const EventContext = createContext<EventContextValue | null>(null);

const DEFAULT_SETTINGS: EventSettings = {
  mode: "inscription",
  updatedAt: new Date().toISOString(),
  mixerAt: null,
  showDrawn: false,
};

const POLL_MS = 3000;

async function readJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

export function EventProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<EventSettings>(DEFAULT_SETTINGS);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selection, setSelection] = useState<Participant[]>([]);
  const [selectionPublished, setSelectionPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [revision, setRevision] = useState(0);
  const revisionRef = useRef(0);

  const applySync = useCallback(
    (data: {
      revision: number;
      settings: EventSettings;
      selection: { published: boolean; participants: Participant[] };
      participants?: Participant[];
      isAdmin: boolean;
    }) => {
      revisionRef.current = data.revision;
      setRevision(data.revision);
      setSettings(data.settings);
      setSelectionPublished(data.selection.published);
      setSelection(data.selection.participants);
      setIsAdmin(data.isAdmin);
      if (data.isAdmin && data.participants) {
        setParticipants(data.participants);
      } else if (!data.isAdmin) {
        setParticipants([]);
      }
    },
    []
  );

  const refresh = useCallback(
    async (opts?: { force?: boolean }) => {
      try {
        const rev = opts?.force ? 0 : revisionRef.current;
        const res = await fetch(`/api/sync?revision=${rev}`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (res.status === 204) return;
        if (!res.ok) return;
        const data = await readJson<{
          revision: number;
          settings: EventSettings;
          selection: { published: boolean; participants: Participant[] };
          participants?: Participant[];
          isAdmin: boolean;
        }>(res);
        applySync(data);
      } finally {
        setLoading(false);
      }
    },
    [applySync]
  );

  const ping = useCallback(async () => {
    await refresh();
  }, [refresh]);

  useEffect(() => {
    void refresh({ force: true });
    const interval = window.setInterval(() => {
      void refresh();
    }, POLL_MS);
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  const value = useMemo<EventContextValue>(
    () => ({
      settings,
      participants,
      loading,
      revision,
      isOpen: settings.mode === "inscription",
      isAdmin,
      refresh: () => refresh({ force: true }),
      ping,
      login: async (password: string) => {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        if (!res.ok) return false;
        await refresh({ force: true });
        return true;
      },
      logout: async () => {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
        });
        await refresh({ force: true });
      },
      register: async (input) => {
        const res = await fetch("/api/participants", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = await readJson<{
          participant?: Participant;
          error?: string;
        }>(res);
        if (!res.ok) {
          return { error: data.error ?? "Inscription impossible" };
        }
        await refresh({ force: true });
        return { participant: data.participant! };
      },
      setMode: async (mode) => {
        const res = await fetch("/api/settings", {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode }),
        });
        if (!res.ok) throw new Error("Impossible de changer le mode");
        await refresh({ force: true });
      },
      setShowDrawn: async (show) => {
        const res = await fetch("/api/settings", {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ showDrawn: show }),
        });
        if (!res.ok) throw new Error("Impossible de publier la sélection");
        await refresh({ force: true });
      },
      runMixerAll: async () => {
        const res = await fetch("/api/mixer", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "all" }),
        });
        if (!res.ok) throw new Error("Erreur tirage");
        const data = await readJson<{
          results: MixerDistrictResult[];
          totalPicked: number;
        }>(res);
        await refresh({ force: true });
        return data;
      },
      runMixerDistrict: async (district) => {
        const res = await fetch("/api/mixer", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "district", district }),
        });
        if (!res.ok) throw new Error("Erreur tirage");
        const data = await readJson<{ result: MixerDistrictResult }>(res);
        await refresh({ force: true });
        return data.result;
      },
      resetMixer: async () => {
        const res = await fetch("/api/mixer", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reset" }),
        });
        if (!res.ok) throw new Error("Impossible de réinitialiser");
        await refresh({ force: true });
      },
      patchRace: async (id, body) => {
        const res = await fetch(`/api/participants/${encodeURIComponent(id)}`, {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await readJson<{
          participant?: Participant;
          error?: string;
        }>(res);
        if (!res.ok) {
          return { error: data.error ?? "Mise à jour impossible" };
        }
        await refresh({ force: true });
        return { participant: data.participant! };
      },
      removeParticipant: async (id) => {
        const res = await fetch(`/api/participants/${encodeURIComponent(id)}`, {
          method: "DELETE",
          credentials: "same-origin",
        });
        const data = await readJson<{ error?: string }>(res);
        if (!res.ok) {
          return { error: data.error ?? "Suppression impossible" };
        }
        await refresh({ force: true });
        return { ok: true as const };
      },
      getSelection: () => ({
        published: selectionPublished,
        participants: selection,
      }),
    }),
    [
      settings,
      participants,
      loading,
      revision,
      isAdmin,
      refresh,
      ping,
      selection,
      selectionPublished,
    ]
  );

  return (
    <EventContext.Provider value={value}>{children}</EventContext.Provider>
  );
}

export function useEvent() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEvent must be used within EventProvider");
  return ctx;
}
