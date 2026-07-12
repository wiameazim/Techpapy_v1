import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { CircularMotif } from "@/components/circular-motif";

const features = [
  { title: "Matching", desc: "Compétences offertes / recherchées." },
  { title: "Visioconférence", desc: "Sessions d'aide intégrées." },
  { title: "Points d'échange", desc: "Heures données = heures reçues." },
  { title: "Calendrier partagé", desc: "Programmation des sessions." },
  { title: "Base de connaissances", desc: "FAQ et tutoriels collaboratifs." },
  { title: "Badges", desc: "Suivi des progrès et réussites." },
];

const security = [
  "Connexion sécurisée à chaque visite",
  "Mots de passe protégés, jamais lisibles",
  "Échanges à l'abri des tentatives malveillantes",
  "Chacun accède seulement à ce qui le concerne",
  "Surveillance continue contre les intrusions",
];

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-line">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-24 md:grid-cols-2 md:items-center">
            <Reveal>
              <CardLabel>Option C — Échange intergénérationnel</CardLabel>
              <h1 className="mt-6 text-4xl font-black uppercase leading-none tracking-tight md:text-6xl">
                Jeunes et seniors.
                <br />
                <span className="text-signal">Un savoir</span> partagé.
              </h1>
              <p className="mt-6 max-w-md text-mute">
                Mission : lutter contre l&apos;isolement, transmettre les
                savoirs entre générations.
              </p>
              <div className="mt-8 flex gap-4">
                <Link href="/register">
                  <Button variant="primary">Rejoindre</Button>
                </Link>
                <Link href="/login">
                  <Button variant="secondary">Connexion</Button>
                </Link>
              </div>
            </Reveal>
            <Reveal delay={150} className="relative">
              <CircularMotif className="-right-16 -top-16 h-72 w-72" />
              <div className="relative border border-ink bg-ink p-10 text-paper">
                <div className="font-mono text-xs uppercase tracking-widest text-signal">
                  Impact social
                </div>
                <p className="mt-4 text-2xl font-bold leading-snug">
                  1 heure donnée = 1 heure reçue.
                </p>
                <p className="mt-4 text-sm text-paper/70">
                  Un point d&apos;échange par heure de compétence transmise.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-6 py-24">
          <Reveal>
            <CardLabel>Fonctionnalités</CardLabel>
            <h2 className="mt-4 text-3xl font-black uppercase tracking-tight">
              Ce que fait la plateforme
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-px border border-line bg-line md:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <Card className="h-full border-0 bg-paper">
                  <h3 className="text-lg font-bold uppercase">{f.title}</h3>
                  <p className="mt-2 text-sm text-mute">{f.desc}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="security" className="border-y border-line bg-mist">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <Reveal>
              <CardLabel>Confiance</CardLabel>
              <h2 className="mt-4 text-3xl font-black uppercase tracking-tight">
                Tes données sont protégées
              </h2>
            </Reveal>
            <ul className="mt-10 grid gap-4 text-sm font-semibold md:grid-cols-2">
              {security.map((s, i) => (
                <Reveal key={s} delay={i * 60}>
                  <li className="group flex items-center gap-3 border border-line bg-paper px-4 py-3 transition-colors duration-200 hover:border-ink">
                    <span className="h-2 w-2 shrink-0 bg-signal transition-transform duration-200 group-hover:scale-150" />
                    {s}
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-line bg-ink">
          <CircularMotif className="-left-24 -top-24 h-96 w-96" />
          <CircularMotif className="-bottom-32 -right-24 h-80 w-80" />
          <Reveal>
            <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-24 text-paper md:flex-row md:items-center md:justify-between">
              <h2 className="max-w-lg text-3xl font-black uppercase tracking-tight">
                Prêt à transmettre un savoir&nbsp;?
              </h2>
              <Link href="/register">
                <Button variant="accent">Créer un compte</Button>
              </Link>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
