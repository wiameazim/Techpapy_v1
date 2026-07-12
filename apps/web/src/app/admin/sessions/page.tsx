"use client";

import { FormEvent, useEffect, useState } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Modal } from "@/components/admin/modal";
import { api, type AdminSession, type Match, type SessionStatus } from "@/lib/api";

const STATUS_LABELS: Record<SessionStatus, string> = {
  SCHEDULED: "Planifié",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminSession | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  function load() {
    return Promise.all([api.admin.listSessions(), api.admin.listMatches()])
      .then(([sessionsRes, matchesRes]) => {
        setSessions(sessionsRes.sessions);
        setMatches(matchesRes.matches);
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
      await api.admin.createSession({
        matchId: String(form.get("matchId")),
        scheduledAt: new Date(String(form.get("scheduledAt"))).toISOString(),
        status: form.get("status") as SessionStatus,
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
      await api.admin.updateSession(editing.id, {
        scheduledAt: new Date(String(form.get("scheduledAt"))).toISOString(),
        status: form.get("status") as SessionStatus,
      });
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(session: AdminSession) {
    if (!confirm("Supprimer cette session ?")) return;
    try {
      await api.admin.deleteSession(session.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }

  const columns: Column<AdminSession>[] = [
    {
      key: "match",
      label: "Match",
      render: (s) => `${s.match.userA.name} ↔ ${s.match.userB.name}`,
    },
    {
      key: "scheduledAt",
      label: "Prévue le",
      render: (s) => new Date(s.scheduledAt).toLocaleString("fr-FR"),
    },
    { key: "status", label: "Statut", render: (s) => STATUS_LABELS[s.status] },
  ];

  return (
    <main className="p-6 md:p-10">
      <CardLabel>Administration</CardLabel>
      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-3xl font-black uppercase tracking-tight">Sessions</h1>
        <Button onClick={() => setCreating(true)}>Nouvelle session</Button>
      </div>

      {error && <p className="mt-4 border border-ink bg-mist px-4 py-3 text-sm">{error}</p>}

      <div className="mt-8">
        <Card className="p-0">
          {loading ? (
            <p className="p-8 text-sm text-mute">Chargement…</p>
          ) : (
            <DataTable
              columns={columns}
              rows={sessions}
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
        <Modal title="Nouvelle session" onClose={() => setCreating(false)}>
          <form onSubmit={onCreate} className="space-y-5">
            <Select label="Match" name="matchId" required>
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.userA.name} ↔ {m.userB.name}
                </option>
              ))}
            </Select>
            <Field label="Date et heure" name="scheduledAt" type="datetime-local" required />
            <Select label="Statut" name="status" defaultValue="SCHEDULED">
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
          title={`${editing.match.userA.name} ↔ ${editing.match.userB.name}`}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={onSave} className="space-y-5">
            <Field
              label="Date et heure"
              name="scheduledAt"
              type="datetime-local"
              defaultValue={toLocalInputValue(editing.scheduledAt)}
              required
            />
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
