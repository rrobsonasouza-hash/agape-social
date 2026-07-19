"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { entrar as entrarComEmail, enviarRecuperacaoSenha } from "@/lib/auth/client-session";
import { useAuth } from "@/modules/auth/hooks/useAuth";

function mensagemErro(codigo?: string) {
  if (codigo === "auth/invalid-credential") return "E-mail ou senha inválidos.";
  if (codigo === "auth/too-many-requests") return "Muitas tentativas. Aguarde alguns minutos.";
  if (codigo === "auth/user-disabled") return "Este usuário está desativado.";
  if (codigo === "invalid_credentials") return "E-mail ou senha inválidos.";
  return "Não foi possível entrar. Verifique os dados e tente novamente.";
}

export default function LoginPage() {
  const router = useRouter();
  const { usuario, carregando } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => { if (!carregando && usuario) router.replace(usuario.role === "admin_plataforma" ? "/central" : usuario.role === "atendente_secretaria" ? "/secretaria" : "/dashboard"); }, [carregando, router, usuario]);

  async function entrar(event: FormEvent) {
    event.preventDefault(); setEnviando(true);
    try { await entrarComEmail(email, senha); }
    catch (error) { toast.error(mensagemErro((error as { code?: string }).code)); }
    finally { setEnviando(false); }
  }

  async function recuperarSenha() {
    if (!email.trim()) return toast.error("Informe seu e-mail primeiro.");
    try { await enviarRecuperacaoSenha(email); toast.success("Enviamos as instruções de recuperação para seu e-mail."); }
    catch { toast.error("Não foi possível enviar a recuperação de senha."); }
  }

  return <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6"><div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-xl"><div className="mb-8 text-center"><div className="mb-3 text-5xl">❤</div><h1 className="text-3xl font-bold text-slate-800">Ágape Social</h1><p className="mt-2 text-slate-500">Tecnologia a serviço da Caridade</p></div><blockquote className="mb-8 rounded-lg bg-slate-50 p-4 text-sm italic text-slate-600">“Todas as vezes que fizestes isso a um destes meus irmãos mais pequeninos, foi a mim que o fizestes.”<br /><strong>Mateus 25,40</strong></blockquote><form onSubmit={entrar} className="space-y-5"><div><label className="mb-2 block font-medium" htmlFor="email">E-mail</label><input id="email" type="email" className="w-full rounded-lg border px-4 py-3" placeholder="email@paroquia.org.br" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></div><div><label className="mb-2 block font-medium" htmlFor="senha">Senha</label><input id="senha" type="password" className="w-full rounded-lg border px-4 py-3" placeholder="••••••••" value={senha} onChange={(event) => setSenha(event.target.value)} required autoComplete="current-password" /></div><button type="submit" disabled={enviando} className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">{enviando ? "Entrando..." : "Entrar"}</button></form><div className="mt-6 text-center"><button type="button" onClick={recuperarSenha} className="text-blue-600 hover:underline">Esqueci minha senha</button></div><div className="mt-8 border-t pt-4 text-center text-sm text-slate-400">Versão 0.1.0 • Open Source ❤</div></div></div>;
}
