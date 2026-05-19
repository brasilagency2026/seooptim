# Blog Portail SEO — Next.js 15 + Convex + Clerk

Application de publication optimisée SEO sémantique Google et indexation LLM.

## Stack Technique

- **Framework** : Next.js 15 (App Router, RSC)
- **Base de données** : Convex (temps-réel, serverless)
- **Auth Admin** : Clerk
- **Stockage Media** : UploadThing (CDN)
- **Styles** : Tailwind CSS + @tailwindcss/typography
- **Validation formulaire** : React Hook Form + Zod

## Installation

```bash
npm install
```

## Configuration (.env.local)

Remplir toutes les variables dans `.env.local` :

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Dashboard Convex |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Dashboard Clerk |
| `CLERK_SECRET_KEY` | Dashboard Clerk |
| `UPLOADTHING_SECRET` | Dashboard UploadThing |
| `UPLOADTHING_APP_ID` | Dashboard UploadThing |
| `GOOGLE_CLIENT_EMAIL` | Google Cloud Console (Service Account) |
| `GOOGLE_PRIVATE_KEY` | Google Cloud Console (Service Account) |
| `NEXT_PUBLIC_SITE_URL` | Votre domaine de production |

## Démarrage

```bash
# Terminal 1 — Convex dev server
npx convex dev

# Terminal 2 — Next.js dev server
npm run dev
```

## Arborescence des fichiers clés

```
app/
  page.tsx                    → Accueil publique
  blog/
    page.tsx                  → Liste des articles
    [slug]/
      page.tsx                → Article (SSR + métadonnées)
      JsonLd.tsx              → JSON-LD Schema.org
  admin/
    page.tsx                  → Dashboard admin
    new/page.tsx              → Création d'article
  api/
    uploadthing/              → Router UploadThing
    index-google/route.ts     → Google Indexing API
  sitemap.ts                  → Sitemap dynamique
  robots.ts                   → robots.txt + whitelist bots IA
  llms.txt/route.ts           → Indexation LLMs

convex/
  schema.ts                   → Schéma de données
  posts.ts                    → Queries & Mutations

components/
  admin/
    PostForm.tsx              → Formulaire RHF + UploadThing
    PostActionsClient.tsx     → Actions CRUD admin
  providers/
    ConvexClientProvider.tsx  → Provider Convex client
```

## SEO Features

- ✅ SSR complet (React Server Components)
- ✅ JSON-LD Article + Question/Answer (Featured Snippets)
- ✅ Sitemap dynamique auto-généré
- ✅ robots.txt avec whitelist GPTBot, PerplexityBot, ClaudeBot
- ✅ /llms.txt pour indexation structurée LLMs
- ✅ Google Indexing API (push instantané à la publication)
- ✅ Images WebP/AVIF automatique (Core Web Vitals)
- ✅ Métadonnées OpenGraph + Twitter Card
