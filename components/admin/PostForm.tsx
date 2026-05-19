"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUploadThing } from "@/lib/uploadthing";
import { useRouter } from "next/navigation";
import { useState } from "react";

// ── Schéma de validation ────────────────────────────────────────────────
const postSchema = z.object({
  title: z
    .string()
    .min(10, "Le titre doit comporter au moins 10 caractères.")
    .max(120, "Titre trop long (120 car. max)."),
  slug: z
    .string()
    .min(3)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug invalide : minuscules, chiffres et tirets uniquement."
    ),
  question: z
    .string()
    .min(10, "La question doit être explicite (10 car. min).")
    .max(200),
  metaDescription: z.string().max(160).optional(),
  content: z.string().min(100, "Le contenu doit faire au moins 100 caractères."),
  category: z.string().optional(),
  tags: z.string().optional(),
  authorName: z.string().optional(),
  imageAlt: z.string().optional(),
});

type PostFormData = z.infer<typeof postSchema>;

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function PostForm() {
  const router = useRouter();
  const createPost = useMutation(api.posts.createPost);
  const { startUpload, isUploading } = useUploadThing("postImage");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Avertissement non-bloquant si Google Indexing échoue (l'article est quand même créé)
  const [indexingWarning, setIndexingWarning] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = useForm<PostFormData>({ resolver: zodResolver(postSchema) });

  const titleValue = watch("title");
  const handleTitleBlur = () => {
    if (titleValue) setValue("slug", slugify(titleValue));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // PERF FIX : libère l'ancienne URL objet pour éviter la fuite mémoire
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: PostFormData) => {
    setIsSubmitting(true);
    setError(null);
    setIndexingWarning(null);

    try {
      // 1. Upload de l'image vers UploadThing
      if (!imageFile) throw new Error("Veuillez sélectionner une image.");
      const uploaded = await startUpload([imageFile]);
      if (!uploaded?.[0]?.url) throw new Error("L'upload de l'image a échoué.");
      const imageUrl = uploaded[0].url;

      // 2. Créer le post dans Convex (en brouillon — isPublished: false)
      await createPost({
        title: data.title,
        slug: data.slug,
        question: data.question,
        content: data.content,
        image: imageUrl,
        imageAlt: data.imageAlt,
        metaDescription: data.metaDescription,
        category: data.category,
        tags: data.tags
          ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        authorName: data.authorName,
      });

      /**
       * SEO FIX : on ne déclenche PAS l'indexation Google ici.
       * Le post vient d'être créé en brouillon (isPublished: false).
       * Si Googlebot tentait de crawler /blog/[slug], il recevrait un 404,
       * ce qui nuit au crawl budget et au score SEO du domaine.
       *
       * L'indexation Google est déclenchée UNIQUEMENT depuis PostActionsClient
       * au moment où l'admin clique sur "Publier" (togglePublish → isPublished: true).
       */

      // 3. Redirection vers le dashboard — succès
      router.push("/admin");
      router.refresh();
    } catch (err: unknown) {
      /**
       * BUG FIX : on distingue les erreurs critiques (upload, Convex) des erreurs
       * non-bloquantes (Google Indexing). Seules les erreurs critiques bloquent le flux.
       * Si une erreur survient ici, le post n'a pas encore été inséré (l'upload ou
       * Convex a échoué avant), donc l'utilisateur peut réessayer sans conflit de slug.
       */
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Erreur critique bloquante */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Avertissement non-bloquant (indexation Google échouée après création réussie) */}
      {indexingWarning && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-4 py-3 text-sm">
          ⚠️ {indexingWarning}
        </div>
      )}

      {/* Titre */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Titre <span className="text-red-500">*</span>
        </label>
        <input
          {...register("title")}
          onBlur={handleTitleBlur}
          placeholder="Ex: Comment optimiser son référencement SEO en 2025 ?"
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        {errors.title && (
          <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Slug URL <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-brand-500">
          <span className="px-3 py-2.5 bg-slate-50 text-slate-400 text-sm border-r border-slate-200">
            /blog/
          </span>
          <input
            {...register("slug")}
            placeholder="mon-article-seo"
            className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
          />
        </div>
        {errors.slug && (
          <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>
        )}
      </div>

      {/* Question centrale (SEO FAQ) */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Question centrale <span className="text-red-500">*</span>
          <span className="ml-2 text-xs font-normal text-slate-400">
            (FAQ Schema + Featured Snippets)
          </span>
        </label>
        <input
          {...register("question")}
          placeholder="Ex: Quels sont les meilleurs outils SEO gratuits ?"
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        {errors.question && (
          <p className="text-red-500 text-xs mt-1">{errors.question.message}</p>
        )}
      </div>

      {/* Meta description */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Meta description{" "}
          <span className="text-xs font-normal text-slate-400">(max 160 car.)</span>
        </label>
        <textarea
          {...register("metaDescription")}
          rows={2}
          placeholder="Description concise pour les SERPs…"
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
        {errors.metaDescription && (
          <p className="text-red-500 text-xs mt-1">
            {errors.metaDescription.message}
          </p>
        )}
      </div>

      {/* Image */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Image hero <span className="text-red-500">*</span>
          <span className="ml-2 text-xs font-normal text-slate-400">
            (WebP/AVIF automatique — critère LCP)
          </span>
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 file:font-semibold hover:file:bg-brand-100 cursor-pointer"
        />
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Aperçu"
            className="mt-3 w-full max-h-48 object-cover rounded-lg border border-slate-200"
          />
        )}
        <input
          {...register("imageAlt")}
          placeholder="Texte alternatif (alt) de l'image"
          className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Contenu */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Contenu (HTML) <span className="text-red-500">*</span>
          <span className="ml-2 text-xs font-normal text-slate-400">
            Pyramide inversée : réponse brute en premier paragraphe
          </span>
        </label>
        <textarea
          {...register("content")}
          rows={12}
          placeholder="<p>La réponse directe en premier…</p><h2>Développement…</h2>"
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
        />
        {errors.content && (
          <p className="text-red-500 text-xs mt-1">{errors.content.message}</p>
        )}
      </div>

      {/* Catégorie + Tags */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Catégorie
          </label>
          <input
            {...register("category")}
            placeholder="Ex: SEO, Marketing, Tech"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Tags{" "}
            <span className="text-xs font-normal text-slate-400">
              (séparés par des virgules)
            </span>
          </label>
          <input
            {...register("tags")}
            placeholder="seo, google, contenu"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Auteur */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Auteur
        </label>
        <input
          {...register("authorName")}
          placeholder="Expert Portail Paris"
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Note info sur le workflow de publication */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700">
        ℹ️ L'article sera créé en <strong>brouillon</strong>. L'indexation Google sera
        déclenchée automatiquement lors de la <strong>publication</strong> depuis le
        tableau de bord admin.
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || isUploading}
        className="w-full py-3 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting || isUploading
          ? "Création en cours…"
          : "Créer l'article (brouillon)"}
      </button>
    </form>
  );
}
