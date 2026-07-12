import type { Prisma } from "@prisma/client";

export const BADGE_THRESHOLDS = [
  {
    name: "Premier échange",
    description: "Complète ta première session d'échange.",
    points: 1,
  },
  {
    name: "Habitué",
    description: "Complète 5 sessions d'échange.",
    points: 5,
  },
  {
    name: "Mentor",
    description: "Complète 10 sessions d'échange.",
    points: 10,
  },
  {
    name: "Ambassadeur",
    description: "Complète 20 sessions d'échange.",
    points: 20,
  },
] as const;

export async function awardBadges(
  tx: Prisma.TransactionClient,
  userId: string,
  points: number,
) {
  const eligible = BADGE_THRESHOLDS.filter((b) => points >= b.points);
  if (eligible.length === 0) return;

  for (const b of eligible) {
    const badge = await tx.badge.upsert({
      where: { name: b.name },
      update: {},
      create: { name: b.name, description: b.description },
    });

    await tx.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
      update: {},
      create: { userId, badgeId: badge.id },
    });
  }
}
