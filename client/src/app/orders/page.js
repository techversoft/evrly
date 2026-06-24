'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '../../utils/api';
import { formatPrice, formatDate } from '../../utils/format';
import { Package, ChevronRight, ShoppingBag, Eye, Calendar, DollarSign, Loader2 } from 'lucide-react';

export default function MyOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/orders/my-orders');
        setOrders(data || []);
      } catch (error) {
        console.error('Error fetching user orders:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchOrders();
    }
  }, [session, status]);

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <Package className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold">No Orders Placed Yet</h2>
          <p className="text-xs text-gray-400">
            You haven\'t ordered any personalized gifts yet. Start customizing!
          </p>
        </div>
        <Link
          href="/products"
          className="inline-block px-6 py-2.5 bg-pink-600 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer hover:opacity-95"
        >
          View Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <h1 className="text-xl sm:text-2xl font-black text-gray-800 border-b border-gray-100 pb-5">
        My Gifting Orders
      </h1>

      <div className="space-y-4">
        {orders.map((order) => {
          const totalItems = order.items.reduce((acc, i) => acc + i.quantity, 0);
          
          return (
            <div 
              key={order._id}
              className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-pink-200/50 hover:shadow-lg transition-all shadow-sm space-y-4 flex flex-col md:flex-row md:items-center md:justify-between"
            >
              
              {/* Order Info */}
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-pink-50 text-pink-500 rounded-xl hidden sm:block">
                  <Package className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-extrabold text-gray-800">
                      ID: {order._id.substring(12).toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md ${
                      order.paymentStatus === 'paid'
                        ? 'bg-green-50 text-green-600 border border-green-100'
                        : 'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}>
                      {order.paymentStatus === 'paid' ? 'Paid' : 'Pending Payment'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-[11px] text-gray-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(order.createdAt)}
                    </span>
                    <span className="flex items-center gap-1 text-gray-600">
                      <DollarSign className="h-3.5 w-3.5 text-indigo-500" />
                      Amount: <strong className="text-gray-800 font-extrabold">{formatPrice(order.totalAmount)}</strong>
                    </span>
                    <span>Items: {totalItems}</span>
                  </div>
                </div>
              </div>

              {/* View CTA */}
              <div className="flex items-center gap-3 border-t border-gray-50 pt-4 md:border-t-0 md:pt-0 justify-between">
                
                {/* Visual Image Preview */}
                <div className="flex -space-x-2.5 overflow-hidden">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <div 
                      key={idx} 
                      className="w-8 h-8 rounded-full overflow-hidden border-2 border-white bg-gray-50 shadow-sm"
                    >
                      <img src={item.images?.[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-pink-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-pink-600 shadow-sm">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>

                <Link
                  href={`/orders/${order._id}`}
                  className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-xs font-bold text-gray-600 hover:text-pink-600 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="h-4 w-4" />
                  Track Order
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
