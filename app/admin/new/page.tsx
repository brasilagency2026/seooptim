import Link from "next/link";
import PostForm from "@/components/admin/PostForm";

export default function NewPostPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-heading">
            Criar Novo Artigo
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Preencha os detalhes abaixo para criar um artigo otimizado para SEO semântico.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-all"
        >
          ← Voltar
        </Link>
      </header>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
        <PostForm />
      </div>
    </div>
  );
}
