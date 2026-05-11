'use client';

import { useState } from 'react';

export default function PixCopyButton({ brcode }: { brcode: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(brcode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers / restrictive contexts
      const ta = document.createElement('textarea');
      ta.value = brcode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="btn btn-primary"
      style={{
        padding: '12px 16px',
        fontSize: '0.95rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      {copied ? '✓ Copiado!' : '📋 Copiar Pix Copia e Cola'}
    </button>
  );
}
