"use client";

import { Trash2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminProductActions({ productId }: { productId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    try {
      setLoading(true);
      await axios.delete(`/api/products/${productId}`);
      toast.success("Produto excluído!");
      router.refresh();
    } catch {
      toast.error("Erro ao excluir produto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-red-400/40 hover:text-red-400 transition-colors disabled:opacity-30"
    >
      <Trash2 size={16} />
    </button>
  );
}
