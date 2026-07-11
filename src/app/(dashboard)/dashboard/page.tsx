import {
  Users,
  Package,
  Gift,
  HeartHandshake,
} from "lucide-react";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";

export default function DashboardPage() {
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>

        <p className="text-gray-500">
          Bem-vindo ao Ágape Social.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Famílias Ativas"
          value={0}
          description="Famílias cadastradas"
          icon={Users}
        />

        <DashboardCard
          title="Produtos"
          value={0}
          description="Itens em estoque"
          icon={Package}
        />

        <DashboardCard
          title="Cestas Entregues"
          value={0}
          description="Neste mês"
          icon={Gift}
        />

        <DashboardCard
          title="Voluntários"
          value={0}
          description="Ativos"
          icon={HeartHandshake}
        />
      </div>

      <WelcomeCard />

    </div>
  );
}