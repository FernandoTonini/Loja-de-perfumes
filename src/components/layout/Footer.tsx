import Link from "next/link";
import { Instagram, Mail, Phone, MapPin, Shield, Truck, RotateCcw, Star } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-dark-100 border-t border-dark-300">
      {/* Trust badges */}
      <div className="border-b border-dark-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: <Shield size={28} />, title: "100% Originais", desc: "Todos os perfumes são autênticos e importados" },
              { icon: <Truck size={28} />, title: "Entrega Rápida", desc: "Enviamos para todo o Brasil com segurança" },
              { icon: <RotateCcw size={28} />, title: "Troca Fácil", desc: "7 dias para troca ou devolução" },
              { icon: <Star size={28} />, title: "Atendimento VIP", desc: "Suporte especializado em fragrâncias" },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center gap-3">
                <div className="text-gold">{item.icon}</div>
                <h4 className="font-sans font-semibold text-white text-sm">{item.title}</h4>
                <p className="text-white/40 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="mb-4">
              <span className="font-serif text-2xl text-white tracking-[0.2em]">MAISON</span>
              <span className="block text-[10px] tracking-[0.5em] uppercase text-gold font-sans font-medium">
                Parfums
              </span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed mb-6">
              Trazemos as mais exclusivas fragrâncias do mundo diretamente para você.
              Elegância e sofisticação em cada frasco.
            </p>
            <div className="flex gap-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                className="text-white/40 hover:text-gold transition-colors">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h5 className="text-xs tracking-[0.3em] uppercase text-gold font-sans font-medium mb-6">Categorias</h5>
            <ul className="space-y-3">
              {[
                { label: "Masculino", href: "/produtos?categoria=masculino" },
                { label: "Feminino", href: "/produtos?categoria=feminino" },
                { label: "Unissex", href: "/produtos?categoria=unissex" },
                { label: "Nicho", href: "/produtos?categoria=nicho" },
                { label: "Árabes", href: "/produtos?categoria=arabes" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/50 hover:text-gold transition-colors text-sm font-sans">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-xs tracking-[0.3em] uppercase text-gold font-sans font-medium mb-6">Informações</h5>
            <ul className="space-y-3">
              {[
                { label: "Sobre Nós", href: "/sobre" },
                { label: "Política de Privacidade", href: "/privacidade" },
                { label: "Termos de Uso", href: "/termos" },
                { label: "Política de Troca", href: "/trocas" },
                { label: "FAQ", href: "/faq" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/50 hover:text-gold transition-colors text-sm font-sans">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h5 className="text-xs tracking-[0.3em] uppercase text-gold font-sans font-medium mb-6">Contato</h5>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-white/50 text-sm">
                <Mail size={16} className="text-gold mt-0.5 flex-shrink-0" />
                <a href="mailto:contato@maisonparfums.com.br" className="hover:text-gold transition-colors">
                  contato@maisonparfums.com.br
                </a>
              </li>
              <li className="flex items-start gap-3 text-white/50 text-sm">
                <Phone size={16} className="text-gold mt-0.5 flex-shrink-0" />
                <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">
                  (11) 99999-9999
                </a>
              </li>
              <li className="flex items-start gap-3 text-white/50 text-sm">
                <MapPin size={16} className="text-gold mt-0.5 flex-shrink-0" />
                <span>São Paulo, SP — Brasil</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-dark-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/30 text-xs font-sans">
            © {new Date().getFullYear()} Maison Parfums. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-2">
            <img src="https://www.paypalobjects.com/webstatic/mktg/logo/AM_mc_vs_dc_ae.jpg" alt="Pagamentos" className="h-6 opacity-30" />
          </div>
        </div>
      </div>
    </footer>
  );
}
