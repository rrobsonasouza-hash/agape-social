"use client";

import { Bell, UserCircle } from "lucide-react";

interface TopbarProps {
  userName?: string;
}

export function Topbar({
  userName = "Administrador",
}: TopbarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">
          Dashboard
        </h2>

        <p className="text-sm text-gray-500">
          Bem-vindo ao Ágape Social
        </p>
      </div>

      <div className="flex items-center gap-5">
        <button className="relative rounded-full p-2 hover:bg-gray-100 transition">
          <Bell size={20} />

          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="flex items-center gap-2">
          <UserCircle size={34} className="text-blue-700" />

          <div className="text-right">
            <p className="text-sm font-medium">
              {userName}
            </p>

            <p className="text-xs text-gray-500">
              Administrador
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}