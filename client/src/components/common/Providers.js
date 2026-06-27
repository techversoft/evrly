'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '../../context/CartContext';
import { ToastProvider } from '../../context/ToastContext';

export default function Providers({ children }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <ToastProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
