"use client";

import { useEffect, useState } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/admin/data-table";
import { api, type AuditLog } from "@/lib/api";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.admin
      .auditLogs()
      .then((res) => setLogs(res.logs))
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur inconnue"))
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<AuditLog>[] = [
    {
      key: "createdAt",
      label: "Date",
      render: (l) => new Date(l.createdAt).toLocaleString("fr-FR"),
    },
    { key: "action", label: "Action" },
    { key: "userId", label: "Utilisateur", render: (l) => l.userId ?? "—" },
    { key: "ip", label: "IP", render: (l) => l.ip ?? "—" },
    {
      key: "metadata",
      label: "Détails",
      render: (l) =>
        l.metadata ? (
          <code className="text-xs text-mute">{JSON.stringify(l.metadata)}</code>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <main className="p-6 md:p-10">
      <CardLabel>Administration</CardLabel>
      <h1 className="mt-4 text-3xl font-black uppercase tracking-tight">Journal d&apos;audit</h1>
      <p className="mt-2 text-sm text-mute">Les 200 dernières actions enregistrées.</p>

      {error && <p className="mt-4 border border-ink bg-mist px-4 py-3 text-sm">{error}</p>}

      <div className="mt-8">
        <Card className="p-0">
          {loading ? (
            <p className="p-8 text-sm text-mute">Chargement…</p>
          ) : (
            <DataTable columns={columns} rows={logs} rowKey={(l) => l.id} />
          )}
        </Card>
      </div>
    </main>
  );
}
