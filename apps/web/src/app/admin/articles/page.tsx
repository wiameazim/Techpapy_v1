"use client";

import { FormEvent, useEffect, useState } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Modal } from "@/components/admin/modal";
import { api, type Article } from "@/lib/api";

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Article | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    return api.admin
      .listArticles()
      .then(({ articles }) => setArticles(articles))
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
      await api.admin.updateArticle(editing.id, {
        title: String(form.get("title")),
        content: String(form.get("content")),
      });
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(article: Article) {
    if (!confirm(`Supprimer l'article "${article.title}" ?`)) return;
    try {
      await api.admin.deleteArticle(article.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }

  const columns: Column<Article>[] = [
    { key: "title", label: "Titre" },
    { key: "author", label: "Auteur", render: (a) => a.author.name },
    {
      key: "createdAt",
      label: "Créé le",
      render: (a) => new Date(a.createdAt).toLocaleDateString("fr-FR"),
    },
  ];

  return (
    <main className="p-6 md:p-10">
      <CardLabel>Administration</CardLabel>
      <h1 className="mt-4 text-3xl font-black uppercase tracking-tight">Articles</h1>

      {error && <p className="mt-4 border border-ink bg-mist px-4 py-3 text-sm">{error}</p>}

      <div className="mt-8">
        <Card className="p-0">
          {loading ? (
            <p className="p-8 text-sm text-mute">Chargement…</p>
          ) : (
            <DataTable
              columns={columns}
              rows={articles}
              rowKey={(a) => a.id}
              actions={(a) => (
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditing(a)}
                    className="text-xs font-semibold uppercase tracking-wide text-mute hover:text-ink"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => onDelete(a)}
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

      {editing && (
        <Modal title={`Modifier "${editing.title}"`} onClose={() => setEditing(null)}>
          <form onSubmit={onSave} className="space-y-5">
            <Field label="Titre" name="title" defaultValue={editing.title} required />
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-mute">
                Contenu
              </span>
              <textarea
                name="content"
                defaultValue={editing.content}
                required
                rows={10}
                className="w-full border border-line bg-paper px-4 py-3 text-sm text-ink outline-none focus:border-signal"
              />
            </label>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </form>
        </Modal>
      )}
    </main>
  );
}
