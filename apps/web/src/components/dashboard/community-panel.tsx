"use client";

import { useState } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import type { Skill } from "@/lib/api";

function SkillColumn({
  title,
  skills,
  onMatch,
  pendingId,
}: {
  title: string;
  skills: Skill[];
  onMatch: (userId: string) => void;
  pendingId: string | null;
}) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-widest text-mute">{title}</h3>
      <ul className="mt-3 divide-y divide-line border-y border-line">
        {skills.length === 0 && (
          <li className="py-3 text-sm text-mute">Rien pour l&apos;instant.</li>
        )}
        {skills.map((s) => (
          <li key={s.id} className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm font-semibold">{s.name}</div>
              <div className="text-xs text-mute">{s.user?.name}</div>
            </div>
            <button
              onClick={() => s.user && onMatch(s.user.id)}
              disabled={pendingId === s.user?.id}
              className="border border-ink px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors hover:bg-signal hover:border-signal disabled:opacity-50"
            >
              {pendingId === s.user?.id ? "…" : "Matcher"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CommunityPanel({
  offered,
  wanted,
  onMatch,
}: {
  offered: Skill[];
  wanted: Skill[];
  onMatch: (userId: string) => Promise<void>;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleMatch(userId: string) {
    setError(null);
    setPendingId(userId);
    try {
      await onMatch(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card>
      <CardLabel>Communauté</CardLabel>
      {error && <p className="mt-3 border border-ink bg-mist px-4 py-2 text-sm">{error}</p>}
      <div className="mt-6 grid gap-8 sm:grid-cols-2">
        <SkillColumn
          title="Compétences offertes"
          skills={offered}
          onMatch={handleMatch}
          pendingId={pendingId}
        />
        <SkillColumn
          title="Compétences recherchées"
          skills={wanted}
          onMatch={handleMatch}
          pendingId={pendingId}
        />
      </div>
    </Card>
  );
}
