"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Card, CardLabel } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await api.register({
        name: String(form.get("name")),
        email: String(form.get("email")),
        password: String(form.get("password")),
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Nav />
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <Card className="w-full max-w-md">
          <CardLabel>Créer un compte</CardLabel>
          <h1 className="mt-4 text-2xl font-black uppercase tracking-tight">
            Rejoindre TechPapy
          </h1>
          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <Field label="Nom" name="name" type="text" required autoComplete="name" />
            <Field label="Email" name="email" type="email" required autoComplete="email" />
            <Field
              label="Mot de passe"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
            {error && (
              <p className="border border-ink bg-mist px-4 py-2 text-sm">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Création…" : "Créer le compte"}
            </Button>
          </form>
          <p className="mt-6 text-sm text-mute">
            Déjà un compte ?{" "}
            <Link
              href="/login"
              className="font-semibold text-ink underline decoration-signal decoration-2 underline-offset-4 transition-colors hover:decoration-ink"
            >
              Connexion
            </Link>
          </p>
        </Card>
      </main>
      <Footer />
    </>
  );
}
