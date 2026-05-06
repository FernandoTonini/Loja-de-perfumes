import { prisma } from "@/lib/prisma";
import { formatPrice, parseImages } from "@/lib/utils";
import Link from "next/link";
import { Plus, Edit, Package } from "lucide-react";
import Image from "next/image";
import { AdminProductActions } from "@/components/admin/AdminProductActions";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-gold text-xs tracking-[0.3em] uppercase font-sans mb-2">Gerenciar</p>
          <h1 className="font-serif text-3xl text-white">Produtos</h1>
          <p className="text-white/40 text-sm font-sans mt-2">{products.length} produtos cadastrados</p>
        </div>
        <Link
          href="/admin/produtos/novo"
          className="btn-gold px-6 py-3 flex items-center gap-2 text-sm tracking-wide uppercase"
        >
          <Plus size={16} />
          Novo Produto
        </Link>
      </div>

      <div className="bg-dark-100 border border-dark-300">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-300">
                {["Produto", "Categoria", "Preço", "Dropshipping", "Estoque", "Destaque", "Ações"].map((h) => (
                  <th key={h} className="text-left px-5 py-4 text-white/40 text-[10px] uppercase tracking-[0.2em] font-sans font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-300">
              {products.map((product) => {
                const images = parseImages(product.images);
                return (
                  <tr key={product.id} className="hover:bg-dark-200/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-14 bg-dark-200 flex-shrink-0 overflow-hidden">
                          {images[0] ? (
                            <Image src={images[0]} alt={product.name} fill className="object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Package size={16} className="text-dark-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white text-sm font-sans font-medium">{product.name}</p>
                          <p className="text-white/30 text-xs font-sans">{product.brand} • {product.ml}ml</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-white/50 text-xs font-sans">{product.category.name}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-gold font-semibold text-sm">{formatPrice(product.price)}</span>
                    </td>
                    <td className="px-5 py-4">
                      {product.dropshippingId ? (
                        <span className="text-green-400 text-xs font-mono">{product.dropshippingId}</span>
                      ) : (
                        <span className="text-white/20 text-xs">Não configurado</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 ${product.inStock ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"}`}>
                        {product.inStock ? "Em estoque" : "Esgotado"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs ${product.featured ? "text-gold" : "text-white/30"}`}>
                        {product.featured ? "Sim" : "Não"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Link href={`/admin/produtos/${product.id}`} className="text-white/50 hover:text-gold transition-colors">
                          <Edit size={16} />
                        </Link>
                        <AdminProductActions productId={product.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {products.length === 0 && (
          <div className="p-16 text-center text-white/30 text-sm font-sans">
            Nenhum produto cadastrado
          </div>
        )}
      </div>
    </div>
  );
}
