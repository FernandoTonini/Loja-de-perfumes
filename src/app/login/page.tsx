"use client";

import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import toast from "react-hot-toast";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("E-mail ou senha incorretos.");
      } else {
        router.push("/conta");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/">
            <span className="font-serif text-3xl text-ink tracking-[0.2em]">MAISON</span>
            <span className="block text-[10px] tracking-[0.5em] uppercase text-gold-dark font-sans">Parfums</span>
          </Link>
        </div>

        <div className="bg-white border border-cream-200 p-8 shadow-sm">
          <h1 className="font-serif text-2xl text-ink mb-2">Entrar na sua conta</h1>
          <p className="text-ink-muted text-sm font-sans mb-8">
            Não tem conta?{" "}
            <Link href="/cadastro" className="text-gold-dark hover:text-gold transition-colors">
              Cadastre-se grátis
            </Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs tracking-wide text-ink-muted uppercase font-sans mb-2">E-mail</label>
              <input
                {...register("email")}
                type="email"
                placeholder="seu@email.com"
                className="w-full bg-cream-50 border border-cream-200 focus:border-gold/60 outline-none px-4 py-3 text-ink text-sm placeholder-ink/30 transition-colors"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs tracking-wide text-ink-muted uppercase font-sans mb-2">Senha</label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-cream-50 border border-cream-200 focus:border-gold/60 outline-none px-4 py-3 text-ink text-sm placeholder-ink/30 transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-gold-dark transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-4 flex items-center justify-center gap-2 text-sm tracking-wider uppercase disabled:opacity-50"
            >
              {loading ? <span className="animate-pulse">Entrando...</span> : (
                <>
                  <LogIn size={16} />
                  Entrar
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
