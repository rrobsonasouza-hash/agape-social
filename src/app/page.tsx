import Link from "next/link";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="max-w-lg space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {siteConfig.nome}
        </h1>
        <p className="text-muted-foreground">{siteConfig.descricao}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/login">Entrar</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Painel</Link>
        </Button>
      </div>
    </main>
  );
}
