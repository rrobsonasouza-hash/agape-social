import { Mail, Phone } from "lucide-react";
import { ReactNode } from "react";

import { StatusBadge } from "@/components/ui/StatusBadge";

interface ProfileHeaderProps {
  title: string;
  subtitle?: string;
  status?: string;
  since?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  actions?: ReactNode;
}

function obterIniciais(nome: string): string {
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) {
    return "?";
  }

  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }

  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

export function ProfileHeader({
  title,
  subtitle,
  status,
  since,
  phone,
  email,
  avatarUrl,
  actions,
}: ProfileHeaderProps) {
  const iniciais = obterIniciais(title);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-28 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500" />

      <div className="px-6 pb-6 sm:px-8">
        <div className="-mt-14 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-blue-100 text-3xl font-bold text-blue-700 shadow">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`Foto de ${title}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{iniciais}</span>
              )}
            </div>

            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900">
                  {title}
                </h1>

                {status && (
                  <StatusBadge status={status} />
                )}
              </div>

              {subtitle && (
                <p className="mt-1 text-base font-medium text-slate-600">
                  {subtitle}
                </p>
              )}

              {since && (
                <p className="mt-1 text-sm text-slate-500">
                  Desde {since}
                </p>
              )}
            </div>
          </div>

          {actions && (
            <div className="flex flex-col gap-3 sm:flex-row">
              {actions}
            </div>
          )}
        </div>

        {(phone || email) && (
          <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2">
            {phone && (
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                  <Phone size={17} />
                </span>

                <span>{phone}</span>
              </div>
            )}

            {email && (
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                  <Mail size={17} />
                </span>

                <span className="break-all">
                  {email}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}