import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cache } from "react";
import JsonLd from "./JsonLd";

type Props = { params: Promise<{ slug: string }> };

/**
 * PERF FIX : React cache() mémoïse l'appel Convex pour toute la durée du rendu.
 * generateMetadata et BlogPostPage partagent ainsi le même résultat → 1 seule
 * requête DB au lieu de 2.
 */
const getCachedPost = cache(async (slug: string) => {
  return await fetchQuery(api.posts.getBySlug, { slug });
});

// ── Métadonnées dynamiques ────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getCachedPost(slug);

  // FIX SEO : on vérifie isPublished ici aussi — évite d'exposer les métadonnées
  // d'un brouillon alors que la page renverrait un 404.
  if (!post || !post.isPublished) return { title: "Artigo não encontrado" };

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://votre-portail.com";

  // Force absolute URL for OpenGraph crawler
  const imageUrl = post.image.startsWith("http")
    ? post.image
    : `${siteUrl}${post.image.startsWith("/") ? "" : "/"}${post.image}`;

  return {
    metadataBase: new URL(siteUrl),
    title: post.title,
    description:
      post.metaDescription ??
      `Descubra a resposta especializada para: ${post.question}`,
    openGraph: {
      title: post.title,
      description: post.metaDescription ?? `Resposta para: ${post.question}`,
      url: `${siteUrl}/blog/${post.slug}`,
      siteName: "BDSM BRASIL",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.imageAlt ?? post.title,
        },
      ],
      type: "article",
      publishedTime: post.publishedAt
        ? new Date(post.publishedAt).toISOString()
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.metaDescription ?? `Resposta para: ${post.question}`,
      images: [imageUrl],
    },
    alternates: {
      canonical: `${siteUrl}/blog/${post.slug}`,
    },
  };
}

// ── Page (React Server Component) ────────────────────────────────────────
export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  // Réutilise le résultat mémoïsé — aucune requête supplémentaire
  const post = await getCachedPost(slug);

  if (!post || !post.isPublished) notFound();

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd post={post} />

      {/* ── En-tête ── */}
      <header className="mb-8">
        {post.category && (
          <span className="inline-block text-sm font-semibold uppercase tracking-widest text-brand-500 mb-3">
            {post.category}
          </span>
        )}
        <h1 className="text-4xl font-heading font-extrabold tracking-tight leading-tight mb-5 text-slate-900">
          {post.title}
        </h1>

        {/* Pyramide inversée : réponse directe en premier (Perplexity + Featured Snippets) */}
        <div className="bg-blue-50 border-l-4 border-brand-500 p-4 rounded-r-lg mb-6">
          <p className="text-sm font-semibold text-brand-700 mb-1">
            Questão Central
          </p>
          <p className="text-blue-900 font-medium">{post.question}</p>
        </div>

        {post.publishedAt && (
          <time
            dateTime={new Date(post.publishedAt).toISOString()}
            className="text-sm text-slate-500"
          >
            Publicado em{" "}
            {new Date(post.publishedAt).toLocaleDateString("pt-BR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        )}
      </header>

      {/* ── Image hero (WebP/AVIF auto via Next.js Image) ── */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-8 shadow-sm">
        <Image
          src={post.image}
          alt={post.imageAlt ?? post.title}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 800px"
        />
      </div>

      {/* ── Corps de l'article ── */}
      <div
        className="prose prose-slate prose-lg max-w-none prose-headings:font-heading prose-a:text-brand-500 prose-a:no-underline hover:prose-a:underline"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* ── Tags ── */}
      {post.tags && post.tags.length > 0 && (
        <footer className="mt-10 pt-6 border-t border-slate-100">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        </footer>
      )}
    </article>
  );
}
