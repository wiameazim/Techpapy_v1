"use client";

import { FormEvent, useEffect, useState } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Modal } from "@/components/admin/modal";
import { api, type AdminUser, type Match, type MatchStatus } from "@/lib/api";

const STATUS_LABELS: Record<MatchStatus, string> = {
  PENDING: "En attente",
  ACTIVE: "Actif",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Match | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  function load() {
    return Promise.all([api.admin.listMatches(), api.admin.listUsers()])
      .then(([matchesRes, usersRes]) => {
        setMatches(matchesRes.matches);
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
      await api.admin.createMatch({
        userAId: String(form.get("userAId")),
        userBId: String(form.get("userBId")),
        status: form.get("status") as MatchStatus,
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
      await api.admin.updateMatch(editing.id, { status: form.get("status") as MatchStatus });
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(match: Match) {
    if (!confirm(`Supprimer ce match et ses sessions associées ?`)) return;
    try {
      await api.admin.deleteMatch(match.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }

  const columns: Column<Match>[] = [
    { key: "userA", label: "Utilisateur A", render: (m) => m.userA.name },
    { key: "userB", label: "Utilisateur B", render: (m) => m.userB.name },
    { key: "status", label: "Statut", render: (m) => STATUS_LABELS[m.status] },
    { key: "sessions", label: "Sessions", render: (m) => String(m.sessions.length) },
    {
      key: "createdAt",
      label: "Créé le",
      render: (m) => new Date(m.createdAt).toLocaleDateString("fr-FR"),
    },
  ];

  return (
    <main className="p-6 md:p-10">
      <CardLabel>Administration</CardLabel>
      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-3xl font-black uppercase tracking-tight">Matchs</h1>
        <Button onClick={() => setCreating(true)}>Nouveau match</Button>
      </div>

      {error && <p className="mt-4 border border-ink bg-mist px-4 py-3 text-sm">{error}</p>}

      <div className="mt-8">
        <Card className="p-0">
          {loading ? (
            <p className="p-8 text-sm text-mute">Chargement…</p>
          ) : (
            <DataTable
              columns={columns}
              rows={matches}
              rowKey={(m) => m.id}
              actions={(m) => (
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditing(m)}
                    className="text-xs font-semibold uppercase tracking-wide text-mute hover:text-ink"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => onDelete(m)}
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
        <Modal title="Nouveau match" onClose={() => setCreating(false)}>
          <form onSubmit={onCreate} className="space-y-5">
            <Select label="Utilisateur A" name="userAId" required>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </Select>
            <Select label="Utilisateur B" name="userBId" required>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </Select>
            <Select label="Statut" name="status" defaultValue="PENDING">
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
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
        <Modal
          title={`${editing.userA.name} ↔ ${editing.userB.name}`}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={onSave} className="space-y-5">
            <Select label="Statut" name="status" defaultValue={editing.status}>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
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
