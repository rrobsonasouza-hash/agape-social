import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface ProfileSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ProfileSection({ title, description, icon: Icon, actions, children, className = "" }: ProfileSectionProps) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Icon size={20} aria-hidden="true" />
            </span>
          )}
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
