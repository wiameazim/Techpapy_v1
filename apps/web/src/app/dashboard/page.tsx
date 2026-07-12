"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkillsPanel } from "@/components/dashboard/skills-panel";
import { CommunityPanel } from "@/components/dashboard/community-panel";
import { MatchesPanel } from "@/components/dashboard/matches-panel";
import { PointsHistory } from "@/components/dashboard/points-history";
import { BadgesPanel } from "@/components/dashboard/badges-panel";
import { CalendarView, type CalendarSession } from "@/components/dashboard/calendar-view";
import {
  api,
  type BadgeCatalogueEntry,
  type Match,
  type Me,
  type PointsEntry,
  type Skill,
  type SkillType,
} from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<Me | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [points, setPoints] = useState<PointsEntry[]>([]);
  const [badgeCatalogue, setBadgeCatalogue] = useState<BadgeCatalogueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    const [meRes, skillsRes, matchesRes, pointsRes, badgesRes] = await Promise.all([
      api.me(),
      api.listSkills(),
      api.listMatches(),
      api.myPoints(),
      api.listBadges(),
    ]);
    setUser(meRes.user);
    setSkills(skillsRes.skills);
    setMatches(matchesRes.matches);
    setPoints(pointsRes.entries);
    setBadgeCatalogue(badgesRes.badges);
  }, []);

  useEffect(() => {
    api
      .refresh()
      .then(() => loadAll())
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router, loadAll]);

  async function onLogout() {
    await api.logout().catch(() => {});
    router.push("/login");
  }

  async function onAddSkill(name: string, type: SkillType) {
    await api.createSkill({ name, type });
    await loadAll();
  }

  async function onDeleteSkill(id: string) {
    await api.deleteSkill(id);
    await loadAll();
  }

  async function onMatch(targetUserId: string) {
    await api.createMatch(targetUserId);
    await loadAll();
  }

  async function onSchedule(matchId: string, scheduledAt: string) {
    await api.createSession({ matchId, scheduledAt });
    await loadAll();
  }

  async function onComplete(sessionId: string) {
    await api.completeSession(sessionId);
    await loadAll();
  }

  if (loading || !user) return null;

  const mySkills = skills.filter((s) => s.userId === user.id);
  const communityOffered = skills.filter((s) => s.userId !== user.id && s.type === "OFFERED");
  const communityWanted = skills.filter((s) => s.userId !== user.id && s.type === "WANTED");
  const upcomingSessions = matches
    .flatMap((m) => m.sessions)
    .filter((s) => s.status === "SCHEDULED").length;

  const calendarSessions: CalendarSession[] = matches.flatMap((m) => {
    const other = m.userAId === user.id ? m.userB : m.userA;
    return m.sessions.map((s) => ({
      id: s.id,
      scheduledAt: s.scheduledAt,
      status: s.status,
      otherName: other.name,
    }));
  });

  const stats = [
    { label: "Points d'échange", value: String(user.points) },
    { label: "Sessions à venir", value: String(upcomingSessions) },
    { label: "Badges", value: String(user.badges.length) },
  ];

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-line px-6 py-5">
        <span className="text-lg font-black uppercase tracking-tight">
          Tech<span className="bg-signal px-1 text-ink">Papy</span>
        </span>
        <div className="flex items-center gap-4">
          <Link
            href="/knowledge"
            className="text-sm font-bold uppercase tracking-wide hover:text-signal"
          >
            Base de connaissances
          </Link>
          <span className="text-sm font-semibold text-mute">{user.name}</span>
          <Button variant="ghost" onClick={onLogout}>
            Déconnexion
          </Button>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
        <CardLabel>Tableau de bord</CardLabel>
        <h1 className="mt-4 text-3xl font-black uppercase tracking-tight">
          Bonjour, {user.name}
        </h1>

        <div className="mt-10 grid gap-px border border-line bg-line md:grid-cols-3">
          {stats.map((s) => (
            <Card key={s.label} className="relative border-0 bg-paper">
              <span className="absolute left-0 top-0 h-1 w-8 bg-signal" />
              <div className="text-4xl font-black text-ink">{s.value}</div>
              <div className="mt-2 text-sm uppercase tracking-wide text-mute">{s.label}</div>
            </Card>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <SkillsPanel mySkills={mySkills} onAdd={onAddSkill} onDelete={onDeleteSkill} />
          <CommunityPanel offered={communityOffered} wanted={communityWanted} onMatch={onMatch} />
        </div>

        <div className="mt-6">
          <CalendarView sessions={calendarSessions} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <MatchesPanel
            matches={matches}
            meId={user.id}
            onSchedule={onSchedule}
            onComplete={onComplete}
          />
          <PointsHistory entries={points} />
        </div>

        <div className="mt-6">
          <BadgesPanel
            catalogue={badgeCatalogue}
            earnedNames={new Set(user.badges.map((b) => b.badge.name))}
            points={user.points}
          />
        </div>
      </div>
    </main>
  );
}
