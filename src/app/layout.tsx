import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/providers/SessionProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Maison Parfums | Perfumes Importados", template: "%s | Maison Parfums" },
  description: "Os melhores perfumes importados do mundo, entregues na sua porta. Dior, Chanel, Tom Ford, Creed e muito mais.",
  keywords: "perfumes importados, perfumes originais, fragrâncias, perfumaria, Dior, Chanel, Tom Ford",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Maison Parfums",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-dark text-white antialiased">
        <SessionProvider session={session}>
          <Header />
          <CartDrawer />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <Toaster position="top-right" />
        </SessionProvider>
      </body>
    </html>
  );
}
