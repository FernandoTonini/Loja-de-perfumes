"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ShoppingBag, Search, User, Menu, X, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Início", href: "/" },
  { label: "Masculino", href: "/produtos?categoria=masculino" },
  { label: "Feminino", href: "/produtos?categoria=feminino" },
  { label: "Unissex", href: "/produtos?categoria=unissex" },
  { label: "Nicho", href: "/produtos?categoria=nicho" },
  { label: "Árabes", href: "/produtos?categoria=arabes" },
];

export function Header() {
  const { data: session } = useSession();
  const { getTotalItems, toggleCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const totalItems = getTotalItems();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-ink text-cream text-center py-2 text-[11px] font-sans font-medium tracking-[0.15em] uppercase">
        Frete grátis acima de R$ 500 &nbsp;·&nbsp; Perfumes 100% Originais &nbsp;·&nbsp; Entrega para todo o Brasil
      </div>

      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-cream/95 backdrop-blur-md border-b border-cream-200 shadow-[0_2px_20px_rgba(28,24,20,0.08)]"
            : "bg-cream border-b border-cream-200"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Mobile menu button */}
            <button
              className="md:hidden text-ink/50 hover:text-gold-dark transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Logo */}
            <Link href="/" className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
              <div className="text-center">
                <span className="font-serif text-2xl md:text-3xl font-normal tracking-[0.2em] text-ink">
                  MAISON
                </span>
                <span className="block text-[10px] tracking-[0.5em] uppercase text-gold-dark font-sans font-medium -mt-0.5">
                  Parfums
                </span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-ink/60 hover:text-gold-dark transition-colors text-sm tracking-wide font-sans"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Link href="/buscar" className="hidden sm:block text-ink/50 hover:text-gold-dark transition-colors">
                <Search size={20} />
              </Link>

              {/* User */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="text-ink/50 hover:text-gold-dark transition-colors flex items-center gap-1"
                >
                  <User size={20} />
                  {session && <ChevronDown size={12} />}
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-cream-200 shadow-[0_8px_30px_rgba(28,24,20,0.12)] z-50">
                    {session ? (
                      <>
                        <Link
                          href="/conta"
                          className="block px-4 py-3 text-sm text-ink/70 hover:text-gold-dark hover:bg-cream-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Minha Conta
                        </Link>
                        <Link
                          href="/conta/pedidos"
                          className="block px-4 py-3 text-sm text-ink/70 hover:text-gold-dark hover:bg-cream-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Meus Pedidos
                        </Link>
                        {session.user.role === "ADMIN" && (
                          <Link
                            href="/admin"
                            className="block px-4 py-3 text-sm text-gold-dark hover:bg-cream-50 transition-colors border-t border-cream-200"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            Painel Admin
                          </Link>
                        )}
                        <button
                          onClick={() => { signOut(); setUserMenuOpen(false); }}
                          className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-cream-50 transition-colors border-t border-cream-200"
                        >
                          Sair
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          className="block px-4 py-3 text-sm text-ink/70 hover:text-gold-dark hover:bg-cream-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Entrar
                        </Link>
                        <Link
                          href="/cadastro"
                          className="block px-4 py-3 text-sm text-ink/70 hover:text-gold-dark hover:bg-cream-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Cadastrar
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Cart */}
              <button
                onClick={toggleCart}
                className="relative text-ink/50 hover:text-gold-dark transition-colors"
              >
                <ShoppingBag size={22} />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gold text-cream text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-cream-200 shadow-md">
            <nav className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="py-3 px-2 text-ink/70 hover:text-gold-dark border-b border-cream-100 font-sans text-sm tracking-wide"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 flex flex-col gap-1">
                {session ? (
                  <>
                    <Link href="/conta" className="py-3 px-2 text-ink/70 hover:text-gold-dark font-sans text-sm" onClick={() => setMobileOpen(false)}>Minha Conta</Link>
                    <Link href="/conta/pedidos" className="py-3 px-2 text-ink/70 hover:text-gold-dark font-sans text-sm" onClick={() => setMobileOpen(false)}>Meus Pedidos</Link>
                    <button onClick={() => signOut()} className="py-3 px-2 text-left text-red-500 font-sans text-sm">Sair</button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="py-3 px-2 text-ink/70 hover:text-gold-dark font-sans text-sm" onClick={() => setMobileOpen(false)}>Entrar</Link>
                    <Link href="/cadastro" className="py-3 px-2 text-ink/70 hover:text-gold-dark font-sans text-sm" onClick={() => setMobileOpen(false)}>Cadastrar</Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
