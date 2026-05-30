import { Badge } from "@/components/ui/Badge";

type Column<T> = {
  key: keyof T;
  label: string;
  badge?: boolean;
};

export function DataTable<T extends Record<string, string>>({
  columns,
  rows,
}: {
  columns: Column<T>[];
  rows: T[];
}) {
  return (
    <div className="overflow-hidden rounded-md border border-white/10 bg-[#151a22]">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead className="bg-white/5">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className="px-5 py-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-500"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-white/8">
              {columns.map((column) => (
                <td key={String(column.key)} className="px-5 py-4 text-sm font-medium text-zinc-300">
                  {column.badge ? <Badge>{row[column.key]}</Badge> : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
