"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChartNoAxesCombined,
  CheckCircle2,
  FileCheck2,
  HeartHandshake,
  MapPinned,
  PackageCheck,
  Route,
  ShieldCheck,
  Sparkles,
  UsersRound,
  WalletCards,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

const differentials = [
  { icon: UsersRound, title: "Cadastro que vira acompanhamento", text: "Famílias, documentos, contatos, pessoa autorizada a retirar a cesta e histórico social no mesmo lugar." },
  { icon: PackageCheck, title: "Distribuição sem improvisos", text: "Campanhas, fila por data, baixas, remarcações, entregas em casa e saída do estoque rastreáveis." },
  { icon: MapPinned, title: "Território no mapa", text: "CEP, localização da família, áreas pastorais e rotas para planejar atendimentos com mais proximidade." },
  { icon: WalletCards, title: "Finanças integradas", text: "Dízimos, receitas, despesas, contas e fluxo financeiro para a administração enxergar o todo." },
  { icon: FileCheck2, title: "Histórico que permanece", text: "Visitas, documentos, solicitações e atendimentos preservados para que o cuidado não recomece do zero." },
  { icon: ShieldCheck, title: "Acesso responsável", text: "Dados isolados por paróquia, permissões por perfil e trilha de auditoria para uma operação segura." },
];

const churchImages = [
  { src: "/images/igrejas/igreja-1.png", alt: "Igreja católica com torre e vitrais" },
  { src: "/images/igrejas/igreja-2.png", alt: "Interior de uma igreja católica" },
  { src: "/images/igrejas/igreja-3.png", alt: "Fachada de igreja católica" },
  { src: "/images/igrejas/igreja-4.png", alt: "Santuário católico" },
  { src: "/images/igrejas/igreja-5.png", alt: "Catedral vista do alto em São Paulo" },
];

function ChurchCarousel() {
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % churchImages.length);
    }, 5500);

    return () => window.clearInterval(interval);
  }, []);

  const selectPrevious = () => setActiveImage((current) => (current - 1 + churchImages.length) % churchImages.length);
  const selectNext = () => setActiveImage((current) => (current + 1) % churchImages.length);

  return (
    <section aria-roledescription="carrossel" aria-label="Igrejas e comunidades atendidas" className="relative isolate min-h-[390px] overflow-hidden rounded-3xl bg-slate-950 shadow-2xl shadow-blue-950/15 sm:min-h-[460px]">
      {churchImages.map((image, index) => (
        <Image
          key={image.src}
          src={image.src}
          alt={image.alt}
          fill
          priority={index === 0}
          sizes="(max-width: 1024px) 100vw, 48vw"
          className={`object-cover transition-all duration-1000 ease-in-out ${index === activeImage ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-slate-950/15" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 text-white sm:p-8">
        <div className="max-w-sm">
          <p className="text-[10px] font-black tracking-[.18em] text-blue-200">COMUNIDADES QUE ACOLHEM</p>
          <p className="mt-2 text-lg font-bold leading-snug">Uma gestão que fortalece a missão de cada paróquia.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={selectPrevious} aria-label="Imagem anterior" className="grid h-10 w-10 place-items-center rounded-full border border-white/35 bg-slate-950/30 transition hover:bg-white hover:text-slate-950"><ChevronLeft size={19}/></button>
          <button type="button" onClick={selectNext} aria-label="Próxima imagem" className="grid h-10 w-10 place-items-center rounded-full border border-white/35 bg-slate-950/30 transition hover:bg-white hover:text-slate-950"><ChevronRight size={19}/></button>
        </div>
      </div>
      <div className="absolute left-6 top-6 flex gap-2 sm:left-8 sm:top-8">
        {churchImages.map((image, index) => (
          <button key={image.src} type="button" onClick={() => setActiveImage(index)} aria-label={`Exibir imagem ${index + 1}`} aria-current={index === activeImage} className={`h-1.5 rounded-full transition-all ${index === activeImage ? "w-8 bg-white" : "w-3 bg-white/55 hover:bg-white/80"}`} />
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 text-slate-950">
      <section className="mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.04fr_.96fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold text-blue-700 shadow-sm"><HeartHandshake size={16}/>Tecnologia a serviço da Caridade</div>
          <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">Gestão social com <span className="text-blue-600">clareza, cuidado e continuidade.</span></h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{siteConfig.descricao} O Ágape organiza a operação social, a secretaria e a administração financeira para que a missão da paróquia ganhe escala sem perder o cuidado humano.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button asChild className="min-h-12 rounded-xl px-6 text-base"><Link href="/login">Entrar no Ágape</Link></Button><Button variant="outline" asChild className="min-h-12 rounded-xl px-6 text-base"><Link href="#diferenciais">Conhecer diferenciais</Link></Button></div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-slate-600"><span className="inline-flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-600"/>Dados por paróquia</span><span className="inline-flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-600"/>Acesso por perfil</span><span className="inline-flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-600"/>Histórico preservado</span></div>
        </div>
        <div className="relative"><div className="absolute -inset-8 rounded-[3rem] bg-blue-200/45 blur-3xl"/>
          <section className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-blue-950/10 sm:p-8">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black tracking-[.15em] text-blue-600">PAINEL DE CUIDADO</p><h2 className="mt-2 text-3xl font-bold tracking-tight">A paróquia inteira em sintonia.</h2><p className="mt-3 leading-7 text-slate-600">Da família cadastrada à prestação de contas, cada etapa conversa com a próxima.</p></div><span className="grid h-13 w-13 place-items-center rounded-2xl bg-blue-100 text-blue-700"><ChartNoAxesCombined size={27}/></span></div>
            <div className="mt-7 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-blue-50 p-4"><span className="text-[10px] font-black tracking-[.12em] text-blue-600">FAMÍLIAS</span><strong className="mt-2 block text-2xl">38</strong><small className="text-slate-500">acompanhadas</small></div><div className="rounded-2xl bg-emerald-50 p-4"><span className="text-[10px] font-black tracking-[.12em] text-emerald-700">CESTAS</span><strong className="mt-2 block text-2xl">31</strong><small className="text-slate-500">entregues no mês</small></div><div className="rounded-2xl bg-amber-50 p-4"><span className="text-[10px] font-black tracking-[.12em] text-amber-700">VISITAS</span><strong className="mt-2 block text-2xl">14</strong><small className="text-slate-500">registradas</small></div></div>
            <div className="mt-5 rounded-2xl border bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black tracking-[.12em] text-blue-600">PRÓXIMA AÇÃO</p><strong className="mt-1 block text-sm">Distribuição de cestas · sábado</strong><p className="mt-1 text-xs text-slate-500">27 famílias agendadas e estoque conferido.</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-blue-600 shadow-sm"><Route size={20}/></span></div></div>
          </section>
        </div>
      </section>

      <section className="border-y border-blue-100 bg-blue-50/60 py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[.82fr_1.18fr] lg:items-center">
          <div>
            <p className="text-xs font-black tracking-[.16em] text-blue-700">CADA PARÓQUIA, UMA HISTÓRIA</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Feito para servir comunidades que fazem a diferença.</h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">O Ágape acompanha o trabalho de quem acolhe, visita, organiza campanhas e transforma cuidado em presença concreta no território.</p>
            <div className="mt-7 flex items-center gap-3 text-sm font-semibold text-slate-700"><HeartHandshake className="text-blue-600" size={22}/><span>Uma plataforma para a caridade acontecer com organização.</span></div>
          </div>
          <ChurchCarousel />
        </div>
      </section>

      <section id="diferenciais" className="border-y bg-white py-20"><div className="mx-auto max-w-7xl px-6"><div className="max-w-3xl"><p className="text-xs font-black tracking-[.16em] text-blue-600">DIFERENCIAIS ÁGAPE</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Não é apenas cadastro. É uma operação social conectada.</h2><p className="mt-4 text-lg leading-8 text-slate-600">Cada recurso foi pensado para diminuir retrabalho, dar visibilidade à equipe e preservar a história de cada família atendida.</p></div><div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{differentials.map(({icon:Icon,title,text})=><article key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-lg"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-100 text-blue-700"><Icon size={22}/></span><h3 className="mt-5 text-lg font-bold tracking-tight">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}</div></div></section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-[1fr_.9fr] lg:items-center"><div><p className="text-xs font-black tracking-[.16em] text-blue-600">DIFERENCIAL EXCLUSIVO</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Manual vivo e ilustrado para a equipe trabalhar com segurança.</h2><p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">O Ágape explica cada rotina com telas em HTML, passo a passo, dicas e links diretos para a ação. E o guia evolui junto com cada melhoria do sistema.</p><div className="mt-7 flex flex-wrap gap-4"><Button asChild className="min-h-12 rounded-xl px-5"><Link href="/manual"><BookOpen size={18}/>Abrir Manual do sistema</Link></Button><span className="inline-flex items-center gap-2 self-center text-sm font-medium text-slate-600"><Sparkles size={17} className="text-blue-600"/>Atualizado junto com a plataforma</span></div></div><section className="rounded-3xl border bg-slate-950 p-6 text-white shadow-xl sm:p-8"><div className="flex items-center justify-between border-b border-white/15 pb-4"><div className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-blue-300"/><i className="h-2 w-2 rounded-full bg-emerald-300"/><span className="text-xs text-slate-300">Guia de distribuição</span></div><BookOpen className="text-blue-300" size={22}/></div><p className="mt-6 text-[10px] font-black tracking-[.15em] text-blue-300">PASSO A PASSO</p><div className="mt-4 grid gap-3">{["Selecione a campanha e a data", "Inclua as famílias elegíveis", "Registre retirada, ausência ou entrega", "Acompanhe o estoque atualizado"].map((item,index)=><div key={item} className="flex items-center gap-3 rounded-xl bg-white/8 p-3 text-sm text-slate-100"><span className="grid h-6 w-6 place-items-center rounded-full bg-blue-400/20 text-xs font-bold text-blue-200">{index+1}</span>{item}</div>)}</div><p className="mt-5 text-xs leading-5 text-slate-300">Uma orientação clara para cada pessoa da equipe, sem depender de treinamento informal ou anotações paralelas.</p></section></section>

      <section className="bg-blue-700 px-6 py-20 text-center text-white"><p className="text-xs font-black tracking-[.17em] text-blue-100">ÁGAPE SOCIAL</p><h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">Mais tempo para servir. Mais clareza para decidir.</h2><p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-blue-100">Centralize a rotina da paróquia e transforme dados do dia a dia em continuidade para toda a Pastoral Social.</p><Button asChild variant="secondary" className="mt-8 min-h-12 rounded-xl px-6 text-base text-blue-700"><Link href="/login">Conhecer o Ágape <ArrowRight size={18}/></Link></Button></section>
    </main>
  );
}
