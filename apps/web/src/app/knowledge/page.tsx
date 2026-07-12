"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardLabel } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { api, type Article, type Me } from "@/lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { dateStyle: "medium" });
}

export default function KnowledgePage() {
  const router = useRouter();
  const [user, setUser] = useState<Me | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadArticles = useCallback(async (q?: string) => {
    const res = await api.listArticles(q);
    setArticles(res.articles);
  }, []);

  useEffect(() => {
    api
      .refresh()
      .then(async (auth) => {
        setUser(await api.me().then((r) => r.user));
        await loadArticles();
        void auth;
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router, loadArticles]);

  async function onSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await loadArticles(search || undefined);
  }

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setError(null);
    setSubmitting(true);
    const form = new FormData(formEl);
    try {
      await api.createArticle({
        title: String(form.get("title")),
        content: String(form.get("content")),
      });
      formEl.reset();
      await loadArticles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id: string) {
    await api.deleteArticle(id);
    await loadArticles();
  }

  if (loading || !user) return null;

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-line px-6 py-5">
        <Link href="/dashboard" className="text-sm font-bold uppercase tracking-wide">
          ← Retour au dashboard
        </Link>
        <span className="text-lg font-black uppercase tracking-tight">
          Tech<span className="bg-signal px-1 text-ink">Papy</span>
        </span>
      </header>

      <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
        <CardLabel>Base de connaissances</CardLabel>
        <h1 className="mt-4 text-3xl font-black uppercase tracking-tight">
          FAQ &amp; tutoriels
        </h1>

        <Card className="mt-8">
          <CardLabel>Partager un article</CardLabel>
          <form onSubmit={onCreate} className="mt-6 space-y-4">
            <Field label="Titre" name="title" placeholder="Ex. Comment envoyer un email" required />
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-mute">
                Contenu
              </span>
              <textarea
                name="content"
                rows={5}
                required
                minLength={10}
                placeholder="Explique ton astuce ou ton tutoriel ici…"
                className="w-full border border-line bg-paper px-4 py-3 text-sm text-ink outline-none focus:border-signal"
              />
            </label>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Publication…" : "Publier"}
            </Button>
            {error && <p className="border border-ink bg-mist px-4 py-2 text-sm">{error}</p>}
          </form>
        </Card>

        <form onSubmit={onSearch} className="mt-10 flex gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un article…"
            className="w-full border border-line bg-paper px-4 py-3 text-sm text-ink outline-none focus:border-signal"
          />
          <Button type="submit" variant="secondary">
            Chercher
          </Button>
        </form>

        <ul className="mt-6 space-y-4">
          {articles.length === 0 && (
            <li className="text-sm text-mute">Aucun article pour l&apos;instant.</li>
          )}
          {articles.map((a) => (
            <li key={a.id} className="border border-line p-5">
              <div className="flex items-start justify-between gap-4">
                <button
                  onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                  className="text-left text-base font-bold uppercase tracking-tight hover:text-signal"
                >
                  {a.title}
                </button>
                {(a.authorId === user.id || user.role === "ADMIN") && (
                  <button
                    onClick={() => onDelete(a.id)}
                    className="shrink-0 text-xs font-semibold uppercase tracking-wide text-mute hover:text-ink"
                  >
                    Supprimer
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-mute">
                {a.author.name} — {formatDate(a.createdAt)}
              </p>
              {expanded === a.id && (
                <p className="mt-4 whitespace-pre-wrap text-sm">{a.content}</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
