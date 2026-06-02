interface EditableColumn {
  key: string;
  header: string;
  type?: 'text' | 'number';
}

interface EditableTableProps {
  columns: EditableColumn[];
  rows: Record<string, string | number>[];
  onChange: (rows: Record<string, string | number>[]) => void;
  idKey?: string;
}

export function EditableTable({ columns, rows, onChange, idKey = 'id' }: EditableTableProps) {
  const update = (index: number, key: string, value: string | number) => {
    const next = rows.map((r, i) => (i === index ? { ...r, [key]: value } : r));
    onChange(next);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-btp-500/20 text-slate-400">
            {columns.map((c) => (
              <th key={c.key} className="px-2 py-2 text-start font-medium">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={String(row[idKey] ?? ri)} className="border-b border-btp-800/40">
              {columns.map((col) => (
                <td key={col.key} className="px-2 py-1">
                  <input
                    type={col.type ?? 'text'}
                    value={row[col.key] ?? ''}
                    onChange={(e) =>
                      update(ri, col.key, col.type === 'number' ? Number(e.target.value) : e.target.value)
                    }
                    className="w-full min-w-[80px] bg-btp-900/60 border border-btp-600/30 rounded px-2 py-1 text-slate-200 text-sm focus:outline-none focus:border-btp-500"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
