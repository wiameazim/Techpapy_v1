"use client";

import { FormEvent, useEffect, useState } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Modal } from "@/components/admin/modal";
import { api, type AdminUser, type Skill, type SkillType } from "@/lib/api";

export default function AdminSkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  function load() {
    return Promise.all([api.admin.listSkills(), api.admin.listUsers()])
      .then(([skillsRes, usersRes]) => {
        setSkills(skillsRes.skills);
        setUsers(usersRes.users);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur inconnue"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSaving(true);
    setError(null);
    try {
      await api.admin.createSkill({
        name: String(form.get("name")),
        type: form.get("type") as SkillType,
        userId: String(form.get("userId")),
      });
      setCreating(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  async function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.currentTarget);
    setSaving(true);
    setError(null);
    try {
      await api.admin.updateSkill(editing.id, {
        name: String(form.get("name")),
        type: form.get("type") as SkillType,
      });
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(skill: Skill) {
    if (!confirm(`Supprimer la compétence "${skill.name}" ?`)) return;
    try {
      await api.admin.deleteSkill(skill.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }

  const columns: Column<Skill>[] = [
    { key: "name", label: "Compétence" },
    {
      key: "type",
      label: "Type",
      render: (s) => (s.type === "OFFERED" ? "Offre" : "Recherche"),
    },
    { key: "user", label: "Propriétaire", render: (s) => s.user?.name ?? "—" },
    {
      key: "createdAt",
      label: "Créée le",
      render: (s) => new Date(s.createdAt).toLocaleDateString("fr-FR"),
    },
  ];

  return (
    <main className="p-6 md:p-10">
      <CardLabel>Administration</CardLabel>
      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-3xl font-black uppercase tracking-tight">Compétences</h1>
        <Button onClick={() => setCreating(true)}>Nouvelle compétence</Button>
      </div>

      {error && <p className="mt-4 border border-ink bg-mist px-4 py-3 text-sm">{error}</p>}

      <div className="mt-8">
        <Card className="p-0">
          {loading ? (
            <p className="p-8 text-sm text-mute">Chargement…</p>
          ) : (
            <DataTable
              columns={columns}
              rows={skills}
              rowKey={(s) => s.id}
              actions={(s) => (
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditing(s)}
                    className="text-xs font-semibold uppercase tracking-wide text-mute hover:text-ink"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => onDelete(s)}
                    className="text-xs font-semibold uppercase tracking-wide text-mute hover:text-ink"
                  >
                    Supprimer
                  </button>
                </div>
              )}
            />
          )}
        </Card>
      </div>

      {creating && (
        <Modal title="Nouvelle compétence" onClose={() => setCreating(false)}>
          <form onSubmit={onCreate} className="space-y-5">
            <Field label="Nom" name="name" required />
            <Select label="Type" name="type" defaultValue="OFFERED">
              <option value="OFFERED">J&apos;offre</option>
              <option value="WANTED">Je recherche</option>
            </Select>
            <Select label="Propriétaire" name="userId" required>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </Select>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Création…" : "Créer"}
            </Button>
          </form>
        </Modal>
      )}

      {editing && (
        <Modal title={`Modifier "${editing.name}"`} onClose={() => setEditing(null)}>
          <form onSubmit={onSave} className="space-y-5">
            <Field label="Nom" name="name" defaultValue={editing.name} required />
            <Select label="Type" name="type" defaultValue={editing.type}>
              <option value="OFFERED">J&apos;offre</option>
              <option value="WANTED">Je recherche</option>
            </Select>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </form>
        </Modal>
      )}
    </main>
  );
}
