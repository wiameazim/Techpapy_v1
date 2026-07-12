"use client";

import { FormEvent, useEffect, useState } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Modal } from "@/components/admin/modal";
import { useAdminUser } from "@/components/admin/admin-context";
import { api, type AdminUser } from "@/lib/api";

export default function AdminUsersPage() {
  const me = useAdminUser();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    return api.admin
      .listUsers()
      .then(({ users }) => setUsers(users))
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur inconnue"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.currentTarget);
    setSaving(true);
    setError(null);
    try {
      await api.admin.updateUser(editing.id, {
        name: String(form.get("name")),
        email: String(form.get("email")),
        role: form.get("role") as "USER" | "ADMIN",
        points: Number(form.get("points")),
      });
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(user: AdminUser) {
    if (user.id === me.id) return;
    if (!confirm(`Supprimer définitivement ${user.name} et toutes ses données ?`)) return;
    try {
      await api.admin.deleteUser(user.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }

  const columns: Column<AdminUser>[] = [
    { key: "name", label: "Nom" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Rôle",
      render: (u) => (
        <span
          className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
            u.role === "ADMIN" ? "bg-ink text-paper" : "bg-mist text-ink"
          }`}
        >
          {u.role}
        </span>
      ),
    },
    { key: "points", label: "Points" },
    {
      key: "createdAt",
      label: "Inscrit le",
      render: (u) => new Date(u.createdAt).toLocaleDateString("fr-FR"),
    },
  ];

  return (
    <main className="p-6 md:p-10">
      <CardLabel>Administration</CardLabel>
      <h1 className="mt-4 text-3xl font-black uppercase tracking-tight">Utilisateurs</h1>

      {error && <p className="mt-4 border border-ink bg-mist px-4 py-3 text-sm">{error}</p>}

      <div className="mt-8">
        <Card className="p-0">
          {loading ? (
            <p className="p-8 text-sm text-mute">Chargement…</p>
          ) : (
            <DataTable
              columns={columns}
              rows={users}
              rowKey={(u) => u.id}
              actions={(u) => (
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditing(u)}
                    className="text-xs font-semibold uppercase tracking-wide text-mute hover:text-ink"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => onDelete(u)}
                    disabled={u.id === me.id}
                    className="text-xs font-semibold uppercase tracking-wide text-mute hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Supprimer
                  </button>
                </div>
              )}
            />
          )}
        </Card>
      </div>

      {editing && (
        <Modal title={`Modifier ${editing.name}`} onClose={() => setEditing(null)}>
          <form onSubmit={onSave} className="space-y-5">
            <Field label="Nom" name="name" defaultValue={editing.name} required />
            <Field label="Email" name="email" type="email" defaultValue={editing.email} required />
            <Select label="Rôle" name="role" defaultValue={editing.role}>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </Select>
            <Field label="Points" name="points" type="number" min={0} defaultValue={editing.points} required />
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </form>
        </Modal>
      )}
    </main>
  );
}
