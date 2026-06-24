'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Gift, Lock, Mail, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Check callback URL redirects
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  
  // Show error or success messages from query params
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const upgradedParam = searchParams.get('upgraded');

    if (errorParam === 'CredentialsSignin') {
      setErrorMsg('Invalid email or password. Please verify.');
    } else if (errorParam) {
      setErrorMsg('Authentication failed. Please try again.');
    }

    if (upgradedParam === 'true') {
      setSuccessMsg('Your account has been upgraded to a Seller! Please log in again to access the Seller Dashboard.');
    }
  }, [searchParams]);

  // If already logged in, redirect away
  useEffect(() => {
    if (session) {
      router.push(callbackUrl);
    }
  }, [session]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        redirect: false, // Don't redirect, handle response in state
        email,
        password,
        callbackUrl,
      });

      if (res.error) {
        setErrorMsg(res.error || 'Invalid credentials');
      } else {
        router.push(callbackUrl);
      }
    } catch (err) {
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl });
  };

  return (
    <div className="max-w-md mx-auto my-8 bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
      
      {/* Header Brand */}
      <div className="text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-2xl overflow-hidden bg-white shadow-md border border-gray-100 flex items-center justify-center mx-auto">
          <img src="/logo.png" alt="CustomizedGiftStore Logo" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-gray-800">Welcome Back</h2>
        <p className="text-xs text-gray-400">Log in to track orders or customize gifts</p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-100 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Login form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
            <input
              type="email"
              required
              placeholder="E.g., you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-gray-700">Password</label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-pink-500 to-indigo-600 hover:opacity-95 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
        >
          {loading ? 'Logging in...' : 'Sign In'}
          <ArrowRight className="h-4.5 w-4.5" />
        </button>

      </form>

      {/* Divider */}
      <div className="relative flex items-center justify-center border-t border-gray-100 py-2">
        <span className="absolute px-3 bg-white text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
          Or Continue With
        </span>
      </div>

      {/* Google Login Trigger */}
      <button
        onClick={handleGoogleSignIn}
        className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
          <g transform="matrix(1, 0, 0, 1, 0, 0)">
            <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.83 21.57,11.43 21.35,11.1z" fill="#4285F4" />
            <path d="M12,20.82c2.45,0 4.5,-0.8 6,-2.2l-3.3,-2.58c-0.9,0.6 -2.07,0.98 -3.3,0.98 -2.37,0 -4.38,-1.6 -5.1,-3.75H2.9v2.66C4.4,18.84 8.0,20.82 12,20.82z" fill="#34A853" />
            <path d="M6.9,13.27C6.72,12.74 6.62,12.18 6.62,11.6c0,-0.58 0.1,-1.14 0.28,-1.67V7.27H2.9C2.28,8.57 1.94,10.04 1.94,11.6c0,1.56 0.34,3.03 0.96,4.33l4.0,-3.66Z" fill="#FBBC05" />
            <path d="M12,5.58c1.33,0 2.53,0.46 3.47,1.36l2.6,-2.6C16.5,2.9 14.45,2.08 12,2.08c-4.0,0 -7.6,1.98 -9.1,4.9l4.0,3.66c0.72,-2.15 2.73,-3.75 5.1,-3.75z" fill="#EA4335" />
          </g>
        </svg>
        Log In with Google
      </button>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 font-semibold pt-2">
        Don\'t have an account?{' '}
        <Link href="/register" className="text-pink-600 font-bold hover:underline">
          Register Here
        </Link>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto my-12 text-center text-sm text-gray-400">
        Loading Login Forms...
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
