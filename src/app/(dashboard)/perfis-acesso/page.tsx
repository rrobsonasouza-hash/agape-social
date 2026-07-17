"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Card } from "@/components/forms/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { modulosConfiguraveis, PerfilConfiguravel, PermissoesPorPerfil } from "@/config/permissions";
import { roleLabels } from "@/config/roles";
import { usePermissoes } from "@/modules/permissoes/hooks/usePermissoes";

const perfis: PerfilConfiguravel[] = ["coordenador", "operador", "voluntario", "leitor"];
export default function PerfisAcessoPage() {
  const { permissoes, carregando, salvar } = usePermissoes(); const [form, setForm] = useState<PermissoesPorPerfil>(permissoes); const [salvando, setSalvando] = useState(false);
  useEffect(() => setForm(permissoes), [permissoes]);
  function alternar(perfil: PerfilConfiguravel, rota: string) { setForm((atual) => ({ ...atual, [perfil]: atual[perfil].includes(rota) ? atual[perfil].filter((item) => item !== rota) : [...atual[perfil], rota] })); }
  async function gravar() { setSalvando(true); try { await salvar(form); toast.success("Permissões atualizadas para esta paróquia."); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível salvar as permissões."); } finally { setSalvando(false); } }
  return <div className="space-y-6"><PageHeader title="Perfis e acessos" description="Defina quais áreas cada perfil pode visualizar nesta paróquia." /><div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">Administradores da paróquia sempre possuem acesso integral à própria unidade. O perfil Administrador da plataforma é exclusivo da Central.</div><Card title="Matriz de acesso">{carregando ? <p className="py-10 text-center text-slate-500">Carregando...</p> : <div className="overflow-x-auto"><table className="w-full border-collapse text-sm"><thead><tr><th className="border-b p-3 text-left">Módulo</th>{perfis.map((perfil) => <th key={perfil} className="border-b p-3 text-center">{roleLabels[perfil]}</th>)}</tr></thead><tbody>{modulosConfiguraveis.map((modulo) => <tr key={modulo.rota} className="border-b last:border-0"><td className="p-3 font-medium">{modulo.nome}</td>{perfis.map((perfil) => <td key={perfil} className="p-3 text-center"><input type="checkbox" className="h-5 w-5 accent-blue-600" checked={form[perfil].includes(modulo.rota)} onChange={() => alternar(perfil, modulo.rota)} aria-label={`${roleLabels[perfil]} pode acessar ${modulo.nome}`} /></td>)}</tr>)}</tbody></table></div>}</Card><div className="flex justify-end"><button type="button" onClick={() => void gravar()} disabled={salvando || carregando} className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-60">{salvando ? "Salvando..." : "Salvar permissões"}</button></div></div>;
}
