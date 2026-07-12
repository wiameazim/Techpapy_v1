import type { Prisma } from "@prisma/client";
import { awardBadges } from "../lib/badges";

describe("awardBadges", () => {
  it("does nothing when no threshold is met", async () => {
    const tx = {
      badge: { upsert: jest.fn() },
      userBadge: { upsert: jest.fn() },
    } as unknown as Prisma.TransactionClient;

    await awardBadges(tx, "user-1", 0);

    expect(tx.badge.upsert).not.toHaveBeenCalled();
  });
});
