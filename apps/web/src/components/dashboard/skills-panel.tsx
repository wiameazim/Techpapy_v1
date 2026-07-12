"use client";

import { FormEvent, useState } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Skill, SkillType } from "@/lib/api";

export function SkillsPanel({
  mySkills,
  onAdd,
  onDelete,
}: {
  mySkills: Skill[];
  onAdd: (name: string, type: SkillType) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setError(null);
    setSubmitting(true);
    const form = new FormData(formEl);
    try {
      await onAdd(String(form.get("name")), form.get("type") as SkillType);
      formEl.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardLabel>Mes compétences</CardLabel>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Field label="Compétence" name="name" placeholder="Ex. Excel, Guitare, Vélo…" required />
        </div>
        <div className="w-full sm:w-48">
          <Select label="Type" name="type" defaultValue="OFFERED">
            <option value="OFFERED">J&apos;offre</option>
            <option value="WANTED">Je recherche</option>
          </Select>
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Ajout…" : "Ajouter"}
        </Button>
      </form>
      {error && <p className="mt-3 border border-ink bg-mist px-4 py-2 text-sm">{error}</p>}

      <ul className="mt-6 divide-y divide-line">
        {mySkills.length === 0 && (
          <li className="py-4 text-sm text-mute">Aucune compétence ajoutée pour l&apos;instant.</li>
        )}
        {mySkills.map((s) => (
          <li key={s.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <span className="bg-signal px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-ink">
                {s.type === "OFFERED" ? "Offre" : "Recherche"}
              </span>
              <span className="text-sm font-semibold">{s.name}</span>
            </div>
            <button
              onClick={() => onDelete(s.id)}
              className="text-xs font-semibold uppercase tracking-wide text-mute transition-colors hover:text-ink"
            >
              Supprimer
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
