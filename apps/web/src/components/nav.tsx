import Link from "next/link";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/#features", label: "Fonctions" },
  { href: "/#security", label: "Confiance" },
];

export function Nav() {
  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-lg font-black uppercase tracking-tight">
          Tech<span className="bg-signal px-1 text-ink">Papy</span>
        </Link>
        <nav className="hidden gap-8 text-sm font-semibold uppercase tracking-wide text-mute md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group relative py-1 hover:text-ink"
            >
              {l.label}
              <span className="absolute inset-x-0 -bottom-0.5 h-[2px] origin-left scale-x-0 bg-signal transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost">Connexion</Button>
          </Link>
          <Link href="/register">
            <Button variant="primary">Rejoindre</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
