"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { UserPlus } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const schema = z.object({
  name: z.string().min(3, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function CadastroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      await axios.post("/api/auth/register", { name: data.name, email: data.email, password: data.password });
      await signIn("credentials", { email: data.email, password: data.password, redirect: false });
      router.push("/conta");
    } catch (error: unknown) {
      const msg = axios.isAxiosError(error) ? error.response?.data?.error : "Erro ao criar conta";
      toast.error(msg || "Erro ao criar conta", {
        style: { background: "#1a1a1a", color: "#fff", border: "1px solid #2a2a2a" },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/">
            <span className="font-serif text-3xl text-white tracking-[0.2em]">MAISON</span>
            <span className="block text-[10px] tracking-[0.5em] uppercase text-gold font-sans">Parfums</span>
          </Link>
        </div>

        <div className="bg-dark-100 border border-dark-300 p-8">
          <h1 className="font-serif text-2xl text-white mb-2">Criar conta</h1>
          <p className="text-white/40 text-sm font-sans mb-8">
            Já tem conta?{" "}
            <Link href="/login" className="text-gold hover:text-gold-light transition-colors">
              Entrar agora
            </Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {[
              { name: "name" as const, label: "Nome Completo", placeholder: "Seu nome" },
              { name: "email" as const, label: "E-mail", placeholder: "seu@email.com", type: "email" },
              { name: "password" as const, label: "Senha", placeholder: "Mínimo 6 caracteres", type: "password" },
              { name: "confirmPassword" as const, label: "Confirmar Senha", placeholder: "Repita a senha", type: "password" },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-xs tracking-wide text-white/50 uppercase font-sans mb-2">{field.label}</label>
                <input
                  {...register(field.name)}
                  type={field.type || "text"}
                  placeholder={field.placeholder}
                  className="w-full bg-dark-200 border border-dark-300 focus:border-gold/50 outline-none px-4 py-3 text-white text-sm placeholder-white/20 transition-colors"
                />
                {errors[field.name] && <p className="text-red-400 text-xs mt-1">{errors[field.name]?.message}</p>}
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-4 flex items-center justify-center gap-2 text-sm tracking-wider uppercase disabled:opacity-50"
            >
              {loading ? <span className="animate-pulse">Criando conta...</span> : (
                <>
                  <UserPlus size={16} />
                  Criar Conta
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
