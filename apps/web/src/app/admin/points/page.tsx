"use client";

import { FormEvent, useEffect, useState } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Modal } from "@/components/admin/modal";
import { api, type AdminPointsEntry, type AdminUser } from "@/lib/api";

export default function AdminPointsPage() {
  const [entries, setEntries] = useState<AdminPointsEntry[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  function load() {
    return Promise.all([api.admin.listPointsLedger(), api.admin.listUsers()])
      .then(([entriesRes, usersRes]) => {
        setEntries(entriesRes.entries);
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
      await api.admin.createLedgerEntry({
        userId: String(form.get("userId")),
        delta: Number(form.get("delta")),
        reason: String(form.get("reason")),
      });
      setCreating(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<AdminPointsEntry>[] = [
    { key: "user", label: "Utilisateur", render: (e) => e.user.name },
    {
      key: "delta",
      label: "Delta",
      render: (e) => (
        <span className={e.delta >= 0 ? "text-ink" : "text-mute"}>
          {e.delta >= 0 ? `+${e.delta}` : e.delta}
        </span>
      ),
    },
    { key: "reason", label: "Raison" },
    {
      key: "createdAt",
      label: "Le",
      render: (e) => new Date(e.createdAt).toLocaleString("fr-FR"),
    },
  ];

  return (
    <main className="p-6 md:p-10">
      <CardLabel>Administration</CardLabel>
      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-3xl font-black uppercase tracking-tight">Points</h1>
        <Button onClick={() => setCreating(true)}>Nouvel ajustement</Button>
      </div>
      <p className="mt-2 text-sm text-mute">
        Le journal des points est un historique immuable : chaque ajustement crée une nouvelle
        entrée et met à jour le solde de l&apos;utilisateur.
      </p>

      {error && <p className="mt-4 border border-ink bg-mist px-4 py-3 text-sm">{error}</p>}

      <div className="mt-8">
        <Card className="p-0">
          {loading ? (
            <p className="p-8 text-sm text-mute">Chargement…</p>
          ) : (
            <DataTable columns={columns} rows={entries} rowKey={(e) => e.id} />
          )}
        </Card>
      </div>

      {creating && (
        <Modal title="Nouvel ajustement de points" onClose={() => setCreating(false)}>
          <form onSubmit={onCreate} className="space-y-5">
            <Select label="Utilisateur" name="userId" required>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </Select>
            <Field
              label="Delta (positif ou négatif)"
              name="delta"
              type="number"
              required
              placeholder="Ex. 5 ou -3"
            />
            <Field label="Raison" name="reason" required placeholder="Ex. Correction manuelle" />
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Enregistrement…" : "Ajouter"}
            </Button>
          </form>
        </Modal>
      )}
    </main>
  );
}
