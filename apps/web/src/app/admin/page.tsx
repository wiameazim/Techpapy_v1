"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardLabel } from "@/components/ui/card";
import { api, type AdminStats } from "@/lib/api";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  ACTIVE: "Actif",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
  SCHEDULED: "Planifié",
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .admin.stats()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur inconnue"));
  }, []);

  if (error) {
    return (
      <main className="p-6 md:p-10">
        <p className="border border-ink bg-mist px-4 py-3 text-sm">{error}</p>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="p-6 md:p-10">
        <p className="text-sm text-mute">Chargement…</p>
      </main>
    );
  }

  const cards = [
    { label: "Utilisateurs", value: stats.users.total, hint: `dont ${stats.users.admins} admin(s)` },
    { label: "Compétences", value: stats.skills.total },
    {
      label: "Matchs",
      value: Object.values(stats.matches).reduce((a, b) => a + (b ?? 0), 0),
    },
    {
      label: "Sessions",
      value: Object.values(stats.sessions).reduce((a, b) => a + (b ?? 0), 0),
    },
    { label: "Articles", value: stats.articles.total },
    { label: "Badges", value: stats.badges.total },
    { label: "Points distribués", value: stats.pointsDistributed },
  ];

  const maxSignups = Math.max(1, ...stats.signupsByDay.map((d) => d.count));

  return (
    <main className="p-6 md:p-10">
      <CardLabel>Administration</CardLabel>
      <h1 className="mt-4 text-3xl font-black uppercase tracking-tight">Vue d&apos;ensemble</h1>

      <div className="mt-8 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="relative border-0 bg-paper">
            <span className="absolute left-0 top-0 h-1 w-8 bg-signal" />
            <div className="text-4xl font-black text-ink">{c.value}</div>
            <div className="mt-2 text-sm uppercase tracking-wide text-mute">{c.label}</div>
            {c.hint && <div className="mt-1 text-xs text-mute">{c.hint}</div>}
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardLabel>Inscriptions (14 derniers jours)</CardLabel>
          <div className="mt-6 flex h-40 items-end gap-1">
            {stats.signupsByDay.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full bg-signal"
                  style={{ height: `${Math.max(4, (d.count / maxSignups) * 100)}%` }}
                  title={`${d.date} — ${d.count} inscription(s)`}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-mute">
            <span>{stats.signupsByDay[0]?.date}</span>
            <span>{stats.signupsByDay[stats.signupsByDay.length - 1]?.date}</span>
          </div>
        </Card>

        <Card>
          <CardLabel>Statuts</CardLabel>
          <div className="mt-6 space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-mute">Matchs</p>
              <ul className="mt-2 space-y-1 text-sm">
                {Object.entries(stats.matches).map(([status, count]) => (
                  <li key={status} className="flex justify-between">
                    <span>{STATUS_LABELS[status] ?? status}</span>
                    <span className="font-semibold">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-mute">Sessions</p>
              <ul className="mt-2 space-y-1 text-sm">
                {Object.entries(stats.sessions).map(([status, count]) => (
                  <li key={status} className="flex justify-between">
                    <span>{STATUS_LABELS[status] ?? status}</span>
                    <span className="font-semibold">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <div className="flex items-center justify-between">
            <CardLabel>Activité récente</CardLabel>
            <Link
              href="/admin/audit-logs"
              className="text-xs font-semibold uppercase tracking-wide text-mute hover:text-ink"
            >
              Voir tout
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {stats.recentAuditLogs.length === 0 && (
              <li className="py-4 text-sm text-mute">Aucune activité récente.</li>
            )}
            {stats.recentAuditLogs.map((log) => (
              <li key={log.id} className="flex items-center justify-between py-3 text-sm">
                <span className="font-semibold">{log.action}</span>
                <span className="text-xs text-mute">
                  {new Date(log.createdAt).toLocaleString("fr-FR")}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </main>
  );
}
