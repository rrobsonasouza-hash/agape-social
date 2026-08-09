"use client";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Copy,
  Link as LinkIcon,
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
import { enviarRecuperacaoSenha } from "@/lib/auth/client-session";
import { useUsuarios } from "@/modules/usuarios/hooks/useUsuarios";
import {
  CriarUsuarioResultado,
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
  paroquiaNome: "Paroquia principal",
  status: "PENDENTE",
  observacoes: "",
};
const perfis: Role[] = [
  "admin_paroquia",
  "coordenador",
  "operador",
  "voluntario",
  "leitor",
  "atendente_secretaria",
  "tesoureiro",
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
  const [linkConvite, setLinkConvite] = useState("");
  const [nomeConvite, setNomeConvite] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setUsuarios(await listar());
    } catch {
      toast.error("Nao foi possivel carregar os usuarios.");
    } finally {
      setCarregando(false);
    }
  }, [listar]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    listarParoquias()
      .then(setParoquias)
      .catch(() => toast.error("Nao foi possivel carregar as paroquias."));
  }, [listarParoquias]);

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

  function limparFormulario() {
    setExibirForm(false);
    setEditandoId("");
    setForm(inicial);
  }

  function editar(usuario: UsuarioDocumento) {
    setEditandoId(usuario.id);
    setLinkConvite("");
    setNomeConvite("");
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
    setLinkConvite("");
    setNomeConvite("");
    const paroquia = paroquias.find((item) => item.ativa) ?? paroquias[0];
    setForm(paroquia ? { ...inicial, paroquiaId: paroquia.id, paroquiaNome: paroquia.nome } : inicial);
    setExibirForm(true);
  }

  async function copiarLinkConvite() {
    try {
      await navigator.clipboard.writeText(linkConvite);
      toast.success("Link copiado.");
    } catch {
      toast.error("Nao foi possivel copiar o link.");
    }
  }

  async function salvar(event: FormEvent) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const gerarLinkDefinicaoSenha = !editandoId && submitter?.dataset.acao === "gerar-link";
    setSalvando(true);
    try {
      let resultado: CriarUsuarioResultado | null = null;
      if (editandoId) {
        await atualizar(editandoId, form);
        setLinkConvite("");
        setNomeConvite("");
        toast.success("Perfil atualizado.");
      } else {
        resultado = await criar(form, { gerarLinkDefinicaoSenha });
        let emailEnviado = true;
        try {
          await enviarRecuperacaoSenha(form.email);
        } catch {
          emailEnviado = false;
        }
        if (resultado.linkDefinicaoSenha) {
          setLinkConvite(resultado.linkDefinicaoSenha);
          setNomeConvite(form.nome);
          toast.success(emailEnviado ? "Usuario criado. E-mail enviado e link pronto para copiar." : "Usuario criado. Link pronto para copiar.");
          if (!emailEnviado) {
            toast("Nao foi possivel enviar o e-mail nesta tentativa.");
          }
        } else {
          setLinkConvite("");
          setNomeConvite("");
          toast.success(emailEnviado ? "Usuario criado. Enviamos a definicao de senha por e-mail." : "Usuario criado.");
          if (!emailEnviado) {
            toast("Nao foi possivel enviar o e-mail nesta tentativa.");
          }
          if (resultado.erroGeracaoLink) {
            toast("Nao foi possivel gerar o link para compartilhar nesta tentativa.");
          }
        }
      }
      limparFormulario();
      await carregar();
    } catch (error) {
      toast.error(
        error instanceof ZodError
          ? error.issues[0]?.message || "Revise os dados."
          : error instanceof Error
            ? error.message
            : "Nao foi possivel salvar.",
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
      toast.error("Nao foi possivel alterar o status.");
    }
  }

  const colunas: DataTableColumn<UsuarioDocumento>[] = [
    {
      key: "usuario",
      title: "Usuario",
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-900">{item.nome}</p>
          <p className="text-xs text-slate-500">{item.email}</p>
        </div>
      ),
    },
    { key: "perfil", title: "Perfil", render: (item) => roleLabels[item.role] },
    { key: "paroquia", title: "Paroquia", render: (item) => item.paroquiaNome },
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
      title: "Acoes",
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
        title="Usuarios e permissoes"
        description="Administre os perfis que trabalham na pastoral e limite o acesso conforme a responsabilidade."
        actions={
          <button
            onClick={novo}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white"
          >
            <Plus size={18} /> Novo usuario
          </button>
        }
      />
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 shrink-0" size={20} />
          <p>
            <strong>Cadastro seguro:</strong> ao salvar, o Agape cria a credencial,
            aplica o perfil de acesso e envia ao usuario um e-mail para definir a senha.
            Se preferir, voce tambem pode gerar um link pronto para copiar e colar no WhatsApp.
          </p>
        </div>
      </div>
      {linkConvite && (
        <Card title="Link para compartilhar">
          <div className="space-y-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <div className="flex gap-3">
                <LinkIcon className="mt-0.5 shrink-0" size={18} />
                <p>
                  Link de definicao de senha gerado para <strong>{nomeConvite}</strong>.
                  Copie abaixo e cole no WhatsApp quando quiser.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                readOnly
                value={linkConvite}
                className="w-full rounded-lg border bg-slate-50 px-4 py-3 text-sm text-slate-700"
              />
              <button
                type="button"
                onClick={() => void copiarLinkConvite()}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 px-4 py-3 font-semibold text-blue-700"
              >
                <Copy size={17} /> Copiar link
              </button>
            </div>
          </div>
        </Card>
      )}
      {exibirForm && (
        <Card title={editandoId ? "Editar usuario" : "Cadastrar usuario"}>
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
                Paroquia
                <select
                  className="mt-2 w-full rounded-lg border bg-white px-4 py-3 font-normal"
                  value={form.paroquiaId}
                  onChange={(e) => {
                    const paroquia = paroquias.find((item) => item.id === e.target.value);
                    setForm({ ...form, paroquiaId: e.target.value, paroquiaNome: paroquia?.nome || "" });
                  }}
                  required
                >
                  {form.paroquiaId === "principal" && <option value="principal">{form.paroquiaNome}</option>}
                  {paroquias.filter((item) => item.ativa || item.id === form.paroquiaId).map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                </select>
              </label>
            </div>
            <label className="block text-sm font-medium">
              Observacoes
              <textarea
                className="mt-2 min-h-24 w-full rounded-lg border px-4 py-3 font-normal"
                value={form.observacoes}
                onChange={(e) =>
                  setForm({ ...form, observacoes: e.target.value })
                }
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                disabled={salvando}
                className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-60"
              >
                {salvando ? "Salvando..." : "Salvar perfil"}
              </button>
              {!editandoId && (
                <button
                  type="submit"
                  data-acao="gerar-link"
                  disabled={salvando}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-3 font-semibold text-emerald-700 disabled:opacity-60"
                >
                  {salvando ? "Salvando..." : "Salvar + gerar link"}
                </button>
              )}
              <button
                type="button"
                onClick={limparFormulario}
                className="rounded-lg border px-5 py-3 font-semibold text-slate-700"
              >
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}
      <Card title="Pesquisar usuarios">
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
            placeholder="Nome, e-mail, perfil ou paroquia..."
          />
        </div>
      </Card>
      <Card title="Perfis cadastrados">
        <DataTable
          data={filtrados}
          columns={colunas}
          getRowKey={(item) => item.id}
          loading={carregando}
          emptyTitle="Nenhum usuario cadastrado"
          emptyDescription="Cadastre os responsaveis pela operacao da pastoral."
        />
      </Card>
    </div>
  );
}
