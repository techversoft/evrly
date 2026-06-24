'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '../../../utils/api';
import { formatPrice, formatDate } from '../../../utils/format';
import { Package, MapPin, User, ShieldCheck, DollarSign, Calendar, ArrowLeft, Loader2, CreditCard } from 'lucide-react';

export default function AdminOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/orders');
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching admin orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (session && session.user.role !== 'admin') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      fetchOrders();
    }
  }, [session, status]);

  const handleUpdateStatus = async (orderId, updates) => {
    try {
      setUpdatingOrderId(orderId);
      await api.put(`/admin/orders/${orderId}/status`, updates);
      
      // Reload orders
      const { data } = await api.get('/admin/orders');
      setOrders(data || []);
      alert('Order status updated successfully.');
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header and Back Link */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => router.push('/admin/dashboard')}
          className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-500 cursor-pointer"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-800">
            Global Order Management Dashboard
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Total {orders.length} platform orders placed
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center max-w-md mx-auto space-y-3.5 shadow-sm">
          <div className="w-16 h-16 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Package className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-800">No platform orders</h3>
            <p className="text-xs text-gray-400">
              When customers complete checkout transactions, orders will show up here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);

            return (
              <div 
                key={order._id}
                className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-5 hover:border-gray-200 transition-all"
              >
                
                {/* Header Information */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-50 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-gray-800">
                        ORDER: {order._id.substring(12).toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400">({order._id})</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-[10px] text-gray-400 font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(order.createdAt)}
                      </span>
                      <span className="flex items-center gap-1 text-gray-600">
                        <DollarSign className="h-3.5 w-3.5 text-indigo-500" />
                        Total: <strong className="text-gray-800 font-extrabold">{formatPrice(order.totalAmount)}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-0.5 text-xs text-gray-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      Client: <strong className="text-gray-800 font-bold">{order.user?.name}</strong> ({order.user?.email})
                    </span>
                  </div>
                </div>

                {/* Split layouts: items list vs controls / address */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  
                  {/* Items Column */}
                  <div className="lg:col-span-2 space-y-3.5">
                    <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider pl-1">Purchased Products ({totalItems})</h4>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-2xl flex gap-3 items-center border border-gray-50">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-100 flex-shrink-0">
                            <img src={item.images?.[0]} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-grow min-w-0">
                            <h5 className="text-xs font-bold text-gray-800 truncate leading-snug">{item.name}</h5>
                            <span className="text-[10px] text-gray-400 font-semibold">
                              Qty: {item.quantity} • Price: {formatPrice(item.price)} • Status: 
                              <strong className="text-indigo-600 font-extrabold capitalize pl-1">{item.orderStatus}</strong>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Operational controls / Address Column */}
                  <div className="col-span-1 space-y-4">
                    
                    {/* Destination */}
                    <div className="p-4 bg-slate-50 border border-gray-100 rounded-2xl space-y-2 text-xs">
                      <span className="flex items-center gap-1.5 font-bold text-gray-700 border-b border-gray-200/50 pb-1.5 text-[10px] uppercase">
                        <MapPin className="h-3.5 w-3.5 text-pink-500" />
                        Delivery Destination
                      </span>
                      <div className="text-gray-600 space-y-0.5 font-medium leading-relaxed">
                        <p className="font-extrabold text-gray-800">{order.shippingAddress?.name}</p>
                        <p className="font-semibold">{order.shippingAddress?.phone}</p>
                        <p>
                          {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zipCode}
                        </p>
                      </div>
                    </div>

                    {/* Quick controls status */}
                    <div className="p-4 bg-pink-50/10 border border-pink-100/50 rounded-2xl space-y-3 text-xs">
                      <span className="flex items-center gap-1.5 font-bold text-gray-700 border-b border-pink-100/10 pb-1.5 text-[10px] uppercase">
                        <CreditCard className="h-3.5 w-3.5 text-pink-500" />
                        Update Statuses
                      </span>

                      {/* Payment Status Dropdown */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Payment Status</label>
                        <select
                          disabled={updatingOrderId === order._id}
                          value={order.paymentStatus}
                          onChange={(e) => handleUpdateStatus(order._id, { paymentStatus: e.target.value })}
                          className="w-full text-xs font-bold border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none cursor-pointer"
                        >
                          <option value="pending">Pending Payment</option>
                          <option value="paid">Transaction Paid</option>
                          <option value="failed">Transaction Failed</option>
                        </select>
                      </div>

                      {/* Order items status Dropdown */}
                      <div className="space-y-1 pt-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Fulfillment Status (All Items)</label>
                        <select
                          disabled={updatingOrderId === order._id}
                          value={order.items[0]?.orderStatus || 'pending'}
                          onChange={(e) => handleUpdateStatus(order._id, { orderStatus: e.target.value })}
                          className="w-full text-xs font-bold border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
