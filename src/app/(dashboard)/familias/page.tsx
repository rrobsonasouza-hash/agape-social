"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/forms/Button";
import { Card } from "@/components/forms/Card";
import { useFamilias } from "@/modules/familias/hooks/useFamilias";
import { FamiliaDocumento } from "@/modules/familias/types/familia-documento";

export default function FamiliasPage() {
  const { listar } = useFamilias();

  const [familias, setFamilias] = useState<FamiliaDocumento[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarFamilias() {
      try {
        const dados = await listar();
        setFamilias(dados);
      } catch (error) {
        console.error("Erro ao carregar famílias:", error);
        toast.error("Não foi possível carregar as famílias.");
      } finally {
        setCarregando(false);
      }
    }

    carregarFamilias();
  }, [listar]);

  const familiasFiltradas = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    if (!termo) {
      return familias;
    }

    return familias.filter((familia) => {
      return (
        familia.nomeResponsavel.toLowerCase().includes(termo) ||
        familia.cpf.toLowerCase().includes(termo) ||
        familia.telefone.toLowerCase().includes(termo) ||
        familia.cidade?.toLowerCase().includes(termo)
      );
    });
  }, [familias, pesquisa]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Famílias
          </h1>

          <p className="mt-1 text-slate-500">
            Cadastro e acompanhamento das famílias atendidas.
          </p>
        </div>

        <Link href="/familias/nova">
          <Button className="flex items-center justify-center gap-2">
            <Plus size={18} />
            Nova Família
          </Button>
        </Link>
      </div>

      <Card title="Pesquisar">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            value={pesquisa}
            onChange={(event) => setPesquisa(event.target.value)}
            className="w-full rounded-lg border border-slate-300 py-3 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="Pesquisar por nome, CPF, telefone ou cidade..."
          />
        </div>
      </Card>

      <Card title="Famílias cadastradas">
        {carregando ? (
          <div className="py-12 text-center text-slate-500">
            Carregando famílias...
          </div>
        ) : familiasFiltradas.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Users size={48} className="mb-4 text-slate-300" />

            <p className="font-medium text-slate-700">
              Nenhuma família encontrada.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Cadastre uma nova família ou altere os termos da pesquisa.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-sm text-slate-600">
                  <th className="px-4 py-3 font-semibold">Responsável</th>
                  <th className="px-4 py-3 font-semibold">CPF</th>
                  <th className="px-4 py-3 font-semibold">Telefone</th>
                  <th className="px-4 py-3 font-semibold">Cidade</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody>
                {familiasFiltradas.map((familia) => (
                  <tr
                    key={familia.id}
                    className="border-b text-sm transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-4 font-medium text-slate-900">
                      {familia.nomeResponsavel}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {familia.cpf}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {familia.telefone}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {familia.cidade || "Não informada"}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          familia.status === "ATIVA"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {familia.status === "ATIVA" ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}