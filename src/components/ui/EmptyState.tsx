import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-8 py-12 text-center">

      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">

        <span className="text-3xl">
          📂
        </span>

      </div>

      <h2 className="text-xl font-semibold text-slate-800">
        {title}
      </h2>

      <p className="mt-2 text-slate-500">
        {description}
      </p>

      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}

    </div>
  );
}