'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '../../../utils/api';
import { formatPrice, formatDate } from '../../../utils/format';
import { 
  Package, 
  MapPin, 
  User, 
  Wand2, 
  CheckCircle, 
  AlertCircle, 
  Truck,
  Loader2 
} from 'lucide-react';

export default function SellerOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/seller/orders');
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching seller orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (session && session.user.role !== 'seller') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      fetchOrders();
    }
  }, [session, status]);

  const handleStatusChange = async (orderId, productId, newStatus) => {
    try {
      setUpdatingItemId(`${orderId}_${productId}`);
      
      // Put status request
      await api.put(`/seller/orders/${orderId}/item/${productId}`, {
        status: newStatus,
      });

      // Refresh orders
      const { data } = await api.get('/seller/orders');
      setOrders(data || []);
    } catch (error) {
      console.error('Error changing order item status:', error);
      alert('Could not update status. Please try again.');
    } finally {
      setUpdatingItemId(null);
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
      <h1 className="text-xl sm:text-2xl font-black text-gray-800 border-b border-gray-100 pb-5">
        Fulfillment Management Portal
      </h1>

      {orders.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Package className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-800 font-semibold">No seller orders found</h3>
            <p className="text-xs text-gray-400">
              When customers buy your customizable products, orders will list here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div 
              key={order._id}
              className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-5 hover:border-gray-200 transition-all"
            >
              
              {/* Order Header info */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-50 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-gray-800">
                      ORDER ID: {order._id.substring(12).toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded capitalize ${
                      order.paymentStatus === 'paid'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      Payment: {order.paymentStatus}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-semibold">{formatDate(order.createdAt)}</p>
                </div>

                <div className="flex flex-col sm:items-end text-xs text-gray-500 font-medium">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-gray-400" />
                    Customer: <strong className="text-gray-800 font-bold">{order.user?.name}</strong> ({order.user?.email})
                  </span>
                </div>
              </div>

              {/* Order split: Products layout vs Shipping location */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Items relevant to this vendor */}
                <div className="lg:col-span-2 space-y-4">
                  {order.items.map((item) => (
                    <div key={item.product} className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl space-y-4">
                      
                      {/* Product details */}
                      <div className="flex gap-4">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 flex-shrink-0">
                          <img src={item.images?.[0]} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-gray-800 leading-tight">{item.name}</h4>
                          <p className="text-xs text-gray-400 font-semibold">
                            Qty: {item.quantity} • Revenue: {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>

                      {/* Custom inputs details */}
                      {item.customizationValues?.length > 0 && (
                        <div className="p-3 bg-white rounded-xl text-xs text-gray-600 border border-gray-100 space-y-1.5">
                          <span className="flex items-center gap-1 font-bold text-indigo-700 text-[10px] uppercase tracking-wider">
                            <Wand2 className="h-3.5 w-3.5" />
                            Personalization Parameters:
                          </span>
                          {item.customizationValues.map((cv, cIdx) => (
                            <div key={cIdx} className="flex gap-1.5 items-start pl-1 flex-wrap">
                              <span className="font-semibold text-gray-400">{cv.fieldName}:</span>
                              {cv.value?.startsWith('http') ? (
                                <a 
                                  href={cv.value} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-pink-500 font-bold hover:underline"
                                >
                                  Download/Inspect Uploaded Image
                                </a>
                              ) : (
                                <span className="font-bold text-gray-700">{cv.value}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Item Status selector */}
                      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                        <span className="text-xs font-bold text-gray-500"> Fulfill Status:</span>
                        
                        <div className="flex items-center gap-2">
                          {updatingItemId === `${order._id}_${item.product}` && (
                            <Loader2 className="h-4 w-4 animate-spin text-pink-500" />
                          )}
                          <select
                            disabled={updatingItemId === `${order._id}_${item.product}`}
                            value={item.orderStatus}
                            onChange={(e) => handleStatusChange(order._id, item.product, e.target.value)}
                            className="text-xs font-bold border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing (Customizing)</option>
                            <option value="packed">Packed</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancel Order</option>
                          </select>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

                {/* Shipping Location cards */}
                <div className="col-span-1 p-4 bg-indigo-50/20 border border-indigo-100/30 rounded-2xl space-y-3.5">
                  <span className="flex items-center gap-1 text-xs font-bold text-gray-800 border-b border-indigo-100/10 pb-2">
                    <MapPin className="h-4.5 w-4.5 text-pink-500" />
                    Delivery Destination
                  </span>
                  
                  <div className="text-xs text-gray-600 space-y-1">
                    <p className="font-extrabold text-gray-800">{order.shippingAddress?.name}</p>
                    <p className="font-semibold">{order.shippingAddress?.phone}</p>
                    <p className="leading-relaxed font-medium">
                      {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zipCode}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                    <Truck className="h-4 w-4 text-indigo-500" />
                    <span>Courier Delivery Standard</span>
                  </div>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
