import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function exigirUsuarioAtivo(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("UNAUTHENTICATED");
  const decoded = await adminAuth().verifyIdToken(token);
  const perfil = await adminDb().collection("usuarios").doc(decoded.uid).get();
  const dados = perfil.data() as { nome?: string; email?: string; status?: string; role?: string; paroquiaId?: string } | undefined;
  if (!perfil.exists || dados?.status !== "ATIVO" || !dados.role) throw new Error("FORBIDDEN");
  return { uid: decoded.uid, nome: dados?.nome || decoded.name || "Administrador", email: dados?.email || decoded.email || "", role: dados?.role || "", paroquiaId: dados?.paroquiaId || "principal" };
}

export async function exigirAdministrador(request: NextRequest) {
  const usuario = await exigirUsuarioAtivo(request);
  if (!["admin_plataforma", "admin_paroquia"].includes(usuario.role)) throw new Error("FORBIDDEN");
  return usuario;
}
