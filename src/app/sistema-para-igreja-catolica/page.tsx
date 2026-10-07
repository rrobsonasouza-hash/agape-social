import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpenCheck,
  CheckCircle2,
  Church,
  FileText,
  HandHeart,
  HeartHandshake,
  Landmark,
  MessageCircle,
  Phone,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { siteConfig } from "@/config/site";

const pageUrl = `${siteConfig.url}/sistema-para-igreja-catolica`;

export const metadata: Metadata = {
  title: { absolute: "Sistema para Igreja Católica e Gestão Paroquial | Ágape Social" },
  description:
    "Conheça o Ágape Social, sistema de gestão para igrejas e paróquias católicas com Pastoral Social, Secretaria, Tesouraria, dízimos, ECC e atendimento às famílias.",
  alternates: { canonical: pageUrl },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: pageUrl,
    siteName: siteConfig.nome,
    title: "Sistema para Igreja Católica e Gestão Paroquial | Ágape Social",
    description: "Pastoral Social, Secretaria Paroquial, Tesouraria e ECC integrados para fortalecer a missão da Igreja Católica.",
  },
  twitter: {
    card: "summary",
    title: "Ágape Social — Sistema para a Igreja Católica",
    description: "Gestão paroquial integrada, segura e centrada no cuidado com as pessoas.",
  },
};

const recursos = [
  { icon: HandHeart, title: "Pastoral Social", text: "Cadastre e acompanhe famílias, visitas, necessidades, benefícios, cestas, doadores e parceiros com histórico preservado." },
  { icon: FileText, title: "Secretaria Paroquial", text: "Organize atendimentos, documentos, sacramentos, certidões, intenções, agenda e protocolos em um único fluxo." },
  { icon: Landmark, title: "Tesouraria e dízimos", text: "Acompanhe entradas, despesas, contas, categorias, dízimos e comprovantes com visão consolidada da paróquia." },
  { icon: HeartHandshake, title: "ECC", text: "Planeje edições, casais, equipes, visitas, credenciamento, compras, doações, documentos e o pós-encontro." },
  { icon: UsersRound, title: "Voluntários e comunidade", text: "Mantenha cadastros, frentes de serviço, disponibilidade e vínculos para apoiar a missão pastoral." },
  { icon: BookOpenCheck, title: "Manual vivo", text: "Oriente a equipe com passo a passo ligado às telas reais e atualizado junto com cada evolução do sistema." },
];

const perguntas = [
  { pergunta: "O que é o Ágape Social?", resposta: "O Ágape Social é um sistema de gestão criado para a realidade da Igreja Católica. Ele integra Pastoral Social, Secretaria Paroquial, Tesouraria, ECC e administração em uma única plataforma." },
  { pergunta: "O sistema funciona para paróquias católicas?", resposta: "Sim. Os fluxos foram organizados para paróquias católicas, com rotinas de atendimento, sacramentos, dízimos, intenções, pastorais, movimentos e cuidado social." },
  { pergunta: "É possível usar no celular?", resposta: "Sim. O Ágape possui telas responsivas para celular, tablet e computador, com operação simplificada para as atividades realizadas no dia a dia." },
  { pergunta: "Os dados de cada paróquia ficam separados?", resposta: "Sim. Cada paróquia possui seu próprio ambiente, e os acessos são definidos por perfil e responsabilidade. A plataforma também mantém trilha de auditoria das operações." },
  { pergunta: "Como solicitar uma demonstração?", resposta: `Entre em contato pelo WhatsApp ou telefone ${siteConfig.telefone}. A demonstração apresenta os módulos e permite avaliar a aplicação na realidade da paróquia.` },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: siteConfig.nome,
      url: pageUrl,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "pt-BR",
      description: "Sistema de gestão para igrejas e paróquias católicas.",
      provider: { "@type": "Organization", name: siteConfig.nome, telephone: siteConfig.telefoneLink },
      featureList: recursos.map((recurso) => recurso.title),
    },
    {
      "@type": "FAQPage",
      mainEntity: perguntas.map((item) => ({
        "@type": "Question",
        name: item.pergunta,
        acceptedAnswer: { "@type": "Answer", text: item.resposta },
      })),
    },
  ],
};

export default function SistemaParaIgrejaCatolicaPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 text-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <header className="absolute inset-x-0 top-0 z-10 border-b border-white/15 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-6 py-5">
          <Link href="/" className="flex items-center gap-3" aria-label="Voltar ao início do Ágape Social">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white shadow-lg"><Image src="/agape-icon.svg" alt="Símbolo do Ágape Social" width={32} height={32}/></span>
            <span><strong className="block text-lg">Ágape Social</strong><small className="text-blue-100">Tecnologia a serviço da Caridade</small></span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-blue-100 md:flex"><a href="#recursos">Recursos</a><a href="#igreja-catolica">Igreja Católica</a><a href="#perguntas">Dúvidas</a></nav>
          <a href={siteConfig.whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-blue-700"><MessageCircle size={17}/>Falar conosco</a>
        </div>
      </header>

      <section className="bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600 px-6 pb-24 pt-40 text-white sm:pb-28 sm:pt-44">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold text-blue-50"><Church size={16}/>Feito para a missão da Igreja Católica</div>
            <h1 className="mt-7 max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">Sistema para Igreja Católica com gestão paroquial integrada</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">O Ágape conecta Pastoral Social, Secretaria Paroquial, Tesouraria e ECC para que a paróquia cuide das pessoas, organize sua administração e preserve a continuidade da missão.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><a href={siteConfig.whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-white px-6 font-bold text-blue-700 shadow-xl"><MessageCircle size={19}/>Solicitar demonstração</a><a href={`tel:${siteConfig.telefoneLink}`} className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-white/35 px-6 font-bold text-white"><Phone size={18}/>{siteConfig.telefone}</a></div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-blue-100"><span className="inline-flex items-center gap-2"><CheckCircle2 size={17}/>Dados separados por paróquia</span><span className="inline-flex items-center gap-2"><CheckCircle2 size={17}/>Acesso por função</span><span className="inline-flex items-center gap-2"><CheckCircle2 size={17}/>Celular e computador</span></div>
          </div>
          <section className="rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur sm:p-8">
            <p className="text-xs font-black tracking-[.16em] text-blue-200">UMA PARÓQUIA, UM AMBIENTE</p>
            <h2 className="mt-3 text-3xl font-black">Da acolhida à prestação de contas.</h2>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">{["Famílias e visitas", "Cestas e doações", "Sacramentos e certidões", "Dízimos e financeiro", "ECC e movimentos", "Agenda e documentos"].map((item) => <div key={item} className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 p-4 text-sm font-semibold"><CheckCircle2 className="shrink-0 text-emerald-300" size={18}/>{item}</div>)}</div>
          </section>
        </div>
      </section>

      <section id="igreja-catolica" className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
        <div><p className="text-xs font-black tracking-[.16em] text-blue-700">GESTÃO A SERVIÇO DA EVANGELIZAÇÃO</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Tecnologia com a linguagem e as rotinas da Igreja Católica</h2><p className="mt-5 text-lg leading-8 text-slate-600">O Ágape não trata a paróquia como uma empresa genérica. O sistema reconhece a relação entre atendimento paroquial, sacramentos, dízimos, pastorais, movimentos, voluntariado e cuidado com as famílias.</p></div>
        <div className="grid gap-4 sm:grid-cols-2"><article className="rounded-2xl border bg-white p-6 shadow-sm"><Church className="text-blue-600"/><h3 className="mt-4 text-lg font-bold">Identidade católica</h3><p className="mt-2 text-sm leading-6 text-slate-600">Termos, módulos e fluxos alinhados ao cotidiano de paróquias e comunidades católicas.</p></article><article className="rounded-2xl border bg-white p-6 shadow-sm"><ShieldCheck className="text-blue-600"/><h3 className="mt-4 text-lg font-bold">Governança e segurança</h3><p className="mt-2 text-sm leading-6 text-slate-600">Permissões por perfil, isolamento por paróquia, histórico e auditoria das operações.</p></article><article className="rounded-2xl border bg-white p-6 shadow-sm sm:col-span-2"><HeartHandshake className="text-blue-600"/><h3 className="mt-4 text-lg font-bold">Cuidado que gera continuidade</h3><p className="mt-2 text-sm leading-6 text-slate-600">A informação permanece organizada quando mudam os agentes, coordenadores e responsáveis pela administração.</p></article></div>
      </section>

      <section id="recursos" className="border-y bg-white py-20"><div className="mx-auto max-w-7xl px-6"><div className="max-w-3xl"><p className="text-xs font-black tracking-[.16em] text-blue-700">RECURSOS INTEGRADOS</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Tudo o que a comunidade precisa para servir melhor</h2><p className="mt-5 text-lg leading-8 text-slate-600">Cada módulo compartilha o mesmo contexto para diminuir retrabalho e oferecer uma visão completa da ação pastoral e administrativa.</p></div><div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{recursos.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6"><span className="grid h-12 w-12 place-items-center rounded-xl bg-blue-100 text-blue-700"><Icon size={23}/></span><h3 className="mt-5 text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p></article>)}</div></div></section>

      <section id="perguntas" className="mx-auto max-w-5xl px-6 py-20"><div className="text-center"><p className="text-xs font-black tracking-[.16em] text-blue-700">PERGUNTAS FREQUENTES</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Conheça melhor o Ágape</h2></div><div className="mt-10 grid gap-3">{perguntas.map((item) => <details key={item.pergunta} className="rounded-2xl border bg-white px-6 shadow-sm"><summary className="cursor-pointer py-5 text-lg font-bold">{item.pergunta}</summary><p className="max-w-4xl pb-6 leading-7 text-slate-600">{item.resposta}</p></details>)}</div></section>

      <section className="bg-blue-700 px-6 py-20 text-center text-white"><p className="text-xs font-black tracking-[.17em] text-blue-100">ÁGAPE SOCIAL</p><h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">Mais tempo para acolher, evangelizar e servir</h2><p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-blue-100">Converse conosco e veja como o Ágape pode organizar a rotina pastoral e administrativa da sua paróquia.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><a href={siteConfig.whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-white px-6 font-bold text-blue-700"><MessageCircle size={19}/>Solicitar demonstração</a><a href={`tel:${siteConfig.telefoneLink}`} className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-white/35 px-6 font-bold"><Phone size={18}/>{siteConfig.telefone}</a></div></section>

      <footer className="bg-slate-950 px-6 py-8 text-slate-300"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><Image src="/agape-icon.svg" alt="Ágape Social" width={36} height={36}/><div><strong className="block text-white">Ágape Social</strong><span className="text-xs">Sistema de gestão para a Igreja Católica</span></div></div><div className="flex flex-wrap gap-5 text-sm"><Link href="/">Página inicial</Link><a href={siteConfig.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a><a href={`tel:${siteConfig.telefoneLink}`}>{siteConfig.telefone}</a></div></div></footer>
    </main>
  );
}
