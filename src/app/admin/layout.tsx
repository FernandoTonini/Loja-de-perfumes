import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut, ChevronRight } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-cream-200 flex flex-col fixed h-full z-40 shadow-sm">
        <div className="p-6 border-b border-cream-200">
          <Link href="/">
            <span className="font-serif text-xl text-ink tracking-[0.2em]">MAISON</span>
            <span className="block text-[9px] tracking-[0.5em] uppercase text-gold-dark font-sans">Admin Panel</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-ink-muted hover:text-gold-dark hover:bg-gold/5 transition-all group rounded-sm font-sans text-sm"
            >
              <item.icon size={18} className="group-hover:text-gold-dark transition-colors" />
              {item.label}
              <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-cream-200">
          <div className="px-4 py-3 mb-2">
            <p className="text-ink/70 text-xs font-sans">{session.user.name}</p>
            <p className="text-ink-muted text-[10px] font-sans">{session.user.email}</p>
          </div>
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 px-4 py-3 text-red-400/70 hover:text-red-500 hover:bg-red-50 transition-all font-sans text-sm"
          >
            <LogOut size={18} />
            Sair
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
