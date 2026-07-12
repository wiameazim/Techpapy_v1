import { Card, CardLabel } from "@/components/ui/card";
import type { PointsEntry } from "@/lib/api";

export function PointsHistory({ entries }: { entries: PointsEntry[] }) {
  return (
    <Card>
      <CardLabel>Historique des points</CardLabel>
      <ul className="mt-6 divide-y divide-line">
        {entries.length === 0 && (
          <li className="py-4 text-sm text-mute">
            Aucun point gagné pour l&apos;instant — termine une session pour en recevoir.
          </li>
        )}
        {entries.map((e) => (
          <li key={e.id} className="flex items-center justify-between py-3 text-sm">
            <div>
              <div className="font-semibold">{e.reason}</div>
              <div className="text-xs text-mute">
                {new Date(e.createdAt).toLocaleString("fr-FR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
            </div>
            <span className="bg-signal px-2 py-0.5 text-xs font-black text-ink">
              +{e.delta}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
