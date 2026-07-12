"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api, type Me } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { AdminUserContext } from "@/components/admin/admin-context";

const NAV = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin/users", label: "Utilisateurs" },
  { href: "/admin/skills", label: "Compétences" },
  { href: "/admin/matches", label: "Matchs" },
  { href: "/admin/sessions", label: "Sessions" },
  { href: "/admin/badges", label: "Badges" },
  { href: "/admin/articles", label: "Articles" },
  { href: "/admin/points", label: "Points" },
  { href: "/admin/audit-logs", label: "Journal d'audit" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .refresh()
      .then(() => api.me())
      .then(({ user }) => {
        if (cancelled) return;
        if (user.role !== "ADMIN") {
          router.replace("/dashboard");
          return;
        }
        setUser(user);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) router.replace("/login");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onLogout() {
    await api.logout().catch(() => {});
    router.push("/login");
  }

  if (!ready || !user) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-mute">Chargement…</p>
      </main>
    );
  }

  return (
    <AdminUserContext.Provider value={user}>
      <div className="flex min-h-screen flex-1 flex-col md:flex-row">
        <aside className="flex w-full shrink-0 flex-col border-b border-line bg-paper md:w-64 md:border-b-0 md:border-r">
          <div className="border-b border-line px-6 py-5">
            <Link href="/dashboard" className="text-lg font-black uppercase tracking-tight">
              Tech<span className="bg-signal px-1 text-ink">Papy</span>
            </Link>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-mute">
              Administration
            </p>
          </div>
          <nav className="flex-1 space-y-1 overflow-x-auto px-3 py-4 md:overflow-visible">
            {NAV.map((item) => {
              const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block whitespace-nowrap px-3 py-2 text-sm font-semibold uppercase tracking-wide ${
                    active ? "bg-ink text-paper" : "text-ink hover:bg-mist"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-line px-3 py-4">
            <p className="px-3 pb-3 text-xs text-mute">{user.name}</p>
            <Button variant="ghost" className="w-full" onClick={onLogout}>
              Déconnexion
            </Button>
          </div>
        </aside>
        <div className="flex-1 overflow-x-hidden">{children}</div>
      </div>
    </AdminUserContext.Provider>
  );
}
