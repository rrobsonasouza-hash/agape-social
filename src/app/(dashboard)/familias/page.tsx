import Link from "next/link";
import { Button } from "@/components/forms/Button";
import { Card } from "@/components/forms/Card";

export default function FamiliasPage() {
  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold">
            Famílias
          </h1>

          <p className="text-gray-500">
            Cadastro e acompanhamento das famílias atendidas.
          </p>
        </div>

        <Link href="/familias/nova">
          <Button>
            + Nova Família
          </Button>
        </Link>

      </div>

      <Card title="Pesquisar">

        <input
          className="w-full rounded-lg border p-3"
          placeholder="Digite o nome da família..."
        />

      </Card>

      <Card title="Famílias Cadastradas">

        <div className="py-12 text-center text-gray-500">

          Nenhuma família cadastrada.

        </div>

      </Card>

    </div>
  );
}