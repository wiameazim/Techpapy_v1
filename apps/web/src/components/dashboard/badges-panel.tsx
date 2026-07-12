import { Card, CardLabel } from "@/components/ui/card";
import type { BadgeCatalogueEntry } from "@/lib/api";

export function BadgesPanel({
  catalogue,
  earnedNames,
  points,
}: {
  catalogue: BadgeCatalogueEntry[];
  earnedNames: Set<string>;
  points: number;
}) {
  return (
    <Card>
      <CardLabel>Badges</CardLabel>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {catalogue.map((b) => {
          const unlocked = earnedNames.has(b.name);
          const remaining = Math.max(0, b.pointsRequired - points);
          return (
            <li
              key={b.name}
              className={`border p-4 ${
                unlocked ? "border-ink" : "border-line opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase">{b.name}</span>
                {unlocked ? (
                  <span className="bg-signal px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink">
                    Obtenu
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase text-mute">
                    Verrouillé
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-mute">{b.description}</p>
              {!unlocked && (
                <p className="mt-2 text-xs font-semibold text-mute">
                  Encore {remaining} point{remaining > 1 ? "s" : ""}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
