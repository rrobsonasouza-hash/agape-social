"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { KeyRound, Pencil, RotateCcw, X } from "lucide-react";

import {
  enviarRecuperacaoSenha,
  obterTokenAcesso,
} from "@/lib/auth/client-session";
import { maskTelefone } from "@/lib/formatters/masks";
import { useAuth } from "@/modules/auth/hooks/useAuth";

type Administrador = {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  status: "ATIVO" | "INATIVO";
};
type Formulario = { nome: string; email: string; telefone: string };

async function requisicao<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await obterTokenAcesso();
  const resposta = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  const dados = await resposta.json();
  if (!resposta.ok)
    throw new Error(dados.erro || "Não foi possível concluir a operação.");
  return dados as T;
}

export default function AdministradoresPage() {
  const router = useRouter();
  const { usuario, carregando } = useAuth();
  const [administradores, setAdministradores] = useState<Administrador[]>([]);
  const [form, setForm] = useState<Formulario>({
    nome: "",
    email: "",
    telefone: "",
  });
  const [editando, setEditando] = useState<Administrador | null>(null);
  const [formEdicao, setFormEdicao] = useState<Formulario>({
    nome: "",
    email: "",
    telefone: "",
  });
  const [salvando, setSalvando] = useState(false);
  const [alterandoId, setAlterandoId] = useState("");
  const carregar = useCallback(async () => {
    try {
      setAdministradores(
        await requisicao<Administrador[]>("/api/administradores-plataforma"),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os administradores.",
      );
    }
  }, []);

  useEffect(() => {
    if (!carregando && !usuario) router.replace("/login");
    else if (!carregando && usuario?.role !== "admin_plataforma")
      router.replace("/dashboard");
  }, [carregando, router, usuario]);
  useEffect(() => {
    if (usuario?.role === "admin_plataforma") void carregar();
  }, [carregar, usuario]);

  async function cadastrar(event: FormEvent) {
    event.preventDefault();
    setSalvando(true);
    try {
      await requisicao("/api/administradores-plataforma", {
        method: "POST",
        body: JSON.stringify(form),
      });
      await enviarRecuperacaoSenha(form.email);
      toast.success(
        "Administrador criado. Enviamos o e-mail para definição de senha.",
      );
      setForm({ nome: "", email: "", telefone: "" });
      await carregar();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível cadastrar.",
      );
    } finally {
      setSalvando(false);
    }
  }
  async function alternar(item: Administrador) {
    const status = item.status === "ATIVO" ? "INATIVO" : "ATIVO";
    setAlterandoId(item.id);
    try {
      await requisicao(`/api/administradores-plataforma/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success(
        status === "ATIVO"
          ? "Administrador ativado."
          : "Administrador inativado.",
      );
      await carregar();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar o acesso.",
      );
    } finally {
      setAlterandoId("");
    }
  }
  function abrirEdicao(item: Administrador) {
    setEditando(item);
    setFormEdicao({
      nome: item.nome,
      email: item.email,
      telefone: item.telefone ?? "",
    });
  }
  async function salvarEdicao(event: FormEvent) {
    event.preventDefault();
    if (!editando) return;
    setAlterandoId(editando.id);
    try {
      await requisicao(
        `/api/administradores-plataforma/${editando.id}/editar`,
        { method: "PATCH", body: JSON.stringify(formEdicao) },
      );
      setEditando(null);
      toast.success("Dados do login atualizados.");
      await carregar();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o login.",
      );
    } finally {
      setAlterandoId("");
    }
  }
  async function novaSenha(item: Administrador) {
    if (!window.confirm(`Enviar o link de nova senha para ${item.email}?`))
      return;
    setAlterandoId(item.id);
    try {
      await enviarRecuperacaoSenha(item.email);
      toast.success("Link para definição de nova senha enviado.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar o link de senha.",
      );
    } finally {
      setAlterandoId("");
    }
  }

  if (carregando || usuario?.role !== "admin_plataforma")
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
        Verificando acesso...
      </div>
    );
  const inputClass = "mt-2 w-full rounded-lg border px-4 py-3 font-normal";
  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-blue-700">
              Administrar logins
            </h1>
            <p className="text-sm text-slate-500">
              Administradores com acesso geral à plataforma e a todas as
              paróquias.
            </p>
          </div>
          <Link
            href="/central"
            className="shrink-0 rounded-lg border px-4 py-2 font-medium text-slate-700"
          >
            Voltar à Central
          </Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-6 p-5 sm:p-8 lg:grid-cols-[380px_1fr]">
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <KeyRound className="text-blue-600" />
            <h2 className="text-lg font-semibold">Novo administrador</h2>
          </div>
          <form onSubmit={cadastrar} className="mt-5 space-y-4">
            <label className="block text-sm font-medium">
              Nome completo
              <input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className={inputClass}
                required
              />
            </label>
            <label className="block text-sm font-medium">
              E-mail
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
                required
              />
            </label>
            <label className="block text-sm font-medium">
              Telefone
              <input
                value={form.telefone}
                onChange={(e) =>
                  setForm({ ...form, telefone: maskTelefone(e.target.value) })
                }
                maxLength={15}
                className={inputClass}
                placeholder="(11) 99999-9999"
              />
            </label>
            <button
              disabled={salvando}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
            >
              {salvando ? "Criando..." : "Criar administrador"}
            </button>
          </form>
        </section>
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Administradores gerais</h2>
          <div className="mt-5 space-y-3">
            {administradores.map((item) => (
              <article
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4"
              >
                <div>
                  <p className="font-semibold">{item.nome}</p>
                  <p className="text-sm text-slate-500">{item.email}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.telefone || "Telefone não informado"}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "ATIVO" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                  >
                    {item.status === "ATIVO" ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => abrirEdicao(item)}
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium text-blue-700"
                  >
                    <Pencil size={16} />
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled={alterandoId === item.id}
                    onClick={() => void novaSenha(item)}
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium text-blue-700 disabled:opacity-50"
                  >
                    <RotateCcw size={16} />
                    Nova senha
                  </button>
                  <button
                    type="button"
                    disabled={
                      item.id === usuario.uid || alterandoId === item.id
                    }
                    onClick={() => void alternar(item)}
                    className="rounded-lg border px-3 py-2 text-sm font-medium text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {item.id === usuario.uid
                      ? "Conta atual"
                      : item.status === "ATIVO"
                        ? "Inativar"
                        : "Ativar"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
      {editando && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
          <form
            onSubmit={salvarEdicao}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Central de Administração
                </p>
                <h2 className="mt-1 text-xl font-bold">Editar login</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditando(null)}
                aria-label="Fechar"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X />
              </button>
            </div>
            <p className="text-sm text-slate-500">
              Atualize os dados usados para identificar e acessar o Ágape.
            </p>
            <label className="block text-sm font-medium">
              Nome completo
              <input
                value={formEdicao.nome}
                onChange={(e) =>
                  setFormEdicao({ ...formEdicao, nome: e.target.value })
                }
                className={inputClass}
                required
              />
            </label>
            <label className="block text-sm font-medium">
              E-mail de acesso
              <input
                type="email"
                value={formEdicao.email}
                onChange={(e) =>
                  setFormEdicao({ ...formEdicao, email: e.target.value })
                }
                className={inputClass}
                required
              />
            </label>
            <label className="block text-sm font-medium">
              Telefone
              <input
                value={formEdicao.telefone}
                onChange={(e) =>
                  setFormEdicao({
                    ...formEdicao,
                    telefone: maskTelefone(e.target.value),
                  })
                }
                maxLength={15}
                className={inputClass}
              />
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditando(null)}
                className="rounded-lg border px-4 py-3 font-semibold text-slate-700"
              >
                Cancelar
              </button>
              <button
                disabled={alterandoId === editando.id}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
              >
                <Pencil size={16} />
                {alterandoId === editando.id ? "Salvando..." : "Salvar login"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
