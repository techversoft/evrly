'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '../../../utils/api';
import { formatPrice } from '../../../utils/format';
import { 
  Store, 
  IndianRupee, 
  ShoppingBag, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  PlusCircle, 
  ChevronRight,
  Loader2 
} from 'lucide-react';

export default function SellerDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (session && session.user.role !== 'seller') {
      router.push('/');
      return;
    }

    const fetchSellerStats = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/seller/dashboard');
        setStats(data);
      } catch (error) {
        console.error('Error fetching seller stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchSellerStats();
    }
  }, [session, status]);

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold">Failed to load Seller profile</h2>
      </div>
    );
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const maxMonthlySales = Math.max(...stats.salesByMonth, 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-pink-400" />
            <span className="text-xs font-extrabold text-pink-300 uppercase tracking-widest">Seller Partner Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">{stats.shopName}</h1>
          <p className="text-xs text-slate-300 leading-normal max-w-md">{stats.shopDescription}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/seller/products"
            className="px-4 py-2.5 bg-gradient-to-r from-pink-500 to-indigo-600 text-xs font-bold rounded-xl text-white shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="h-4 w-4" />
            Add Gift Product
          </Link>
          <Link
            href="/seller/orders"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold rounded-xl text-white transition-all flex items-center gap-1"
          >
            Manage Orders
          </Link>
          <Link
            href="/seller/payments"
            className="px-4 py-2.5 bg-pink-600/90 hover:bg-pink-600 border border-pink-500/30 text-xs font-bold rounded-xl text-white transition-all flex items-center gap-1"
          >
            Payouts & Earnings
          </Link>
        </div>
      </div>

      {/* Moderation approval alert if not verified */}
      {!stats.isApproved && (
        <div className="p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl flex gap-3 items-start shadow-sm">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-extrabold">Shop Verification Pending Approval</h4>
            <p className="text-[10px] text-amber-600 leading-normal mt-0.5">
              Your vendor application is submitted and is being verified by Admin moderators. You can still pre-add gifts to your inventory, but they will not show up in the catalog until your shop and products are approved.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Earnings',
            value: formatPrice(stats.earnings),
            icon: IndianRupee,
            color: 'text-green-600 bg-green-50 border-green-100/50',
            link: '/seller/payments',
          },
          {
            label: 'Total Items Sold',
            value: stats.totalItemsSold,
            icon: ShoppingBag,
            color: 'text-indigo-600 bg-indigo-50 border-indigo-100/50',
            link: '/seller/orders',
          },
          {
            label: 'Fulfillment Pending',
            value: stats.pendingFulfillmentCount,
            icon: Package,
            color: 'text-pink-600 bg-pink-50 border-pink-100/50',
            link: '/seller/orders',
          },
          {
            label: 'Total Products',
            value: stats.totalProducts,
            icon: Store,
            color: 'text-slate-600 bg-slate-50 border-slate-100/50',
            link: '/seller/products',
          },
        ].map((card, idx) => {
          const Icon = card.icon;
          const cardContent = (
            <div className={`bg-white border rounded-2xl p-5 shadow-sm space-y-4 hover:border-pink-200 transition-all h-full`}>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">{card.label}</span>
                <div className={`p-2 rounded-xl border ${card.color}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-800">{card.value}</h3>
            </div>
          );

          return (
            <Link href={card.link} key={idx} className="hover:no-underline block h-full">
              {cardContent}
            </Link>
          );
        })}
      </div>

      {/* Analytics Splitting Section: Monthly Sales Chart & Inventory Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Chart (CSS bar visualization) */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-gray-800">Monthly Revenue Split</h3>
            <p className="text-xs text-gray-400">Total vendor sales tracked across the year</p>
          </div>

          <div className="flex h-56 items-end justify-between gap-2.5 pt-4 border-b border-gray-100 pb-2">
            {stats.salesByMonth.map((val, idx) => {
              const pct = (val / maxMonthlySales) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  
                  {/* Tooltip on hover */}
                  <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mb-1">
                    {formatPrice(val)}
                  </span>
                  
                  {/* Bar Fill */}
                  <div 
                    className="w-full bg-gradient-to-t from-indigo-500 to-pink-500 rounded-t-md group-hover:opacity-85 transition-opacity min-h-[4px]" 
                    style={{ height: `${Math.max(pct, 2)}%` }}
                  />

                  {/* Label */}
                  <span className="text-[10px] font-bold text-gray-400 select-none">
                    {months[idx]}
                  </span>

                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Inventory alert / notifications list */}
        <div className="col-span-1 bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-gray-800">Operational Summary</h3>
            <p className="text-xs text-gray-400">Immediate details requiring action</p>
          </div>

          <div className="space-y-4">
            
            {/* Low stock indicators */}
            {stats.lowStockProducts > 0 ? (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 text-red-800">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <div className="space-y-0.5 text-xs">
                  <h4 className="font-bold">Low Stock Warning</h4>
                  <p className="text-[10px] text-red-600 leading-normal">
                    {stats.lowStockProducts} products in your inventory have less than 5 units left. Restock now to prevent listing pauses.
                  </p>
                  <Link href="/seller/products" className="inline-block mt-1 font-bold hover:underline text-[10px] text-red-800">
                    Restock Products
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex gap-3 text-green-800">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="space-y-0.5 text-xs">
                  <h4 className="font-bold">Inventory Healthy</h4>
                  <p className="text-[10px] text-green-600 leading-normal">
                    All listed products have sufficient inventory stock levels.
                  </p>
                </div>
              </div>
            )}

            {/* General info */}
            <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl text-xs text-indigo-800 space-y-2">
              <h4 className="font-bold">Fulfillment Reminder</h4>
              <p className="text-[10px] text-indigo-600 leading-relaxed">
                Ensure custom photo frames and mugs are printed using top-grade printers. Standard delivery windows are 3 days. Mark orders as "Shipped" and add details as soon as they are handed to delivery partners.
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
