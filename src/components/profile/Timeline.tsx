import { CalendarClock, LucideIcon } from "lucide-react";

import { TimelineItem, TimelineItemProps } from "@/components/profile/TimelineItem";

interface TimelineProps {
  items: Omit<TimelineItemProps, "isLast">[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
}

export function Timeline({ items, emptyTitle = "Nenhum registro até o momento.", emptyDescription, emptyIcon: EmptyIcon = CalendarClock }: TimelineProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 px-6 py-10 text-center">
        <EmptyIcon size={36} aria-hidden="true" className="mx-auto text-slate-300" />
        <p className="mt-4 font-medium text-slate-700">{emptyTitle}</p>
        {emptyDescription && <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">{emptyDescription}</p>}
      </div>
    );
  }

  return (
    <ol aria-label="Linha do tempo">
      {items.map((item, index) => (
        <TimelineItem key={`${item.title}-${item.date ?? index}`} {...item} isLast={index === items.length - 1} />
      ))}
    </ol>
  );
}
