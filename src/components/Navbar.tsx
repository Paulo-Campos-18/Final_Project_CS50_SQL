'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import UserSelector from './UserSelector';

export default function Navbar() {
  const pathname = usePathname();
  const { cartCount, setIsCartOpen } = useCart();

  const links = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/games', label: 'Games', icon: '🎮' },
    { href: '/wishlist', label: 'Wishlist', icon: '❤️' },
    { href: '/users', label: 'Users', icon: '👥' },
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  ];

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-logo">
          <div className="navbar-logo-icon">🔑</div>
          <span>KeyVault</span>
        </Link>

        <ul className="navbar-links">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={pathname === link.href ? 'active' : ''}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <UserSelector />
          <button 
            className="cart-toggle-btn btn btn-outline" 
            onClick={() => setIsCartOpen(true)} 
            style={{ position: 'relative', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
          >
            🛒 Cart
            {cartCount > 0 && (
              <span 
                className="cart-badge" 
                style={{ 
                  position: 'absolute', top: '-6px', right: '-8px', 
                  background: 'var(--accent-primary)', color: 'white',
                  borderRadius: '50%', width: '20px', height: '20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 'bold'
                }}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
