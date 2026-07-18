import { User } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { UsuarioDocumento, UsuarioFormData } from "@/modules/usuarios/types/usuario-documento";
import { supabase } from "@/lib/supabase/client";
import { IdentidadeSessao } from "@/lib/auth/client-session";
export class AcessoRepository {
  async carregarPerfilSessao(identidade: IdentidadeSessao): Promise<UsuarioDocumento> {
    if (identidade.provedor === "firebase" && identidade.firebaseUser) return this.carregarPerfil(identidade.firebaseUser);
    const { data, error } = await supabase.from("perfis").select("id,nome,email,telefone,perfil,status,observacoes,paroquia_id").eq("id", identidade.uid).maybeSingle();
    if (error || !data) throw new Error("Seu e-mail ainda não possui um perfil autorizado no Ágape.");
    if (data.status !== "ATIVO") throw new Error("Seu acesso está desativado. Procure o administrador responsável.");
    return { id: data.id, nome: data.nome, email: data.email, telefone: data.telefone || "", role: data.perfil, paroquiaId: data.paroquia_id || "principal", paroquiaNome: "", status: data.status, observacoes: data.observacoes || "" } as UsuarioDocumento;
  }
  async carregarPerfil(user: User): Promise<UsuarioDocumento> {
    const porUid = await getDoc(doc(db, "usuarios", user.uid));
    if (porUid.exists()) { const perfil = { id: porUid.id, ...(porUid.data() as UsuarioFormData) }; if (perfil.status === "INATIVO") throw new Error("Seu acesso está desativado. Procure o administrador da paróquia."); return perfil; }
    const snapshot = await getDocs(collection(db, "usuarios"));
    const perfis = snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as UsuarioFormData) }));
    const email = user.email?.toLowerCase() || "";
    const correspondente = perfis.find((item) => item.email.toLowerCase() === email);
    if (correspondente) {
      if (correspondente.status === "INATIVO") throw new Error("Seu acesso está desativado. Procure o administrador da paróquia.");
      const perfil: UsuarioFormData = { nome: correspondente.nome, email: correspondente.email, telefone: correspondente.telefone, role: correspondente.role, paroquiaId: correspondente.paroquiaId, paroquiaNome: correspondente.paroquiaNome, status: "ATIVO", observacoes: correspondente.observacoes };
      await setDoc(doc(db, "usuarios", user.uid), { ...perfil, authUid: user.uid, updatedAt: serverTimestamp() });
      if (correspondente.id !== user.uid) await deleteDoc(doc(db, "usuarios", correspondente.id));
      return { id: user.uid, ...perfil };
    }
    const existeAdministrador = perfis.some((item) => item.status === "ATIVO" && ["admin_plataforma", "admin_paroquia"].includes(item.role));
    if (existeAdministrador) throw new Error("Seu e-mail ainda não possui um perfil autorizado no Ágape.");
    const perfil: UsuarioFormData = { nome: user.displayName || email.split("@")[0] || "Administrador", email, telefone: "", role: "admin_paroquia", paroquiaId: "principal", paroquiaNome: "Paróquia principal", status: "ATIVO", observacoes: "Administrador inicial do sistema." };
    await setDoc(doc(db, "usuarios", user.uid), { ...perfil, authUid: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return { id: user.uid, ...perfil };
  }
}
