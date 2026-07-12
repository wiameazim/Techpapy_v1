"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CardLabel } from "@/components/ui/card";
import { VideoRoom } from "@/components/video-room";
import { api, type SessionDetail } from "@/lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function SessionRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<SessionDetail | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .refresh()
      .then(async (auth) => {
        setMeId(auth.user.id);
        const detail = await api.getSession(id);
        setData(detail);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router, id]);

  async function onComplete() {
    setError(null);
    setCompleting(true);
    try {
      await api.completeSession(id);
      const detail = await api.getSession(id);
      setData(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setCompleting(false);
    }
  }

  if (loading) return null;

  if (!data) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <p className="border border-ink bg-mist px-4 py-3 text-sm">Session introuvable.</p>
      </main>
    );
  }

  const { session, match } = data;
  const other = meId === match.userAId ? match.userB : match.userA;

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-line px-6 py-5">
        <Link href="/dashboard" className="text-sm font-bold uppercase tracking-wide">
          ← Retour au dashboard
        </Link>
        <span className="bg-mist px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-mute">
          {session.status}
        </span>
      </header>

      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <CardLabel>Session visio</CardLabel>
        <h1 className="mt-4 text-2xl font-black uppercase tracking-tight">
          Avec {other.name}
        </h1>
        <p className="mt-1 text-sm text-mute">{formatDate(session.scheduledAt)}</p>

        <div className="mt-6">
          <VideoRoom sessionId={session.id} />
        </div>

        <div className="mt-6 flex items-center gap-4">
          {session.status === "SCHEDULED" ? (
            <Button onClick={onComplete} disabled={completing}>
              {completing ? "…" : "Marquer la session terminée"}
            </Button>
          ) : (
            <p className="text-sm font-semibold text-mute">
              Session déjà {session.status.toLowerCase()}.
            </p>
          )}
          {error && <p className="border border-ink bg-mist px-3 py-2 text-sm">{error}</p>}
        </div>
      </div>
    </main>
  );
}
