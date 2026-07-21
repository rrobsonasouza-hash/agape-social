"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Cloud, Download, FileSearch, ImageUp, RotateCcw, Search, ShieldCheck, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { Button } from "@/components/forms/Button";
import { FormSection } from "@/components/forms/FormSection";
import { TextField } from "@/components/forms/TextField";
import { MapaOpenStreetMap } from "@/components/maps/MapaOpenStreetMap";
import { PageHeader } from "@/components/ui/PageHeader";
import { useEndereco } from "@/modules/enderecos/hooks/useEndereco";
import { useParoquia } from "@/modules/paroquias/hooks/useParoquia";
import { obterTokenAcesso } from "@/lib/auth/client-session";
import {
  paroquiaSchema,
  ParoquiaFormData,
  ParoquiaFormInput,
} from "@/modules/paroquias/schemas/paroquia.schema";

const valoresIniciais: ParoquiaFormInput = {
  nome: "Paróquia Nossa Senhora Aparecida",
  cep: "02043-081",
  logradouro: "Parque Domingos Luís",
  numero: "273",
  complemento: "",
  bairro: "Jardim São Paulo",
  cidade: "São Paulo",
  estado: "SP",
  latitude: 0,
  longitude: 0,
  raioAtendimentoKm: 10,
};

type ValidacaoBackup={valido:boolean;arquivo:string;paroquia:string;geradoEm:string;totalRegistros:number;mensagem:string};
type BackupSelecionado={paroquia:{id:string;nome?:string};dados:Record<string,unknown[]>};
type SimulacaoRestauracao={paroquia:{id:string;nome:string};tabelas:string[];linhas:Array<{tabela:string;backup:number;atual:number;ausentesEstimados:number}>};
type BackupNuvem={nome:string;tamanhoBytes:number;criadoEm:string};

async function sha256NoNavegador(dados:unknown){const bytes=new TextEncoder().encode(JSON.stringify(dados));const hash=await crypto.subtle.digest("SHA-256",bytes);return Array.from(new Uint8Array(hash)).map(byte=>byte.toString(16).padStart(2,"0")).join("");}

export default function AdministracaoPage() {
  const { buscarPorCep, consultandoCep } = useEndereco();
  const { buscarPrincipal, salvarPrincipal } = useParoquia(false);
  const [carregando, setCarregando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [validandoBackup,setValidandoBackup]=useState(false);
  const [validacaoBackup,setValidacaoBackup]=useState<ValidacaoBackup|null>(null);
  const [backupSelecionado,setBackupSelecionado]=useState<BackupSelecionado|null>(null);
  const [simulacaoRestauracao,setSimulacaoRestauracao]=useState<SimulacaoRestauracao|null>(null);
  const [restaurando,setRestaurando]=useState(false);
  const [backupsNuvem,setBackupsNuvem]=useState<BackupNuvem[]>([]);
  const [carregandoNuvem,setCarregandoNuvem]=useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [enviandoLogo, setEnviandoLogo] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ParoquiaFormInput, unknown, ParoquiaFormData>({
    resolver: zodResolver(paroquiaSchema),
    defaultValues: valoresIniciais,
  });

  const latitude = watch("latitude");
  const longitude = watch("longitude");
  const raioAtendimentoKm = Number(watch("raioAtendimentoKm")) || 0;

  useEffect(() => {
    buscarPrincipal()
      .then((dados) => {
        if (dados) reset(dados);
      })
      .catch(() => toast.error("Não foi possível carregar a configuração da paróquia."))
      .finally(() => setCarregando(false));
  }, [buscarPrincipal, reset]);

  useEffect(() => { obterTokenAcesso().then(async token => { if (!token) return; const resposta = await fetch("/api/paroquias/logo", { headers: { Authorization: `Bearer ${token}` } }); if (resposta.ok) setLogoUrl((await resposta.json()).url); }).catch(() => undefined); }, []);

  async function enviarLogo(arquivo?: File) {
    if (!arquivo) return; setEnviandoLogo(true);
    try { const token = await obterTokenAcesso(); const formulario = new FormData(); formulario.append("logo", arquivo); const resposta = await fetch("/api/paroquias/logo", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formulario }); const dados = await resposta.json(); if (!resposta.ok) throw new Error(dados.erro || "Não foi possível enviar o logotipo."); setLogoUrl(dados.url); toast.success("Logotipo atualizado."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível enviar o logotipo."); }
    finally { setEnviandoLogo(false); }
  }

  async function removerLogo() {
    if (!window.confirm("Deseja remover o logotipo da paróquia?")) return; setEnviandoLogo(true);
    try { const token = await obterTokenAcesso(); const resposta = await fetch("/api/paroquias/logo", { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }); const dados = await resposta.json(); if (!resposta.ok) throw new Error(dados.erro || "Não foi possível remover o logotipo."); setLogoUrl(null); toast.success("Logotipo removido."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível remover o logotipo."); }
    finally { setEnviandoLogo(false); }
  }

  function definirPosicao(latitudeAtual: number, longitudeAtual: number) {
    setValue("latitude", latitudeAtual, { shouldDirty: true, shouldValidate: true });
    setValue("longitude", longitudeAtual, { shouldDirty: true, shouldValidate: true });
  }

  async function preencherEndereco() {
    try {
      const endereco = await buscarPorCep(getValues("cep"));
      setValue("cep", endereco.cep, { shouldValidate: true });
      setValue("logradouro", endereco.logradouro, { shouldDirty: true });
      setValue("complemento", endereco.complemento, { shouldDirty: true });
      setValue("bairro", endereco.bairro, { shouldDirty: true });
      setValue("cidade", endereco.cidade, { shouldDirty: true });
      setValue("estado", endereco.estado, { shouldDirty: true });

      if (endereco.latitude !== undefined && endereco.longitude !== undefined) {
        definirPosicao(endereco.latitude, endereco.longitude);
      }

      toast.success(
        endereco.latitude !== undefined
          ? "Endereço e ponto aproximado preenchidos pelo CEP."
          : "Endereço preenchido. Clique no mapa para marcar a igreja."
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível consultar o CEP.");
    }
  }

  async function salvar(data: ParoquiaFormData) {
    try {
      await salvarPrincipal(data);
      toast.success("Configuração da paróquia salva com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar paróquia:", error);
      toast.error("Não foi possível salvar a configuração da paróquia.");
    }
  }

  async function baixarBackup() {
    setExportando(true);
    try {
      const token = await obterTokenAcesso();
      const resposta = await fetch("/api/backup", { headers: { Authorization: `Bearer ${token}` } });
      if (!resposta.ok) { const dados = await resposta.json(); throw new Error(dados.erro || "Não foi possível gerar o backup."); }
      const arquivo = await resposta.blob(); const disposicao = resposta.headers.get("content-disposition") || ""; const nome = disposicao.match(/filename="([^"]+)"/)?.[1] || `backup-agape-${new Date().toISOString().slice(0, 10)}.json`;
      const url = URL.createObjectURL(arquivo); const link = document.createElement("a"); link.href = url; link.download = nome; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
      toast.success("Backup gerado com sucesso.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível gerar o backup."); }
    finally { setExportando(false); }
  }

  async function carregarBackupsNuvem(){setCarregandoNuvem(true);try{const token=await obterTokenAcesso();const resposta=await fetch("/api/backup/nuvem",{headers:{Authorization:`Bearer ${token}`}});const dados=await resposta.json();if(!resposta.ok)throw new Error(dados.erro);setBackupsNuvem(dados.arquivos??[]);}catch(error){toast.error(error instanceof Error?error.message:"Não foi possível carregar o cofre de backups.");}finally{setCarregandoNuvem(false);}}
  async function salvarBackupNuvem(){setCarregandoNuvem(true);try{const token=await obterTokenAcesso();const resposta=await fetch("/api/backup/nuvem",{method:"POST",headers:{Authorization:`Bearer ${token}`}});const dados=await resposta.json();if(!resposta.ok)throw new Error(dados.erro);toast.success("Backup salvo com segurança na nuvem.");await carregarBackupsNuvem();}catch(error){toast.error(error instanceof Error?error.message:"Não foi possível salvar o backup na nuvem.");}finally{setCarregandoNuvem(false);}}
  async function baixarBackupNuvem(nome:string){try{const token=await obterTokenAcesso();const resposta=await fetch(`/api/backup/nuvem?arquivo=${encodeURIComponent(nome)}`,{headers:{Authorization:`Bearer ${token}`}});if(!resposta.ok){const dados=await resposta.json();throw new Error(dados.erro);}const blob=await resposta.blob();const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=nome;link.click();URL.revokeObjectURL(url);}catch(error){toast.error(error instanceof Error?error.message:"Não foi possível baixar o backup.");}}
  async function excluirBackupNuvem(nome:string){if(!window.confirm(`Excluir definitivamente o backup ${nome}?`))return;try{const token=await obterTokenAcesso();const resposta=await fetch(`/api/backup/nuvem?arquivo=${encodeURIComponent(nome)}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});const dados=await resposta.json();if(!resposta.ok)throw new Error(dados.erro);toast.success("Backup removido da nuvem.");await carregarBackupsNuvem();}catch(error){toast.error(error instanceof Error?error.message:"Não foi possível excluir o backup.");}}

  async function validarBackup(arquivo?:File){if(!arquivo)return;setValidandoBackup(true);setValidacaoBackup(null);setBackupSelecionado(null);setSimulacaoRestauracao(null);try{if(arquivo.size>100*1024*1024)throw new Error("O arquivo excede o limite de 100 MB para validação no navegador.");const conteudo=JSON.parse(await arquivo.text()) as Record<string,unknown>;if(conteudo.formato!=="agape-social-backup")throw new Error("Este arquivo não é um backup do Ágape Social.");if(Number(conteudo.versao)<3)throw new Error("Backup antigo: gere um novo arquivo para obter a verificação de integridade.");if(!conteudo.dados||typeof conteudo.dados!=="object")throw new Error("O arquivo não contém a seção de dados.");const integridade=conteudo.integridade as {algoritmo?:string;dadosSha256?:string}|undefined;if(integridade?.algoritmo!=="SHA-256"||!integridade.dadosSha256)throw new Error("O arquivo não possui uma assinatura de integridade válida.");const hash=await sha256NoNavegador(conteudo.dados);if(hash!==integridade.dadosSha256)throw new Error("Falha de integridade: o conteúdo foi alterado ou está corrompido.");const resumo=conteudo.resumo&&typeof conteudo.resumo==="object"?conteudo.resumo as Record<string,number>:{};const total=Object.values(resumo).reduce((s,v)=>s+Number(v||0),0);if(total!==Number(conteudo.totalRegistros))throw new Error("A contagem de registros do arquivo não confere.");const paroquia=conteudo.paroquia as {id?:string;nome?:string}|undefined;if(!paroquia?.id)throw new Error("O backup não identifica a paróquia de origem.");const resultado={valido:true,arquivo:arquivo.name,paroquia:paroquia.nome||"Paróquia não identificada",geradoEm:String(conteudo.geradoEm||""),totalRegistros:total,mensagem:"Backup íntegro e pronto para armazenamento seguro."};setBackupSelecionado({paroquia:{id:paroquia.id,nome:paroquia.nome},dados:conteudo.dados as Record<string,unknown[]>});setValidacaoBackup(resultado);toast.success("Backup validado com sucesso.");}catch(error){const mensagem=error instanceof Error?error.message:"Não foi possível validar o backup.";setValidacaoBackup({valido:false,arquivo:arquivo.name,paroquia:"",geradoEm:"",totalRegistros:0,mensagem});toast.error(mensagem);}finally{setValidandoBackup(false);}}

  async function simularRestauracao(){if(!backupSelecionado)return;setRestaurando(true);try{const token=await obterTokenAcesso();const resposta=await fetch("/api/backup/restaurar",{headers:{Authorization:`Bearer ${token}`}});const atual=await resposta.json();if(!resposta.ok)throw new Error(atual.erro);if(atual.paroquia.id!==backupSelecionado.paroquia.id)throw new Error(`Este backup pertence a ${backupSelecionado.paroquia.nome||"outra paróquia"} e não pode ser restaurado em ${atual.paroquia.nome}.`);const linhas=(atual.tabelas as string[]).map(tabela=>{const backup=Array.isArray(backupSelecionado.dados[tabela])?backupSelecionado.dados[tabela].length:0;const quantidade=Number(atual.contagens[tabela]||0);return{tabela,backup,atual:quantidade,ausentesEstimados:Math.max(backup-quantidade,0)};});setSimulacaoRestauracao({paroquia:atual.paroquia,tabelas:atual.tabelas,linhas});toast.success("Simulação concluída. Nenhum dado foi alterado.");}catch(error){toast.error(error instanceof Error?error.message:"Não foi possível simular a restauração.");}finally{setRestaurando(false);}}

  async function restaurarAusentes(){if(!backupSelecionado||!simulacaoRestauracao)return;if(!window.confirm("Confirma a restauração somente dos registros ausentes? Dados existentes não serão substituídos."))return;setRestaurando(true);try{const token=await obterTokenAcesso();let inseridos=0;for(const tabela of simulacaoRestauracao.tabelas){const registros=Array.isArray(backupSelecionado.dados[tabela])?backupSelecionado.dados[tabela]:[];for(let inicio=0;inicio<registros.length;inicio+=100){const resposta=await fetch("/api/backup/restaurar",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({paroquiaId:backupSelecionado.paroquia.id,tabela,registros:registros.slice(inicio,inicio+100),confirmacao:"RESTAURAR_AUSENTES"})});const dados=await resposta.json();if(!resposta.ok)throw new Error(`${tabela}: ${dados.erro||"falha na restauração"}`);inseridos+=Number(dados.inseridos||0);}}toast.success(`Restauração concluída: ${inseridos} registro(s) inserido(s).`);await simularRestauracao();}catch(error){toast.error(error instanceof Error?error.message:"Não foi possível concluir a restauração. Você pode tentar novamente com segurança.");}finally{setRestaurando(false);}}

  if (carregando) {
    return <div className="py-16 text-center text-slate-500">Carregando configuração...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administração"
        description="Configure a paróquia e sua área territorial de atendimento."
      />

      <form onSubmit={handleSubmit(salvar)} className="space-y-6" noValidate>
        <FormSection title="Identidade visual" description="O logotipo aparece no cabeçalho junto ao nome da paróquia.">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border bg-slate-50">{logoUrl?<div role="img" aria-label="Logotipo atual da paróquia" className="h-full w-full bg-contain bg-center bg-no-repeat" style={{backgroundImage:`url(${JSON.stringify(logoUrl)})`}}/>:<ImageUp className="text-slate-300" size={36}/>}</div><div><p className="mb-3 text-sm text-slate-600">Use uma imagem quadrada em JPG ou PNG, de até 2 MB. Recomendação: 512 × 512 pixels.</p><div className="flex flex-wrap gap-2"><label className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white ${enviandoLogo?"pointer-events-none opacity-60":""}`}><ImageUp size={18}/>{enviandoLogo?"Enviando...":logoUrl?"Trocar logotipo":"Enviar logotipo"}<input type="file" accept="image/jpeg,image/png" className="sr-only" disabled={enviandoLogo} onChange={event=>{void enviarLogo(event.target.files?.[0]);event.currentTarget.value="";}}/></label>{logoUrl&&<button type="button" onClick={()=>void removerLogo()} disabled={enviandoLogo} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-red-200 px-4 py-2 font-semibold text-red-700 disabled:opacity-60"><Trash2 size={18}/>Remover</button>}</div></div></div>
        </FormSection>
        <FormSection title="Dados da paróquia" description="Identificação e endereço da sede pastoral.">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Nome da paróquia" {...register("nome")} error={errors.nome?.message} />
            <div>
              <TextField label="CEP" mask="cep" {...register("cep")} error={errors.cep?.message} />
              <button type="button" onClick={preencherEndereco} disabled={consultandoCep} className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-blue-700 disabled:opacity-60">
                <Search size={16} aria-hidden="true" />
                {consultandoCep ? "Consultando CEP..." : "Buscar endereço e ponto"}
              </button>
            </div>
            <TextField label="Logradouro" {...register("logradouro")} error={errors.logradouro?.message} />
            <TextField label="Número" {...register("numero")} error={errors.numero?.message} />
            <TextField label="Complemento" {...register("complemento")} error={errors.complemento?.message} />
            <TextField label="Bairro" {...register("bairro")} error={errors.bairro?.message} />
            <TextField label="Cidade" {...register("cidade")} error={errors.cidade?.message} />
            <TextField label="Estado" maxLength={2} {...register("estado")} error={errors.estado?.message} />
          </div>
        </FormSection>

        <FormSection title="Área de atendimento" description="Defina o ponto de referência e o raio para concessão de benefícios.">
          <div className="mb-4 max-w-xs">
            <TextField label="Raio de atendimento (km)" type="number" min={0.1} step={0.1} {...register("raioAtendimentoKm")} error={errors.raioAtendimentoKm?.message} />
          </div>
          <div className="mb-3">
            <p className="text-sm text-slate-500">Ajuste o marcador clicando exatamente sobre a igreja.</p>
          </div>
          <MapaOpenStreetMap
            latitude={latitude || null}
            longitude={longitude || null}
            interactive
            onPositionChange={definirPosicao}
            referenceLatitude={latitude || null}
            referenceLongitude={longitude || null}
            radiusKm={raioAtendimentoKm}
          />
          {errors.latitude?.message && <p className="mt-2 text-sm text-red-600">{errors.latitude.message}</p>}
        </FormSection>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar configuração"}
          </Button>
        </div>
      </form>

      <FormSection title="Backup da paróquia" description="Baixe uma cópia com verificação de integridade dos cadastros, dízimos, finanças, sacramentos e históricos. Senhas e chaves nunca são incluídas.">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-2xl text-sm text-slate-600">Guarde o arquivo em local seguro, pois ele contém dados pessoais das famílias, voluntários, doadores e usuários.</p>
          <button type="button" onClick={() => void baixarBackup()} disabled={exportando} className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-3 font-semibold text-white transition hover:bg-slate-900 disabled:opacity-60"><Download size={18} />{exportando ? "Gerando..." : "Baixar backup"}</button>
        </div>
        <div className="mt-5 border-t pt-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><h3 className="font-bold text-slate-900">Validar um arquivo salvo</h3><p className="mt-1 text-sm text-slate-600">A validação é local. Somente após sua confirmação os registros ausentes são enviados em lotes seguros.</p></div><label className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-blue-200 px-4 py-2 font-semibold text-blue-700 ${validandoBackup?"pointer-events-none opacity-60":""}`}><FileSearch size={18}/>{validandoBackup?"Validando...":"Selecionar backup"}<input type="file" accept="application/json,.json" className="sr-only" disabled={validandoBackup} onChange={event=>{void validarBackup(event.target.files?.[0]);event.currentTarget.value="";}}/></label></div>{validacaoBackup&&<div className={`mt-4 rounded-xl border p-4 ${validacaoBackup.valido?"border-emerald-200 bg-emerald-50":"border-red-200 bg-red-50"}`}><div className="flex items-start gap-3"><ShieldCheck className={validacaoBackup.valido?"text-emerald-700":"text-red-700"}/><div><p className={`font-bold ${validacaoBackup.valido?"text-emerald-800":"text-red-800"}`}>{validacaoBackup.valido?"Backup válido":"Backup inválido"}</p><p className="text-sm text-slate-700">{validacaoBackup.mensagem}</p><p className="mt-2 text-xs text-slate-500">Arquivo: {validacaoBackup.arquivo}{validacaoBackup.valido&&` • ${validacaoBackup.paroquia} • ${validacaoBackup.totalRegistros} registros • Gerado em ${new Date(validacaoBackup.geradoEm).toLocaleString("pt-BR")}`}</p></div></div></div>}{backupSelecionado&&!simulacaoRestauracao&&<button type="button" onClick={()=>void simularRestauracao()} disabled={restaurando} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 font-semibold text-white disabled:opacity-60"><RotateCcw size={18}/>{restaurando?"Comparando...":"Simular restauração"}</button>}{simulacaoRestauracao&&<div className="mt-4 rounded-xl border bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="font-bold">Simulação para {simulacaoRestauracao.paroquia.nome}</h4><p className="text-sm text-slate-600">Estimativa inicial: {simulacaoRestauracao.linhas.reduce((s,l)=>s+l.ausentesEstimados,0)} registro(s) possivelmente ausente(s). A restauração confirma cada ID e nunca substitui existentes.</p></div><button type="button" onClick={()=>void restaurarAusentes()} disabled={restaurando} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-amber-600 px-4 font-semibold text-white disabled:opacity-60"><RotateCcw size={18}/>{restaurando?"Restaurando...":"Restaurar somente ausentes"}</button></div><div className="mt-4 max-h-64 overflow-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-2">Coleção</th><th className="p-2 text-right">Backup</th><th className="p-2 text-right">Atual</th><th className="p-2 text-right">Diferença estimada</th></tr></thead><tbody>{simulacaoRestauracao.linhas.filter(l=>l.backup||l.atual).map(l=><tr key={l.tabela} className="border-b last:border-0"><td className="p-2">{l.tabela}</td><td className="p-2 text-right">{l.backup}</td><td className="p-2 text-right">{l.atual}</td><td className="p-2 text-right font-bold">{l.ausentesEstimados}</td></tr>)}</tbody></table></div><p className="mt-3 text-xs text-slate-500">Observação: documentos físicos do Storage não fazem parte do JSON. O sistema restaura somente os registros e metadados disponíveis no arquivo.</p></div>}</div>
        <div className="mt-5 border-t pt-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><h3 className="flex items-center gap-2 font-bold text-slate-900"><Cloud size={19} className="text-blue-600"/>Cofre de backups na nuvem</h3><p className="mt-1 text-sm text-slate-600">Backup automático todos os dias à meia-noite. Os arquivos são privados, separados por paróquia, e os 30 mais recentes são conservados.</p></div>
            <div className="flex flex-wrap gap-2"><button type="button" onClick={()=>void carregarBackupsNuvem()} disabled={carregandoNuvem} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 font-semibold text-slate-700 disabled:opacity-60"><RotateCcw size={17}/>{carregandoNuvem?"Aguarde...":"Ver backups"}</button><button type="button" onClick={()=>void salvarBackupNuvem()} disabled={carregandoNuvem} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 font-semibold text-white disabled:opacity-60"><Cloud size={18}/>Criar backup agora</button></div>
          </div>
          {backupsNuvem.length>0&&<div className="mt-4 overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-3">Arquivo</th><th className="p-3">Data</th><th className="p-3 text-right">Tamanho</th><th className="p-3 text-right">Ações</th></tr></thead><tbody>{backupsNuvem.map(backup=><tr key={backup.nome} className="border-t"><td className="max-w-xs truncate p-3 font-medium" title={backup.nome}>{backup.nome}</td><td className="whitespace-nowrap p-3">{new Date(backup.criadoEm).toLocaleString("pt-BR")}</td><td className="whitespace-nowrap p-3 text-right">{(backup.tamanhoBytes/1024/1024).toLocaleString("pt-BR",{maximumFractionDigits:2})} MB</td><td className="p-3"><div className="flex justify-end gap-2"><button type="button" title="Baixar" aria-label={`Baixar ${backup.nome}`} onClick={()=>void baixarBackupNuvem(backup.nome)} className="rounded-lg border p-2 text-blue-700"><Download size={17}/></button><button type="button" title="Excluir" aria-label={`Excluir ${backup.nome}`} onClick={()=>void excluirBackupNuvem(backup.nome)} className="rounded-lg border border-red-200 p-2 text-red-700"><Trash2 size={17}/></button></div></td></tr>)}</tbody></table></div>}
          {!carregandoNuvem&&backupsNuvem.length===0&&<p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Clique em “Ver backups” para consultar o cofre ou em “Criar backup agora” para fazer uma cópia imediata.</p>}
        </div>
      </FormSection>
    </div>
  );
}
