import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/sistema-para-igreja-catolica"],
      disallow: [
        "/administracao/", "/api/", "/auditoria", "/central/", "/convite",
        "/dashboard", "/definir-senha", "/doadores/", "/ecc/", "/estoque",
        "/familias/", "/login", "/manual", "/parceiros/", "/perfis-acesso",
        "/relatorios", "/rotas", "/secretaria/", "/tesouraria", "/usuarios/",
        "/visitas/", "/voluntarios/",
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
