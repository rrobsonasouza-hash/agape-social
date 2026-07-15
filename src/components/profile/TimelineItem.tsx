import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export interface TimelineItemProps {
  title: string;
  description?: ReactNode;
  date?: string;
  metadata?: ReactNode;
  icon?: LucideIcon;
  isLast?: boolean;
}

export function TimelineItem({ title, description, date, metadata, icon: Icon, isLast = false }: TimelineItemProps) {
  return (
    <li className="relative flex gap-4 pb-7 last:pb-0">
      {!isLast && <span aria-hidden="true" className="absolute bottom-0 left-5 top-10 w-px bg-slate-200" />}
      <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-700">
        {Icon ? <Icon size={18} aria-hidden="true" /> : <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          {date && <time className="shrink-0 text-sm text-slate-500">{date}</time>}
        </div>
        {description && <div className="mt-1 text-sm leading-6 text-slate-600">{description}</div>}
        {metadata && <div className="mt-3 text-xs font-medium text-slate-500">{metadata}</div>}
      </div>
    </li>
  );
}
