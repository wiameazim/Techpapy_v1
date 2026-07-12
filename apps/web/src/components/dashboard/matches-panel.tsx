"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Match } from "@/lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function MatchRow({
  match,
  meId,
  onSchedule,
  onComplete,
}: {
  match: Match;
  meId: string;
  onSchedule: (matchId: string, scheduledAt: string) => Promise<void>;
  onComplete: (sessionId: string) => Promise<void>;
}) {
  const other = match.userAId === meId ? match.userB : match.userA;
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setError(null);
    setBusy(true);
    const form = new FormData(formEl);
    const value = String(form.get("scheduledAt"));
    try {
      await onSchedule(match.id, new Date(value).toISOString());
      formEl.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete(sessionId: string) {
    setError(null);
    setCompletingId(sessionId);
    try {
      await onComplete(sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setCompletingId(null);
    }
  }

  return (
    <li className="border border-line p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold uppercase tracking-wide">Avec {other.name}</div>
        <span className="bg-mist px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-mute">
          {match.status}
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {match.sessions.length === 0 && (
          <li className="text-sm text-mute">Aucune session programmée.</li>
        )}
        {match.sessions.map((s) => (
          <li key={s.id} className="flex items-center justify-between text-sm">
            <span>{formatDate(s.scheduledAt)}</span>
            <span className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-wide text-mute">{s.status}</span>
              {s.status === "SCHEDULED" && (
                <>
                  <Link
                    href={`/session/${s.id}`}
                    className="bg-signal px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-ink transition-colors hover:bg-ink hover:text-paper"
                  >
                    Rejoindre la visio
                  </Link>
                  <button
                    onClick={() => handleComplete(s.id)}
                    disabled={completingId === s.id}
                    className="border border-ink px-2 py-1 text-[11px] font-bold uppercase tracking-wide transition-colors hover:bg-signal hover:border-signal disabled:opacity-50"
                  >
                    {completingId === s.id ? "…" : "Marquer terminée"}
                  </button>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>

      <form onSubmit={onSubmit} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex-1 min-w-[200px]">
          <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-mute">
            Programmer une session
          </span>
          <input
            type="datetime-local"
            name="scheduledAt"
            required
            className="w-full border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal"
          />
        </label>
        <Button type="submit" variant="secondary" disabled={busy}>
          {busy ? "…" : "Programmer"}
        </Button>
      </form>
      {error && <p className="mt-2 border border-ink bg-mist px-3 py-2 text-sm">{error}</p>}
    </li>
  );
}

export function MatchesPanel({
  matches,
  meId,
  onSchedule,
  onComplete,
}: {
  matches: Match[];
  meId: string;
  onSchedule: (matchId: string, scheduledAt: string) => Promise<void>;
  onComplete: (sessionId: string) => Promise<void>;
}) {
  return (
    <Card>
      <CardLabel>Mes matchs</CardLabel>
      <ul className="mt-6 space-y-4">
        {matches.length === 0 && (
          <li className="text-sm text-mute">
            Aucun match pour l&apos;instant — trouve une compétence dans la communauté.
          </li>
        )}
        {matches.map((m) => (
          <MatchRow
            key={m.id}
            match={m}
            meId={meId}
            onSchedule={onSchedule}
            onComplete={onComplete}
          />
        ))}
      </ul>
    </Card>
  );
}
