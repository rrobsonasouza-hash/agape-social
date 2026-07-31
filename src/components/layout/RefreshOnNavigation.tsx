"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Atualiza os dados da rota quando o usuário navega de volta para ela.
 * O primeiro carregamento é preservado para evitar uma requisição duplicada.
 */
export function RefreshOnNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) return;

    previousPathname.current = pathname;
    router.refresh();
  }, [pathname, router]);

  return null;
}
