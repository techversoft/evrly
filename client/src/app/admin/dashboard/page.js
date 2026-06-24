'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '../../../utils/api';
import { formatPrice } from '../../../utils/format';
import { 
  ShieldAlert, 
  Users, 
  Store, 
  ShoppingBag, 
  IndianRupee, 
  PackageOpen, 
  ChevronRight,
  Loader2 
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (session && session.user.role !== 'admin') {
      router.push('/');
      return;
    }

    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/admin/dashboard');
        setStats(data);
      } catch (error) {
        console.error('Error fetching admin statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchAdminStats();
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
        <ShieldAlert className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold">Failed to load Admin Panel</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white flex justify-between items-center shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-pink-400">
            <ShieldAlert className="h-4.5 w-4.5" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest">Platform Administration</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">Control Dashboard</h1>
          <p className="text-xs text-slate-400 font-medium">Moderate products, verify vendors, and manage orders</p>
        </div>
      </div>

      {/* KPI stats blocks */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Platform Sales',
            value: formatPrice(stats.totalSales),
            icon: IndianRupee,
            color: 'text-green-600 bg-green-50 border-green-100',
          },
          {
            label: 'Total Users Registered',
            value: stats.totalUsers,
            icon: Users,
            color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
          },
          {
            label: 'Active Vendor Shops',
            value: stats.totalSellers,
            icon: Store,
            color: 'text-amber-600 bg-amber-50 border-amber-100',
          },
          {
            label: 'Platform Products Count',
            value: stats.totalProducts,
            icon: ShoppingBag,
            color: 'text-pink-600 bg-pink-50 border-pink-100',
          },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">{card.label}</span>
                <div className={`p-2 rounded-xl border ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-800">{card.value}</h3>
            </div>
          );
        })}
      </div>

      {/* Payouts & Financials KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Commission Earnings',
            value: formatPrice(stats.commissionEarnings),
            icon: IndianRupee,
            color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
          },
          {
            label: 'Total Settled Payouts',
            value: formatPrice(stats.totalPayouts),
            icon: IndianRupee,
            color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
          },
          {
            label: 'Pending Payout Requests',
            value: `${stats.pendingPayoutsCount} requests`,
            icon: PackageOpen,
            color: 'text-amber-600 bg-amber-50 border-amber-100',
          },
          {
            label: 'Pending Payout Amount',
            value: formatPrice(stats.pendingPayoutsAmount),
            icon: IndianRupee,
            color: 'text-pink-600 bg-pink-50 border-pink-100',
          },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">{card.label}</span>
                <div className={`p-2 rounded-xl border ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-800">{card.value}</h3>
            </div>
          );
        })}
      </div>

      {/* Admin Quick Moderation Hub link lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Moderation links */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-3">Moderation Pipelines</h3>
          
          <div className="space-y-3">
            <Link 
              href="/admin/sellers"
              className="flex justify-between items-center p-4 bg-gray-50/50 hover:bg-pink-50/20 border border-gray-100 hover:border-pink-200/50 rounded-2xl transition-all cursor-pointer group"
            >
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-gray-700">Pending Seller Registrations</h4>
                <p className="text-[10px] text-gray-400">Applications waiting for GSTIN/Bank validation</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-pink-600">
                {stats.pendingSellersCount} applications
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            <Link 
              href="/admin/payouts"
              className="flex justify-between items-center p-4 bg-gray-50/50 hover:bg-pink-50/20 border border-gray-100 hover:border-pink-200/50 rounded-2xl transition-all cursor-pointer group"
            >
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-gray-700">Seller Settlement Payouts</h4>
                <p className="text-[10px] text-gray-400">Review pending withdrawal requests and log transfers</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-pink-600">
                {stats.pendingPayoutsCount} pending
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            <Link 
              href="/admin/products"
              className="flex justify-between items-center p-4 bg-gray-50/50 hover:bg-indigo-50/20 border border-gray-100 hover:border-indigo-200/50 rounded-2xl transition-all cursor-pointer group"
            >
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-gray-700">Pending Product Submissions</h4>
                <p className="text-[10px] text-gray-400">New customizable gifts requiring image audit</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-600">
                {stats.pendingProductsCount} items
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            <Link 
              href="/admin/users"
              className="flex justify-between items-center p-4 bg-gray-50/50 hover:bg-emerald-50/20 border border-gray-100 hover:border-emerald-200/50 rounded-2xl transition-all cursor-pointer group"
            >
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-gray-700">Manage Users & Roles</h4>
                <p className="text-[10px] text-gray-400">View registered users and change system roles</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600">
                Manage Users
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            <Link 
              href="/admin/orders"
              className="flex justify-between items-center p-4 bg-gray-50/50 hover:bg-amber-50/20 border border-gray-100 hover:border-amber-200/50 rounded-2xl transition-all cursor-pointer group"
            >
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-gray-700">Global Orders Management</h4>
                <p className="text-[10px] text-gray-400">View and update statuses for all platform orders</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-amber-600">
                Manage Orders
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </div>
        </div>

        {/* Recent Order activities logs */}
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-3">Recent Sales</h3>
          
          {stats.recentOrders?.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-4 pl-2">No orders placed on the platform yet.</p>
          ) : (
            <div className="divide-y divide-gray-50 text-xs">
              {stats.recentOrders?.map((ord) => (
                <div key={ord._id} className="py-2.5 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="font-bold text-gray-700">ID: {ord._id.substring(12).toUpperCase()}</span>
                    <span className="text-[10px] text-gray-400 block font-semibold">User: {ord.user?.name}</span>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="font-bold text-gray-800">{formatPrice(ord.totalAmount)}</span>
                    <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded block ${
                      ord.paymentStatus === 'paid' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {ord.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
