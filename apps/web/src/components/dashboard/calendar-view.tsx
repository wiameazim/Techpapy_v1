"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardLabel } from "@/components/ui/card";

export type CalendarSession = {
  id: string;
  scheduledAt: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  otherName: string;
};

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function CalendarView({ sessions }: { sessions: CalendarSession[] }) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  const days = useMemo(() => {
    const first = startOfMonth(cursor);
    const firstWeekday = (first.getDay() + 6) % 7; // Monday = 0
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - firstWeekday);

    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      return date;
    });
  }, [cursor]);

  function sessionsOn(date: Date) {
    return sessions.filter((s) => sameDay(new Date(s.scheduledAt), date));
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardLabel>Calendrier partagé</CardLabel>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="border border-line px-2 py-1 text-xs font-bold hover:border-ink"
          >
            ←
          </button>
          <span className="text-sm font-bold uppercase tracking-wide">
            {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
          </span>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="border border-line px-2 py-1 text-xs font-bold hover:border-ink"
          >
            →
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-px border border-line bg-line text-center text-[10px] font-bold uppercase tracking-wide text-mute">
        {WEEKDAYS.map((w) => (
          <div key={w} className="bg-mist py-2">
            {w}
          </div>
        ))}
        {days.map((date, i) => {
          const inMonth = date.getMonth() === cursor.getMonth();
          const today = sameDay(date, new Date());
          const daySessions = sessionsOn(date);
          return (
            <div
              key={i}
              className={`min-h-[76px] bg-paper p-1.5 text-left ${
                inMonth ? "" : "opacity-40"
              }`}
            >
              <div
                className={`text-[11px] font-semibold ${
                  today ? "inline-flex bg-signal px-1 text-ink" : "text-mute"
                }`}
              >
                {date.getDate()}
              </div>
              <div className="mt-1 space-y-1">
                {daySessions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/session/${s.id}`}
                    className={`block truncate px-1 py-0.5 text-[10px] font-semibold ${
                      s.status === "COMPLETED"
                        ? "bg-mist text-mute line-through"
                        : "bg-ink text-paper hover:bg-signal hover:text-ink"
                    }`}
                    title={`${s.otherName} — ${new Date(s.scheduledAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}
                  >
                    {new Date(s.scheduledAt).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    {s.otherName}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
