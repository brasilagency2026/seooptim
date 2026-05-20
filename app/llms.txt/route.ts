import { NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://votre-portail.com";

/**
 * SEO FIX : nettoie le HTML brut avant extraction du résumé.
 * Les agents IA (ChatGPT, Perplexity, Claude) attendent du texte brut lisible,
 * pas des balises HTML tronquées comme `<strong>répon…`.
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export async function GET() {
  const posts = await fetchQuery(api.posts.getAllPublished);

  let markdown = `# BDSM BRASIL — Blog & Portal de Conteúdo Fetichista\n\n`;
  markdown += `> Este arquivo lista os recursos estruturados deste site, otimizados para indexação por LLMs (ChatGPT, Perplexity, Claude).\n\n`;
  markdown += `- URL principal : ${SITE_URL}\n`;
  markdown += `- Sitemap : ${SITE_URL}/sitemap.xml\n\n`;
  markdown += `## Artigos publicados (${posts.length} recursos)\n\n`;

  for (const post of posts) {
    markdown += `### ${post.title}\n`;
    markdown += `- URL : ${SITE_URL}/blog/${post.slug}\n`;
    markdown += `- Questão central : ${post.question}\n`;
    if (post.category) markdown += `- Categoria : ${post.category}\n`;
    if (post.tags?.length)
      markdown += `- Tags : ${post.tags.join(", ")}\n`;
    // FIX : on passe le contenu HTML dans stripHtml avant de le tronquer
    const summary =
      post.metaDescription ?? stripHtml(post.content).substring(0, 150) + "…";
    markdown += `- Resumo : ${summary}\n\n`;
  }

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
