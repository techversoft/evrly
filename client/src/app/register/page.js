'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import api from '../../utils/api';
import { Gift, Lock, Mail, User, Store, AlertCircle, ArrowRight } from 'lucide-react';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [role, setRole] = useState('customer'); // customer | seller
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Seller shop details
  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const isCustomerLoggedIn = session && session.user?.role === 'customer';

  // Redirect or update role if logged in
  useEffect(() => {
    if (session) {
      if (session.user.role === 'seller') {
        router.push('/seller/dashboard');
      } else if (session.user.role === 'customer' && searchParams.get('role') === 'seller') {
        setRole('seller');
      } else {
        router.push(callbackUrl);
      }
    }
  }, [session, callbackUrl, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!isCustomerLoggedIn) {
      if (!name.trim()) {
        setErrorMsg('Full Name is required.');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }

      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
    }

    if (role === 'seller') {
      if (!shopName.trim()) {
        setErrorMsg('Shop name is required for registration.');
        return;
      }
      if (shopName.trim().length < 3) {
        setErrorMsg('Shop name must be at least 3 characters long.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isCustomerLoggedIn) {
        // 1. Submit Become Seller upgrade request
        await api.post('/auth/become-seller', {
          shopName,
          shopDescription,
        });

        // 2. Log out the user so they can log back in with their new seller role
        await signOut({ callbackUrl: '/login?upgraded=true' });
      } else {
        // 1. Submit Registration API
        const registerPayload = {
          name,
          email,
          password,
          role,
          ...(role === 'seller' ? { shopName, shopDescription } : {}),
        };

        const { data } = await api.post('/auth/register', registerPayload);

        // 2. Automate nextauth credentials signin
        const signInRes = await signIn('credentials', {
          redirect: false,
          email,
          password,
          callbackUrl,
        });

        if (signInRes.error) {
          setErrorMsg(signInRes.error);
        } else {
          router.push(callbackUrl);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Action failed. Please verify your inputs.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
      
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-2xl overflow-hidden bg-white shadow-md border border-gray-100 flex items-center justify-center mx-auto">
          <img src="/logo.png" alt="Evrly - Your Customized GiftStore Logo" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-gray-800">
          {isCustomerLoggedIn ? 'Become a Seller Partner' : 'Create Account'}
        </h2>
        <p className="text-xs text-gray-400">
          {isCustomerLoggedIn 
            ? 'Upgrade your account to start selling custom gifts'
            : 'Join our customized gifting community'}
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Role Selection Toggles (Only show if not logged in) */}
      {!isCustomerLoggedIn && (
        <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setRole('customer')}
            className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              role === 'customer'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <User className="h-4 w-4 text-pink-500" />
            Customer
          </button>
          <button
            type="button"
            onClick={() => setRole('seller')}
            className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              role === 'seller'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Store className="h-4 w-4 text-indigo-500" />
            Seller Shop
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Standard Signup Fields (Hidden if upgrading) */}
        {!isCustomerLoggedIn && (
          <>
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Full Name</label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 focus:outline-none"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 focus:outline-none"
                />
              </div>
            </div>
          </>
        )}

        {/* Seller Shop Info Form Block (Shown if registering as seller or if logged-in customer is upgrading) */}
        {(role === 'seller' || isCustomerLoggedIn) && (
          <div className="pt-2 border-t border-gray-100 space-y-4 animate-fade-in">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Shop Name</label>
              <input
                type="text"
                required
                placeholder="E.g., Gifts & Prints Boutique"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Shop Description</label>
              <textarea
                placeholder="Describe your customized gifting items..."
                value={shopDescription}
                rows={3}
                onChange={(e) => setShopDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 focus:outline-none"
              />
            </div>

          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-indigo-600 hover:opacity-95 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
        >
          {loading ? (
            isCustomerLoggedIn ? 'Upgrading Account...' : 'Creating Account...'
          ) : (
            isCustomerLoggedIn ? 'Upgrade to Seller Partner' : 'Create Account'
          )}
          <ArrowRight className="h-4.5 w-4.5" />
        </button>

      </form>

      {/* Footer */}
      {!isCustomerLoggedIn && (
        <div className="text-center text-xs text-gray-500 font-semibold pt-2">
          Already have an account?{' '}
          <Link href="/login" className="text-pink-600 font-bold hover:underline">
            Log In here
          </Link>
        </div>
      )}

    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto my-12 text-center text-sm text-gray-400">
        Loading Signup Forms...
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
