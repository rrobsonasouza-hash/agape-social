"use client";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react";
import toast from "react-hot-toast";
import { ZodError } from "zod";
import { roleLabels, Role } from "@/config/roles";
import { Card } from "@/components/forms/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import { useUsuarios } from "@/modules/usuarios/hooks/useUsuarios";
import {
  UsuarioDocumento,
  UsuarioFormData,
} from "@/modules/usuarios/types/usuario-documento";
import { maskTelefone } from "@/lib/formatters/masks";
import { useParoquia } from "@/modules/paroquias/hooks/useParoquia";
import { ParoquiaDocumento } from "@/modules/paroquias/types/paroquia-documento";

const inicial: UsuarioFormData = {
  nome: "",
  email: "",
  telefone: "",
  role: "operador",
  paroquiaId: "principal",
  paroquiaNome: "Paróquia principal",
  status: "PENDENTE",
  observacoes: "",
};
const perfis: Role[] = [
  "admin_plataforma",
  "admin_paroquia",
  "coordenador",
  "operador",
  "voluntario",
  "leitor",
];

export default function UsuariosPage() {
  const { listar, criar, atualizar, alterarStatus } = useUsuarios();
  const { listar: listarParoquias } = useParoquia(false);
  const [usuarios, setUsuarios] = useState<UsuarioDocumento[]>([]);
  const [paroquias, setParoquias] = useState<ParoquiaDocumento[]>([]);
  const [form, setForm] = useState<UsuarioFormData>(inicial);
  const [editandoId, setEditandoId] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [exibirForm, setExibirForm] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setUsuarios(await listar());
    } catch {
      toast.error("Não foi possível carregar os usuários.");
    } finally {
      setCarregando(false);
    }
  }, [listar]);
  useEffect(() => {
    void carregar();
  }, [carregar]);
  useEffect(() => { listarParoquias().then(setParoquias).catch(() => toast.error("Não foi possível carregar as paróquias.")); }, [listarParoquias]);
  const filtrados = useMemo(() => {
    const termo = pesquisa.toLowerCase().trim();
    return termo
      ? usuarios.filter((item) =>
          [
            item.nome,
            item.email,
            item.paroquiaNome,
            roleLabels[item.role],
          ].some((valor) => valor.toLowerCase().includes(termo)),
        )
      : usuarios;
  }, [pesquisa, usuarios]);
  function editar(usuario: UsuarioDocumento) {
    setEditandoId(usuario.id);
    setForm({
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
      role: usuario.role,
      paroquiaId: usuario.paroquiaId,
      paroquiaNome: usuario.paroquiaNome,
      status: usuario.status,
      observacoes: usuario.observacoes,
    });
    setExibirForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function novo() {
    setEditandoId("");
    const paroquia = paroquias.find((item) => item.ativa) ?? paroquias[0];
    setForm(paroquia ? { ...inicial, paroquiaId: paroquia.id, paroquiaNome: paroquia.nome } : inicial);
    setExibirForm(true);
  }
  async function salvar(event: FormEvent) {
    event.preventDefault();
    setSalvando(true);
    try {
      if (editandoId) await atualizar(editandoId, form);
      else await criar(form);
      toast.success(
        editandoId ? "Perfil atualizado." : "Usuário criado. Enviamos a definição de senha por e-mail.",
      );
      setExibirForm(false);
      setEditandoId("");
      setForm(inicial);
      await carregar();
    } catch (error) {
      toast.error(
        error instanceof ZodError
          ? error.issues[0]?.message || "Revise os dados."
          : error instanceof Error
            ? error.message
            : "Não foi possível salvar.",
      );
    } finally {
      setSalvando(false);
    }
  }
  async function alternar(usuario: UsuarioDocumento) {
    const status = usuario.status === "INATIVO" ? "ATIVO" : "INATIVO";
    try {
      await alterarStatus(usuario.id, status);
      toast.success(
        status === "ATIVO" ? "Perfil ativado." : "Perfil desativado.",
      );
      await carregar();
    } catch {
      toast.error("Não foi possível alterar o status.");
    }
  }
  const colunas: DataTableColumn<UsuarioDocumento>[] = [
    {
      key: "usuario",
      title: "Usuário",
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-900">{item.nome}</p>
          <p className="text-xs text-slate-500">{item.email}</p>
        </div>
      ),
    },
    { key: "perfil", title: "Perfil", render: (item) => roleLabels[item.role] },
    { key: "paroquia", title: "Paróquia", render: (item) => item.paroquiaNome },
    {
      key: "status",
      title: "Status",
      render: (item) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "ATIVO" ? "bg-emerald-100 text-emerald-700" : item.status === "INATIVO" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}
        >
          {item.status === "PENDENTE"
            ? "Aguardando credencial"
            : item.status === "ATIVO"
              ? "Ativo"
              : "Inativo"}
        </span>
      ),
    },
    {
      key: "acoes",
      title: "Ações",
      render: (item) => (
        <div className="flex gap-2">
          <button
            onClick={() => editar(item)}
            className="rounded-lg border border-blue-200 p-2 text-blue-700"
            title="Editar"
          >
            <Pencil size={17} />
          </button>
          <button
            onClick={() => void alternar(item)}
            className="rounded-lg border border-slate-200 p-2 text-slate-600"
            title={item.status === "INATIVO" ? "Ativar" : "Desativar"}
          >
            {item.status === "INATIVO" ? (
              <UserCheck size={17} />
            ) : (
              <UserX size={17} />
            )}
          </button>
        </div>
      ),
    },
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários e permissões"
        description="Administre os perfis que trabalham na pastoral e limite o acesso conforme a responsabilidade."
        actions={
          <button
            onClick={novo}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white"
          >
            <Plus size={18} /> Novo usuário
          </button>
        }
      />
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 shrink-0" size={20} />
          <p>
            <strong>Cadastro seguro:</strong> ao salvar, o Ágape cria a credencial,
            aplica o perfil de acesso e envia ao usuário um e-mail para definir a senha.
          </p>
        </div>
      </div>
      {exibirForm && (
        <Card title={editandoId ? "Editar usuário" : "Cadastrar usuário"}>
          <form onSubmit={salvar} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium">
                Nome completo
                <input
                  className="mt-2 w-full rounded-lg border px-4 py-3 font-normal"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  required
                />
              </label>
              <label className="text-sm font-medium">
                E-mail
                <input
                  type="email"
                  className="mt-2 w-full rounded-lg border px-4 py-3 font-normal"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </label>
              <label className="text-sm font-medium">
                Telefone
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={15}
                  placeholder="(11) 99999-9999"
                  className="mt-2 w-full rounded-lg border px-4 py-3 font-normal"
                  value={form.telefone}
                  onChange={(e) =>
                    setForm({ ...form, telefone: maskTelefone(e.target.value) })
                  }
                />
              </label>
              <label className="text-sm font-medium">
                Perfil
                <select
                  className="mt-2 w-full rounded-lg border bg-white px-4 py-3 font-normal"
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as Role })
                  }
                >
                  {perfis.map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium md:col-span-2">
                Paróquia
                <select className="mt-2 w-full rounded-lg border bg-white px-4 py-3 font-normal" value={form.paroquiaId} onChange={(e) => { const paroquia = paroquias.find((item) => item.id === e.target.value); setForm({ ...form, paroquiaId: e.target.value, paroquiaNome: paroquia?.nome || "" }); }} required>
                  {form.paroquiaId === "principal" && <option value="principal">{form.paroquiaNome}</option>}
                  {paroquias.filter((item) => item.ativa || item.id === form.paroquiaId).map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                </select>
              </label>
            </div>
            <label className="block text-sm font-medium">
              Observações
              <textarea
                className="mt-2 min-h-24 w-full rounded-lg border px-4 py-3 font-normal"
                value={form.observacoes}
                onChange={(e) =>
                  setForm({ ...form, observacoes: e.target.value })
                }
              />
            </label>
            <div className="flex gap-3">
              <button
                disabled={salvando}
                className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-60"
              >
                {salvando ? "Salvando..." : "Salvar perfil"}
              </button>
              <button
                type="button"
                onClick={() => setExibirForm(false)}
                className="rounded-lg border px-5 py-3 font-semibold text-slate-700"
              >
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}
      <Card title="Pesquisar usuários">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="search"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="w-full rounded-lg border py-3 pl-12 pr-4"
            placeholder="Nome, e-mail, perfil ou paróquia..."
          />
        </div>
      </Card>
      <Card title="Perfis cadastrados">
        <DataTable
          data={filtrados}
          columns={colunas}
          getRowKey={(item) => item.id}
          loading={carregando}
          emptyTitle="Nenhum usuário cadastrado"
          emptyDescription="Cadastre os responsáveis pela operação da pastoral."
        />
      </Card>
    </div>
  );
}
