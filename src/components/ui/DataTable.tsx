import { ReactNode } from "react";

import { EmptyState } from "@/components/ui/EmptyState";

export interface DataTableColumn<T> {
  key: string;
  title: string;
  className?: string;
  headerClassName?: string;
  render: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowKey: (item: T) => string;
  loading?: boolean;
  loadingMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  loading = false,
  loadingMessage = "Carregando informações...",
  emptyTitle = "Nenhum registro encontrado",
  emptyDescription = "Ainda não existem registros para exibir.",
  emptyAction,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-xl border border-slate-200 bg-white">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm text-slate-500">
            {loadingMessage}
          </p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm text-slate-600">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 font-semibold ${
                    column.headerClassName ?? ""
                  }`}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((item) => (
              <tr
                key={getRowKey(item)}
                className="border-b border-slate-100 text-sm transition last:border-b-0 hover:bg-slate-50"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-4 text-slate-700 ${
                      column.className ?? ""
                    }`}
                  >
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}