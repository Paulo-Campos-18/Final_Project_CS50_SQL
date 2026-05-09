import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CartProvider } from '@/context/CartContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import CartDrawer from '@/components/CartDrawer';

export const metadata: Metadata = {
  title: 'KEYFORGE — Digital Key Vault',
  description:
    'KEYFORGE — sua loja de chaves digitais. Cofre seguro, vitrine cuidada e dashboards reais por trás de cada compra.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <CartProvider>
              <Navbar />
              <CartDrawer />
              <div className="page-wrapper">{children}</div>
              <Footer />
            </CartProvider>
          </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
