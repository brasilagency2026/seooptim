import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Helper auth ─────────────────────────────────────────────────────────────
/** Lance une erreur 401 si l'appelant n'est pas authentifié via Clerk. */
async function requireAuth(ctx: { auth: { getUserIdentity(): Promise<any> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Não autorizado: você deve estar logado para realizar esta ação.");
  }
  
  if (identity.email !== "glwebagency2@gmail.com") {
    throw new Error("Acesso negado: apenas o administrador (glwebagency2@gmail.com) pode acessar esta área.");
  }

  return identity;
}

// ─── QUERIES ────────────────────────────────────────────────────────────────

/** Récupère un post par son slug (SSR page dynamique) */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

/** Liste tous les posts publiés (sitemap, llms.txt, page liste) */
export const getAllPublished = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .order("desc")
      .collect();
  },
});

/**
 * Pagination pour la page liste du blog.
 * FIX : le filtre category est maintenant appliqué via l'index composé
 * "by_published_and_category" défini dans schema.ts.
 */
export const listPublished = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.category) {
      // Filtre par catégorie via l'index composé (performant même à 30k+ docs)
      return await ctx.db
        .query("posts")
        .withIndex("by_published_and_category", (q) =>
          q.eq("isPublished", true).eq("category", args.category)
        )
        .order("desc")
        .paginate(args.paginationOpts);
    }

    // Tous les posts publiés sans filtre catégorie
    return await ctx.db
      .query("posts")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

/** Tous les posts (admin) — protégé par auth Clerk */
export const getAllAdmin = query({
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.db.query("posts").order("desc").collect();
  },
});

// ─── MUTATIONS ──────────────────────────────────────────────────────────────

/**
 * Crée un nouveau post en brouillon.
 * FIX SÉCURITÉ : vérification Clerk avant toute écriture.
 * FIX SEO : isPublished reste false — l'indexation Google est déclenchée
 * UNIQUEMENT à la publication via togglePublish, jamais à la création.
 */
export const createPost = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    question: v.string(),
    content: v.string(),
    image: v.string(),
    imageAlt: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    authorName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    // Vérifie l'unicité du slug
    const existing = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error(`Un post avec le slug "${args.slug}" existe déjà.`);
    }

    const id = await ctx.db.insert("posts", {
      ...args,
      isPublished: false, // Brouillon — Google Indexing déclenché à la publication
      publishedAt: undefined,
      updatedAt: Date.now(),
    });

    return id;
  },
});

/**
 * Publie ou dépublie un post.
 * FIX SÉCURITÉ : vérification Clerk.
 * C'est l'unique endroit où l'on signale à Google Indexing API qu'une URL existe.
 */
export const togglePublish = mutation({
  args: { id: v.id("posts"), publish: v.boolean() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    await ctx.db.patch(args.id, {
      isPublished: args.publish,
      publishedAt: args.publish ? Date.now() : undefined,
      updatedAt: Date.now(),
    });
  },
});

/** Met à jour un post existant — protégé par auth Clerk. */
export const updatePost = mutation({
  args: {
    id: v.id("posts"),
    title: v.optional(v.string()),
    question: v.optional(v.string()),
    content: v.optional(v.string()),
    image: v.optional(v.string()),
    imageAlt: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

/** Supprime un post — protégé par auth Clerk. */
export const deletePost = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    await ctx.db.delete(args.id);
  },
});
