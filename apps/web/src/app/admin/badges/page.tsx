"use client";

import { FormEvent, useEffect, useState } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Modal } from "@/components/admin/modal";
import { api, type AdminBadge, type AdminUser, type AdminUserBadge } from "@/lib/api";

export default function AdminBadgesPage() {
  const [badges, setBadges] = useState<AdminBadge[]>([]);
  const [userBadges, setUserBadges] = useState<AdminUserBadge[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminBadge | null>(null);
  const [creating, setCreating] = useState(false);
  const [awarding, setAwarding] = useState(false);
  const [saving, setSaving] = useState(false);

  function load() {
    return Promise.all([
      api.admin.listBadges(),
      api.admin.listUserBadges(),
      api.admin.listUsers(),
    ])
      .then(([badgesRes, userBadgesRes, usersRes]) => {
        setBadges(badgesRes.badges);
        setUserBadges(userBadgesRes.userBadges);
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
      await api.admin.createBadge({
        name: String(form.get("name")),
        description: String(form.get("description")),
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
      await api.admin.updateBadge(editing.id, {
        name: String(form.get("name")),
        description: String(form.get("description")),
      });
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteBadge(badge: AdminBadge) {
    if (!confirm(`Supprimer le badge "${badge.name}" ? Il sera retiré de tous les utilisateurs.`))
      return;
    try {
      await api.admin.deleteBadge(badge.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }

  async function onAward(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSaving(true);
    setError(null);
    try {
      await api.admin.awardBadge({
        userId: String(form.get("userId")),
        badgeId: String(form.get("badgeId")),
      });
      setAwarding(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  async function onRevoke(ub: AdminUserBadge) {
    if (!confirm(`Retirer le badge "${ub.badge.name}" à ${ub.user.name} ?`)) return;
    try {
      await api.admin.revokeBadge(ub.userId, ub.badgeId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }

  const badgeColumns: Column<AdminBadge>[] = [
    { key: "name", label: "Nom" },
    { key: "description", label: "Description" },
    { key: "count", label: "Détenteurs", render: (b) => String(b._count.users) },
  ];

  const userBadgeColumns: Column<AdminUserBadge>[] = [
    { key: "user", label: "Utilisateur", render: (ub) => ub.user.name },
    { key: "badge", label: "Badge", render: (ub) => ub.badge.name },
    {
      key: "awardedAt",
      label: "Attribué le",
      render: (ub) => new Date(ub.awardedAt).toLocaleDateString("fr-FR"),
    },
  ];

  return (
    <main className="p-6 md:p-10">
      <CardLabel>Administration</CardLabel>
      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-3xl font-black uppercase tracking-tight">Badges</h1>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setAwarding(true)}>
            Attribuer un badge
          </Button>
          <Button onClick={() => setCreating(true)}>Nouveau badge</Button>
        </div>
      </div>

      {error && <p className="mt-4 border border-ink bg-mist px-4 py-3 text-sm">{error}</p>}

      <div className="mt-8">
        <Card className="p-0">
          {loading ? (
            <p className="p-8 text-sm text-mute">Chargement…</p>
          ) : (
            <DataTable
              columns={badgeColumns}
              rows={badges}
              rowKey={(b) => b.id}
              actions={(b) => (
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditing(b)}
                    className="text-xs font-semibold uppercase tracking-wide text-mute hover:text-ink"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => onDeleteBadge(b)}
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

      <div className="mt-10">
        <CardLabel>Attributions</CardLabel>
        <div className="mt-4">
          <Card className="p-0">
            {loading ? (
              <p className="p-8 text-sm text-mute">Chargement…</p>
            ) : (
              <DataTable
                columns={userBadgeColumns}
                rows={userBadges}
                rowKey={(ub) => `${ub.userId}-${ub.badgeId}`}
                actions={(ub) => (
                  <button
                    onClick={() => onRevoke(ub)}
                    className="text-xs font-semibold uppercase tracking-wide text-mute hover:text-ink"
                  >
                    Retirer
                  </button>
                )}
              />
            )}
          </Card>
        </div>
      </div>

      {creating && (
        <Modal title="Nouveau badge" onClose={() => setCreating(false)}>
          <form onSubmit={onCreate} className="space-y-5">
            <Field label="Nom" name="name" required />
            <Field label="Description" name="description" required />
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
            <Field label="Description" name="description" defaultValue={editing.description} required />
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </form>
        </Modal>
      )}

      {awarding && (
        <Modal title="Attribuer un badge" onClose={() => setAwarding(false)}>
          <form onSubmit={onAward} className="space-y-5">
            <Select label="Utilisateur" name="userId" required>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </Select>
            <Select label="Badge" name="badgeId" required>
              {badges.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Attribution…" : "Attribuer"}
            </Button>
          </form>
        </Modal>
      )}
    </main>
  );
}
