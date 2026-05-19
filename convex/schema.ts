import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  posts: defineTable({
    title: v.string(),
    slug: v.string(),
    question: v.string(),    // La question centrale SEO (format FAQ)
    content: v.string(),     // Corps de l'article (HTML ou Markdown)
    image: v.string(),       // URL CDN (UploadThing ou Cloudinary)
    imageAlt: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    isPublished: v.boolean(),
    publishedAt: v.optional(v.number()), // timestamp Unix
    updatedAt: v.optional(v.number()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    authorName: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_published", ["isPublished"])
    .index("by_category", ["category"])
    // Index composé pour listPublished filtré par catégorie (fix bug filtre ignoré)
    .index("by_published_and_category", ["isPublished", "category"]),
});
