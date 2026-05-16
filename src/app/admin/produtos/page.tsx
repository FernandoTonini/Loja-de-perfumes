import { prisma } from "@/lib/prisma";
import { formatPrice, parseImages } from "@/lib/utils";
import Link from "next/link";
import { Plus, Edit, Package } from "lucide-react";
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
          <p className="text-gold-dark text-xs tracking-[0.3em] uppercase font-sans mb-2">Gerenciar</p>
          <h1 className="font-serif text-3xl text-ink">Produtos</h1>
          <p className="text-ink-muted text-sm font-sans mt-2">{products.length} produtos cadastrados</p>
        </div>
        <Link
          href="/admin/produtos/novo"
          className="btn-gold px-6 py-3 flex items-center gap-2 text-sm tracking-wide uppercase"
        >
          <Plus size={16} />
          Novo Produto
        </Link>
      </div>

      <div className="bg-white border border-cream-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream-50">
              <tr className="border-b border-cream-200">
                {["Produto", "Categoria", "Preço", "Dropshipping", "Estoque", "Destaque", "Ações"].map((h) => (
                  <th key={h} className="text-left px-5 py-4 text-ink-muted text-[10px] uppercase tracking-[0.2em] font-sans font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {products.map((product) => {
                const images = parseImages(product.images);
                return (
                  <tr key={product.id} className="hover:bg-cream-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-14 bg-cream-50 flex-shrink-0 overflow-hidden border border-cream-200">
                          {images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={images[0]} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Package size={16} className="text-cream-200" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-ink text-sm font-sans font-medium">{product.name}</p>
                          <p className="text-ink-muted text-xs font-sans">{product.brand} • {product.ml}ml</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-ink/60 text-xs font-sans">{product.category.name}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-ink font-semibold text-sm">{formatPrice(product.price)}</span>
                    </td>
                    <td className="px-5 py-4">
                      {product.dropshippingId ? (
                        <span className="text-green-700 text-xs font-mono">{product.dropshippingId}</span>
                      ) : (
                        <span className="text-ink/30 text-xs">Não configurado</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 ${product.inStock ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"}`}>
                        {product.inStock ? "Em estoque" : "Esgotado"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs ${product.featured ? "text-gold-dark" : "text-ink/30"}`}>
                        {product.featured ? "Sim" : "Não"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Link href={`/admin/produtos/${product.id}`} className="text-ink/40 hover:text-gold-dark transition-colors">
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
          <div className="p-16 text-center text-ink/30 text-sm font-sans">
            Nenhum produto cadastrado
          </div>
        )}
      </div>
    </div>
  );
}
