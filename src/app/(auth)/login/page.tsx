"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  function entrar(e: React.FormEvent) {
    e.preventDefault();

    // TODO: Na próxima etapa será feita a autenticação com Firebase
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mb-3 text-6xl">❤️</div>

          <h1 className="text-3xl font-bold text-slate-800">
            Ágape Social
          </h1>

          <p className="mt-2 text-slate-500">
            Tecnologia a serviço da Caridade
          </p>
        </div>

        <blockquote className="mb-8 rounded-lg bg-slate-50 p-4 text-sm italic text-slate-600">
          "Todas as vezes que fizestes isso a um destes meus irmãos mais
          pequeninos, foi a mim que o fizestes."
          <br />
          <strong>Mateus 25,40</strong>
        </blockquote>

        <form onSubmit={entrar} className="space-y-5">
          <div>
            <label className="mb-2 block font-medium">
              E-mail
            </label>

            <input
              type="email"
              className="w-full rounded-lg border px-4 py-3"
              placeholder="email@paroquia.org.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Senha
            </label>

            <input
              type="password"
              className="w-full rounded-lg border px-4 py-3"
              placeholder="********"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Entrar
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            className="text-blue-600 hover:underline"
          >
            Esqueci minha senha
          </button>
        </div>

        <div className="mt-8 border-t pt-4 text-center text-sm text-slate-400">
          Versão 0.1.0 • Open Source ❤️
        </div>
      </div>
    </div>
  );
}