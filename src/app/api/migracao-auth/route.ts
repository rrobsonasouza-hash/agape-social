import { NextRequest, NextResponse } from "next/server";
import { exigirAdministrador } from "@/lib/auth/admin-request";
import { adminDb } from "@/lib/firebase/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { resolverParoquia } from "@/lib/supabase/tenant";

type PerfilFirebase = { nome?: string; email?: string; telefone?: string; role?: string; paroquiaId?: string; status?: string; observacoes?: string };

export async function POST(request: NextRequest) {
  try {
    const administrador = await exigirAdministrador(request); if (administrador.role !== "admin_plataforma") throw new Error("FORBIDDEN");
    const supabase = supabaseAdmin(); const snapshot = await adminDb().collection("usuarios").get();
    const { data: usuariosAuth, error: erroLista } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }); if (erroLista) throw erroLista;
    const porEmail = new Map(usuariosAuth.users.map((item) => [item.email?.toLowerCase(), item]));
    const resultado = { total: snapshot.size, convidados: 0, existentes: 0, perfisSincronizados: 0, falhas: [] as string[] };
    for (const documento of snapshot.docs) {
      const perfil = documento.data() as PerfilFirebase; const email = perfil.email?.trim().toLowerCase();
      if (!email || !perfil.role) { resultado.falhas.push(`${documento.id}: perfil sem e-mail ou função.`); continue; }
      try {
        let usuarioAuth = porEmail.get(email);
        if (!usuarioAuth) {
          const convite = await supabase.auth.admin.inviteUserByEmail(email, { data: { nome: perfil.nome || email.split("@")[0] }, redirectTo: `${request.nextUrl.origin}/definir-senha` });
          if (convite.error) throw convite.error; usuarioAuth = convite.data.user; resultado.convidados += 1;
        } else resultado.existentes += 1;
        const { paroquiaId } = await resolverParoquia(perfil.paroquiaId || "principal");
        const status = ["PENDENTE", "ATIVO", "INATIVO"].includes(perfil.status || "") ? perfil.status : "ATIVO";
        const { error } = await supabase.from("perfis").upsert({ id: usuarioAuth.id, paroquia_id: paroquiaId, nome: perfil.nome || email.split("@")[0], email, telefone: perfil.telefone || "", perfil: perfil.role, status, observacoes: perfil.observacoes || "", updated_at: new Date().toISOString() }, { onConflict: "id" });
        if (error) throw error; resultado.perfisSincronizados += 1;
      } catch (error) { resultado.falhas.push(`${email}: ${error instanceof Error ? error.message : "falha desconhecida"}`); }
    }
    return NextResponse.json({ sucesso: resultado.falhas.length === 0, resultado });
  } catch (error) { const mensagem = error instanceof Error ? error.message : "Não foi possível sincronizar os usuários."; return NextResponse.json({ erro: mensagem }, { status: mensagem === "FORBIDDEN" ? 403 : 500 }); }
}
