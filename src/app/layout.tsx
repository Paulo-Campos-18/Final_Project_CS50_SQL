import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CartProvider } from '@/context/CartContext';
import CartDrawer from '@/components/CartDrawer';

export const metadata: Metadata = {
  title: 'KeyVault — Digital Game Key Store',
  description:
    'Buy and resell digital game keys. Browse games, track prices, and manage your game collection. CS50 SQL Final Project.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Navbar />
          <CartDrawer />
          <div className="page-wrapper">{children}</div>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
