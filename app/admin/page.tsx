"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";

export default function AdminDashboard() {
  const { isLoaded, isSignedIn } = useAuth();
  const posts = useQuery(api.posts.getAllAdmin);
  const togglePublish = useMutation(api.posts.togglePublish);
  const deletePost = useMutation(api.posts.deletePost);

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isLoaded) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-slate-500">
        Chargement de l'authentification...
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Espace Admin Sécurisé</h1>
          <p className="text-slate-600 mb-6">
            Veuillez vous connecter pour gérer le contenu et lancer les indexations Google.
          </p>
          <Link
            href="/sign-in"
            className="inline-block w-full py-3 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  const handleTogglePublish = async (id: any, currentStatus: boolean, slug: string) => {
    setLoadingId(id);
    setError(null);
    setSuccess(null);

    const nextStatus = !currentStatus;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://votre-portail.com";

    try {
      // 1. Mettre à jour dans Convex (sécurisé)
      await togglePublish({ id, publish: nextStatus });

      // 2. Si on publie, envoyer à Google Indexing
      if (nextStatus) {
        const res = await fetch("/api/index-google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: `${siteUrl}/blog/${slug}` }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "L'appel de l'API Google Indexing a échoué.");
        }
        setSuccess(`Article publié et soumis avec succès à Google Indexing.`);
      } else {
        setSuccess("Article repassé en brouillon.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue lors de l'opération.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: any) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) return;

    setLoadingId(id);
    setError(null);
    setSuccess(null);

    try {
      await deletePost({ id });
      setSuccess("Article supprimé définitivement.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de suppression.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-heading">
            Tableau de Bord Admin
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Gérez vos articles, publiez vos brouillons et poussez-les sur Google.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/new"
            className="px-4 py-2.5 bg-brand-500 text-white font-semibold text-sm rounded-lg hover:bg-brand-600 transition-colors shadow-sm"
          >
            Créer un article
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-4 py-3 text-sm mb-6">
          ✅ {success}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <th className="py-4 px-6">Titre / Question</th>
                <th className="py-4 px-6">Catégorie</th>
                <th className="py-4 px-6">Date de création</th>
                <th className="py-4 px-6">Statut</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {posts === undefined ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Chargement des articles...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Aucun article trouvé. Cliquez sur "Créer un article" pour commencer.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 max-w-sm truncate">{post.title}</div>
                      <div className="text-slate-500 text-xs mt-0.5 max-w-sm truncate">{post.question}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{post.category ?? "Non définie"}</td>
                    <td className="py-4 px-6 text-slate-500">
                      {new Date(post.updatedAt ?? Date.now()).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          post.isPublished
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {post.isPublished ? "Publié" : "Brouillon"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePublish(post._id, post.isPublished, post.slug)}
                        disabled={loadingId !== null}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                          post.isPublished
                            ? "border border-slate-200 text-slate-600 hover:bg-slate-100"
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        {post.isPublished ? "Dépublier" : "Publier & Indexer"}
                      </button>
                      <button
                        onClick={() => handleDelete(post._id)}
                        disabled={loadingId !== null}
                        className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
