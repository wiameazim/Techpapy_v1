import { ReactNode } from "react";

export type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  actions,
  emptyMessage = "Aucune donnée.",
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  actions?: (row: T) => ReactNode;
  emptyMessage?: string;
}) {
  return (
    <div className="overflow-x-auto border border-line">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-mist">
            {columns.map((c) => (
              <th
                key={c.key}
                className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-widest text-mute"
              >
                {c.label}
              </th>
            ))}
            {actions && (
              <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-widest text-mute">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="px-4 py-8 text-center text-sm text-mute"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-line last:border-0 hover:bg-mist/60">
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-3 align-top">
                  {c.render
                    ? c.render(row)
                    : String((row as Record<string, unknown>)[c.key] ?? "")}
                </td>
              ))}
              {actions && <td className="px-4 py-3 align-top">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
