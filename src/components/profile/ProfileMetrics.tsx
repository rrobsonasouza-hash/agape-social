import { LucideIcon } from "lucide-react";

export interface ProfileMetric {
  label: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
}

interface ProfileMetricsProps {
  items: ProfileMetric[];
}

export function ProfileMetrics({
  items,
}: ProfileMetricsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {item.label}
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {item.value}
                </p>

                {item.description && (
                  <p className="mt-1 text-sm text-slate-500">
                    {item.description}
                  </p>
                )}
              </div>

              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Icon size={21} />
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
}