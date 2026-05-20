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
    .min(10, "O título deve conter pelo menos 10 caracteres.")
    .max(120, "Título muito longo (máx. 120 caracteres)."),
  slug: z
    .string()
    .min(3)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug inválido: use apenas letras minúsculas, números e hifens."
    ),
  question: z
    .string()
    .min(10, "A pergunta deve ser explícita (mín. 10 caracteres).")
    .max(200),
  metaDescription: z.string().max(160).optional(),
  content: z.string().min(100, "O conteúdo deve conter pelo menos 100 caracteres."),
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
      if (!imageFile) throw new Error("Por favor, selecione uma imagem de capa.");
      const uploaded = await startUpload([imageFile]);
      if (!uploaded?.[0]?.url) throw new Error("Falha no envio da imagem.");
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

      // 3. Redirection vers le dashboard — succès
      router.push("/admin");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro inesperado.");
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

      {/* Avertissement non-bloquant */}
      {indexingWarning && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-4 py-3 text-sm">
          ⚠️ {indexingWarning}
        </div>
      )}

      {/* Titre */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          {...register("title")}
          onBlur={handleTitleBlur}
          placeholder="Ex: Como praticar BDSM com segurança e consentimento"
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        {errors.title && (
          <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Slug da URL <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-brand-500">
          <span className="px-3 py-2.5 bg-slate-50 text-slate-400 text-sm border-r border-slate-200">
            /blog/
          </span>
          <input
            {...register("slug")}
            placeholder="guia-seguranca-bdsm"
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
          Pergunta Central <span className="text-red-500">*</span>
          <span className="ml-2 text-xs font-normal text-slate-400">
            (FAQ Schema + Featured Snippets)
          </span>
        </label>
        <input
          {...register("question")}
          placeholder="Ex: Quais são as principais regras de segurança no BDSM?"
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        {errors.question && (
          <p className="text-red-500 text-xs mt-1">{errors.question.message}</p>
        )}
      </div>

      {/* Meta description */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Meta Description{" "}
          <span className="text-xs font-normal text-slate-400">(máx 160 caract.)</span>
        </label>
        <textarea
          {...register("metaDescription")}
          rows={2}
          placeholder="Descrição concisa para os resultados de busca (Google)…"
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
          Imagem de Capa (Hero) <span className="text-red-500">*</span>
          <span className="ml-2 text-xs font-normal text-slate-400">
            (WebP/AVIF automático — critério LCP)
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
            alt="Pré-visualização"
            className="mt-3 w-full max-h-48 object-cover rounded-lg border border-slate-200"
          />
        )}
        <input
          {...register("imageAlt")}
          placeholder="Texto alternativo (alt) da imagem"
          className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Contenu */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Conteúdo (HTML) <span className="text-red-500">*</span>
          <span className="ml-2 text-xs font-normal text-slate-400">
            Pirâmide invertida: resposta direta no primeiro parágrafo
          </span>
        </label>
        <textarea
          {...register("content")}
          rows={12}
          placeholder="<p>A resposta direta no início…</p><h2>Desenvolvimento…</h2>"
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
            Categoria
          </label>
          <input
            {...register("category")}
            placeholder="Ex: Shibari, Fetiche, Guias"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Tags{" "}
            <span className="text-xs font-normal text-slate-400">
              (separadas por vírgula)
            </span>
          </label>
          <input
            {...register("tags")}
            placeholder="bdsm, fetiche, seguranca"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Auteur */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          Autor
        </label>
        <input
          {...register("authorName")}
          placeholder="Especialista BDSM BRASIL"
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Note info sur le workflow de publication */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700">
        ℹ️ O artigo será criado como <strong>rascunho</strong>. A indexação no Google será
        acionada automaticamente ao <strong>publicar</strong> o artigo a partir do painel de administração.
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || isUploading}
        className="w-full py-3 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting || isUploading
          ? "Criando artigo..."
          : "Criar Artigo (Rascunho)"}
      </button>
    </form>
  );
}
