import { safeRenderValue } from '@/utils/safeRenderValue';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

import { EmptyState } from './EmptyState';

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  emptyTitle?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  onRowClick,
  emptyMessage,
  emptyTitle,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? emptyMessage ?? '—'}
        description={emptyTitle ? emptyMessage : undefined}
      />
    );
  }
  return (
    <div className="overflow-x-auto -mx-2 table-scroll">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-btp-500/20 text-slate-400 text-start">
            {columns.map((col) => (
              <th key={col.key} className="px-3 py-2 font-medium whitespace-nowrap" style={{ width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-btp-800/50 hover:bg-btp-800/30 ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-2 text-slate-200">
                  {col.render
                    ? col.render(row)
                    : safeRenderValue((row as Record<string, unknown>)[col.key], '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
