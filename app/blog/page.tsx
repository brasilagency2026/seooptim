import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import Image from "next/image";

export default async function BlogPage() {
  const posts = await fetchQuery(api.posts.getAllPublished);

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <header className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2 font-heading">
          Tous nos articles
        </h1>
        <p className="text-lg text-slate-600">
          Explorez notre base de connaissances sur le SEO sémantique et la publication de contenus optimisés.
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          Aucun article publié pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article
              key={post._id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
            >
              <div className="relative w-full aspect-video">
                <Image
                  src={post.image}
                  alt={post.imageAlt ?? post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                {post.category && (
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-500 mb-2 block">
                    {post.category}
                  </span>
                )}
                <h2 className="text-xl font-bold text-slate-900 mb-3 hover:text-brand-500 transition-colors line-clamp-2">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="text-slate-600 text-sm mb-4 flex-grow line-clamp-3">
                  {post.metaDescription ?? post.question}
                </p>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <time className="text-xs text-slate-400">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Brouillon"}
                  </time>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-sm font-semibold text-brand-500 hover:text-brand-600 inline-flex items-center gap-1 group"
                  >
                    Lire l'article
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
