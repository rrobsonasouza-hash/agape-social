"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Copy, Download, ExternalLink, Printer, QrCode } from "lucide-react";
import QRCode from "qrcode";
import toast from "react-hot-toast";
import { useEcc } from "../hooks/useEcc";

export function QrCheckinEccSection({ encontroId, encontroNome }: { encontroId: string; encontroNome: string }) {
  const { obterTokenCheckin } = useEcc();
  const [link, setLink] = useState("");
  const [imagem, setImagem] = useState("");
  useEffect(() => {
    let ativo = true;
    void obterTokenCheckin(encontroId).then(({ token }) => {
      if (!ativo) return;
      const url = `${window.location.origin}/ecc/checkin?encontro=${encodeURIComponent(encontroId)}&token=${encodeURIComponent(token)}`;
      setLink(url);
      return QRCode.toDataURL(url, { width: 720, margin: 3, errorCorrectionLevel: "H", color: { dark: "#0f172a", light: "#ffffff" } });
    }).then((dataUrl) => { if (ativo && dataUrl) setImagem(dataUrl); }).catch((error) => toast.error(error instanceof Error ? error.message : "Não foi possível gerar o QR Code."));
    return () => { ativo = false; };
  }, [encontroId, obterTokenCheckin]);

  async function copiar() {
    await navigator.clipboard.writeText(link); toast.success("Link de check-in copiado.");
  }
  function baixar() {
    const a = document.createElement("a"); a.href = imagem; a.download = `checkin-${encontroNome.toLocaleLowerCase("pt-BR").replace(/[^a-z0-9]+/gi, "-")}.png`; a.click();
  }
  function imprimir() {
    const janela = window.open("", "_blank", "width=720,height=760");
    if (!janela) return toast.error("Permita a abertura de janelas para imprimir.");
    janela.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Check-in ${encontroNome.replace(/[<>&]/g, "")}</title><style>body{font-family:Arial;text-align:center;padding:32px;color:#0f172a}img{width:420px;max-width:90%}h1{margin-bottom:4px}p{color:#475569}@media print{button{display:none}}</style></head><body><button onclick="window.print()">Imprimir</button><h1>Check-in do ECC</h1><p>${encontroNome.replace(/[<>&]/g, "")}</p><img src="${imagem}" alt="QR Code"><p>Escaneie, informe telefone ou e-mail e confirme sua chegada.</p></body></html>`);
    janela.document.close(); janela.focus();
  }

  return <section className="grid gap-5 lg:grid-cols-[1fr_1.15fr]">
    <article className="rounded-2xl border bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-700"><QrCode size={26} /></span><div><p className="text-xs font-black uppercase tracking-wider text-blue-700">Autoatendimento</p><h2 className="text-2xl font-black">QR Code da edição</h2></div></div><p className="mt-4 text-sm leading-6 text-slate-600">O casal escaneia, informa o telefone ou e-mail usado na inscrição, confere os nomes e confirma a própria chegada — sem precisar de login.</p><div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><strong>Fluxo protegido</strong><p className="mt-1">A lista de casais não fica exposta. O link é assinado, a confirmação expira e tentativas incorretas são limitadas.</p></div><div className="mt-5 grid gap-2"><button type="button" onClick={() => void copiar()} disabled={!link} className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-black text-blue-700"><Copy size={17} />Copiar link</button><a href={link || "#"} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-black text-slate-700"><ExternalLink size={17} />Abrir autoatendimento</a></div></article>
    <article className="grid place-items-center rounded-2xl border bg-white p-6 text-center shadow-sm">{imagem ? <><Image src={imagem} width={720} height={720} unoptimized alt={`QR Code de check-in do ${encontroNome}`} className="w-full max-w-80 rounded-xl" /><strong className="mt-3 text-lg">{encontroNome}</strong><p className="mt-1 text-xs text-slate-500">Escaneie e confirme sua chegada</p><div className="mt-4 flex flex-wrap justify-center gap-2"><button type="button" onClick={baixar} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white"><Download size={17} />Baixar PNG</button><button type="button" onClick={imprimir} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-black"><Printer size={17} />Imprimir</button></div></> : <p className="py-20 text-slate-500">Gerando QR Code seguro...</p>}</article>
  </section>;
}
