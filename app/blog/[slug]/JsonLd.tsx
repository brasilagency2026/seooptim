import { Doc } from "@/convex/_generated/dataModel";

type Post = Doc<"posts">;

/**
 * SEO FIX : supprime toutes les balises HTML avant extraction du substring.
 * Évite d'injecter du HTML cassé dans acceptedAnswer.text (JSON-LD) et llms.txt.
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function JsonLd({ post }: { post: Post }) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://votre-portail.com";

  const cleanContent = stripHtml(post.content);

  /**
   * SEO FIX : deux entités séparées dans un @graph plutôt qu'une Question imbriquée
   * dans un Article. Google traite mieux Article et FAQPage comme schémas distincts :
   * - Article → eligibilité Top Stories / Rich Results classiques
   * - FAQPage → éligibilité "People Also Ask" et Featured Snippets Q&A
   * La propriété mainEntityOfPage relie explicitement l'Article à son URL canonique.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${siteUrl}/blog/${post.slug}`,
        },
        headline: post.title,
        image: post.image,
        description:
          post.metaDescription ??
          cleanContent.substring(0, 150) + "…",
        datePublished: post.publishedAt
          ? new Date(post.publishedAt).toISOString()
          : undefined,
        dateModified: post.updatedAt
          ? new Date(post.updatedAt).toISOString()
          : undefined,
        author: {
          "@type": "Person",
          name: post.authorName ?? "Expert Portail Paris",
        },
        publisher: {
          "@type": "Organization",
          name: "Portail Paris",
          url: siteUrl,
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: post.question,
            acceptedAnswer: {
              "@type": "Answer",
              // FIX : texte brut sans HTML + substring propre
              text: cleanContent.substring(0, 300) + "…",
            },
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
