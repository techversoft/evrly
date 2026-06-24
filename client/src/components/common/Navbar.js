'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useCart } from '../../context/CartContext';
import { 
  Search, 
  ShoppingCart, 
  User, 
  Gift, 
  LogOut, 
  LayoutDashboard, 
  Package, 
  Sliders,
  ChevronDown,
  Menu
} from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();
  const { cartCount } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [selectedCatSlug, setSelectedCatSlug] = useState('');

  const categories = [
    { name: 'Birthday Gifts', slug: 'birthday-gifts' },
    { name: 'Anniversary Gifts', slug: 'anniversary-gifts' },
    { name: 'Corporate Gifts', slug: 'corporate-gifts' },
    { name: 'Personalized Mugs', slug: 'personalized-mugs' },
    { name: 'Custom Frames', slug: 'custom-frames' },
    { name: 'Surprise Boxes', slug: 'surprise-boxes' }
  ];

  // Sync states with URL search query
  useEffect(() => {
    setKeyword(searchParams.get('keyword') || '');
    setSelectedCatSlug(searchParams.get('category') || '');
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('keyword', keyword.trim());
    if (selectedCatSlug) params.set('category', selectedCatSlug);
    router.push(`/products?${params.toString()}`);
  };

  const selectSearchCategory = (slug) => {
    setSelectedCatSlug(slug);
    setShowCatDropdown(false);
  };

  const getSelectedCatName = () => {
    if (!selectedCatSlug) return 'All Categories';
    const found = categories.find(c => c.slug === selectedCatSlug);
    return found ? found.name : 'All Categories';
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900 text-white shadow-md border-b border-slate-800">
      
      {/* Top Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Logo (CustomizedGiftStore) */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-pink-500/20 group-hover:scale-105 transition-transform duration-200 bg-white flex items-center justify-center border border-gray-100">
                <img src="/logo.png" alt="CustomizedGiftStore Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white group-hover:text-pink-400 transition-colors">
                CustomizedGiftStore
              </span>
            </Link>
          </div>

          {/* Amazon/Meesho style Search bar + Category Dropdown combo */}
          <form 
            onSubmit={handleSearch}
            className="flex-1 max-w-3xl flex items-center bg-white rounded-lg overflow-hidden border-2 border-transparent focus-within:border-pink-500 text-gray-800 shadow-sm"
          >
            {/* Category selection dropdown */}
            <div className="relative border-r border-gray-200 bg-gray-50 flex-shrink-0 h-11 hidden sm:flex items-center">
              <button
                type="button"
                onClick={() => setShowCatDropdown(!showCatDropdown)}
                className="px-4 text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1.5 h-full cursor-pointer"
              >
                <span className="truncate max-w-[120px]">{getSelectedCatName()}</span>
                <ChevronDown className="h-3 w-3 flex-shrink-0 text-gray-400" />
              </button>

              {showCatDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowCatDropdown(false)} />
                  <div className="absolute left-0 top-full mt-1 w-64 rounded-xl bg-white border border-gray-100 shadow-xl z-40 py-1.5 text-xs text-gray-700 max-h-80 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => selectSearchCategory('')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 font-bold text-gray-900"
                    >
                      All Categories
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c.slug}
                        type="button"
                        onClick={() => selectSearchCategory(c.slug)}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 font-semibold ${
                          selectedCatSlug === c.slug ? 'text-pink-600 bg-pink-50/50' : 'text-gray-600'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Input Search */}
            <input
              type="text"
              placeholder="Search 200+ personalized gifts, mugs, surprise boxes, frames..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="flex-grow px-4 py-2.5 text-sm focus:outline-none bg-white text-gray-800"
            />

            {/* Submit */}
            <button 
              type="submit"
              className="h-11 px-6 bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-95 text-white flex items-center justify-center cursor-pointer transition-opacity"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>

          {/* Action buttons */}
          <div className="flex items-center gap-3 sm:gap-6">
            
            {/* Seller Hub link */}
            <Link 
              href={
                session 
                  ? session.user.role === 'seller' 
                    ? '/seller/dashboard' 
                    : '/register?role=seller' 
                  : '/register?role=seller'
              } 
              className="text-xs font-bold text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 rounded-full px-4 py-1.5 transition-all hidden md:block"
            >
              Seller Hub
            </Link>

            {/* Cart Button */}
            <Link 
              href="/cart" 
              className="relative p-2 text-slate-300 hover:text-pink-400 transition-colors group flex items-center gap-1.5"
            >
              <div className="relative">
                <ShoppingCart className="h-6 w-6 group-hover:scale-105 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-[10px] font-extrabold text-white ring-2 ring-slate-900">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-slate-300 group-hover:text-white hidden lg:block">Cart</span>
            </Link>

            {/* Account Profile drop menu */}
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-800 transition-colors text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-500 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                    {session.user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden lg:block leading-none">
                    <p className="text-[10px] text-slate-400 font-semibold">Hello, Sign In</p>
                    <p className="text-xs font-bold text-slate-200 flex items-center gap-0.5 mt-0.5">
                      {session.user.name.split(' ')[0]}
                      <ChevronDown className="h-3 w-3 text-slate-400" />
                    </p>
                  </div>
                </button>

                {showProfileDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowProfileDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2.5 w-56 rounded-2xl bg-white border border-gray-100 shadow-xl z-50 py-2 divide-y divide-gray-50 text-gray-700">
                      <div className="px-4 py-2.5">
                        <p className="text-xs text-gray-400">Signed in as</p>
                        <p className="text-sm font-bold text-gray-800 truncate">{session.user.email}</p>
                        <span className="inline-block mt-1 px-2.5 py-0.5 bg-pink-50 text-[10px] font-bold text-pink-600 rounded-full capitalize">
                          {session.user.role}
                        </span>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/profile"
                          onClick={() => setShowProfileDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-pink-600 transition-all"
                        >
                          <User className="h-4 w-4 text-gray-400" />
                          My Profile
                        </Link>

                        <Link
                          href="/orders"
                          onClick={() => setShowProfileDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-pink-600 transition-all"
                        >
                          <Package className="h-4 w-4 text-gray-400" />
                          My Orders
                        </Link>

                        {session.user.role === 'seller' && (
                          <Link
                            href="/seller/dashboard"
                            onClick={() => setShowProfileDropdown(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-all"
                          >
                            <LayoutDashboard className="h-4 w-4 text-indigo-500" />
                            Seller Dashboard
                          </Link>
                        )}

                        {session.user.role === 'admin' && (
                          <Link
                            href="/admin/dashboard"
                            onClick={() => setShowProfileDropdown(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-pink-600 transition-all"
                          >
                            <Sliders className="h-4 w-4 text-pink-500" />
                            Admin Dashboard
                          </Link>
                        )}
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            signOut({ callbackUrl: '/' });
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-all"
                        >
                          <LogOut className="h-4 w-4 text-red-400" />
                          Log Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-indigo-600 hover:opacity-95 shadow-md shadow-pink-500/20 hover:shadow-lg transition-all rounded-full flex items-center gap-1.5"
              >
                <User className="h-4 w-4" />
                Sign In
              </Link>
            )}

          </div>
        </div>
      </div>

      {/* Row 2: Amazon-like sub-navbar categories menu bar */}
      <div className="bg-slate-800 text-xs font-bold text-slate-300 border-t border-slate-700/60 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6 h-10 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Link href="/products" className="hover:text-white transition-colors flex items-center gap-1">
            <Menu className="h-4 w-4" />
            All Custom Gifts
          </Link>
          {categories.map((c) => (
            <Link 
              key={c.slug}
              href={`/products?category=${c.slug}`}
              className={`hover:text-white transition-colors ${
                selectedCatSlug === c.slug ? 'text-pink-400 font-extrabold border-b-2 border-pink-400 h-10 flex items-center' : 'h-10 flex items-center'
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

    </header>
  );
}
