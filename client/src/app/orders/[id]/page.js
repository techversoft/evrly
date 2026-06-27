'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '../../../utils/api';
import { formatPrice, formatDate } from '../../../utils/format';
import { 
  CheckCircle2, 
  MapPin, 
  CreditCard, 
  ChevronLeft, 
  Truck, 
  Wand2, 
  Loader2,
  PackageCheck
} from 'lucide-react';

export default function OrderDetailPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { id } = params;
  const { data: session, status } = useSession();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [successBanner, setSuccessBanner] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState('');

  const handleCancelItem = async (productId) => {
    if (!confirm('Are you sure you want to cancel this item?')) return;
    try {
      setActionLoadingId(productId);
      const { data } = await api.post(`/orders/${id}/cancel/${productId}`);
      setOrder(data);
      alert('Item cancelled successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel item.');
    } finally {
      setActionLoadingId('');
    }
  };

  const handleReturnItem = async (productId) => {
    const reason = prompt('Please enter the reason for your return:');
    if (reason === null) return;
    if (!reason.trim()) {
      alert('Return reason is required.');
      return;
    }
    try {
      setActionLoadingId(productId);
      const { data } = await api.post(`/orders/${id}/return/${productId}`, { reason });
      setOrder(data);
      alert('Return request submitted successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request return.');
    } finally {
      setActionLoadingId('');
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data);
      } catch (error) {
        console.error('Error fetching order details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchOrderDetails();
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success') === 'true') {
        setSuccessBanner(true);
      }
    }
  }, [id, session, status]);

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold">Order Details Not Found</h2>
        <button 
          onClick={() => router.push('/orders')}
          className="px-6 py-2 bg-pink-600 text-white rounded-xl text-xs font-bold"
        >
          Back to My Orders
        </button>
      </div>
    );
  }

  const getStatusStep = (status) => {
    switch (status) {
      case 'pending_payment': return 1;
      case 'paid': return 2;
      case 'confirmed': return 3;
      case 'processing': return 4;
      case 'packed': return 5;
      case 'shipped': return 6;
      case 'delivered': return 7;
      default: return 1;
    }
  };

  const steps = [
    { label: 'Payment', desc: 'Payment Processed' },
    { label: 'Paid', desc: 'Paid Successful' },
    { label: 'Confirmed', desc: 'Confirmed by Seller' },
    { label: 'Customizing', desc: 'Customizing Gifts' },
    { label: 'Packed', desc: 'Packed & Ready' },
    { label: 'Shipped', desc: 'In Transit' },
    { label: 'Delivered', desc: 'Delivered' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Link 
          href="/orders" 
          className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-500"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-800">
            Order Status Tracking
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Receipt ID: <strong className="text-gray-600 font-bold">{order._id.toUpperCase()}</strong>
          </p>
        </div>
      </div>

      {successBanner && (
        <div className="p-4 bg-green-50 border border-green-100 text-green-800 rounded-2xl flex gap-3 items-start animate-bounce-short shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold">Payment Verified Successfully!</h4>
            <p className="text-[10px] text-green-600 leading-normal mt-0.5">
              Your transaction was processed. Our sellers have begun custom printing your gifts!
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Gift Items</h3>
          
          {order.items.map((item, idx) => {
            const currentStep = getStatusStep(item.orderStatus);
            
            return (
              <div 
                key={item._id || idx} 
                className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-6 hover:border-gray-200 transition-all"
              >
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                    <img src={item.images?.[0]} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-gray-800 line-clamp-1">{item.name}</h4>
                    <p className="text-xs text-gray-400 font-semibold">
                      Qty: {item.quantity} • Total: {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>

                {item.customizationValues?.length > 0 && (
                  <div className="p-3 bg-gray-50 rounded-xl space-y-1.5 text-xs text-gray-600 border border-gray-100">
                    <span className="flex items-center gap-1 font-bold text-indigo-700 text-[10px] tracking-wide uppercase">
                      <Wand2 className="h-3.5 w-3.5" />
                      Personalization inputs
                    </span>
                    {item.customizationValues.map((cv, cIdx) => (
                      <div key={cIdx} className="flex gap-1.5 items-start flex-wrap pl-1">
                        <span className="font-semibold text-gray-400">{cv.fieldName}:</span>
                        {cv.value?.startsWith('http') ? (
                          <a 
                            href={cv.value} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-pink-500 font-bold hover:underline"
                          >
                            Click to inspect image
                          </a>
                        ) : (
                          <span className="font-bold text-gray-700">{cv.value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}                 {['cancelled', 'returned', 'refunded'].includes(item.orderStatus) ? (
                  <div className={`py-2.5 px-4 text-xs font-bold rounded-xl border text-center capitalize ${
                    item.orderStatus === 'cancelled'
                      ? 'bg-red-50 text-red-700 border-red-100'
                      : item.orderStatus === 'returned'
                      ? 'bg-orange-50 text-orange-700 border-orange-100'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                  }`}>
                    This item has been {item.orderStatus}.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center relative pl-1 pr-1">
                      <div className="absolute left-6 right-6 top-4.5 h-0.5 bg-gray-100 -z-10" />
                      <div 
                        className="absolute left-6 top-4.5 h-0.5 bg-gradient-to-r from-pink-500 to-indigo-600 -z-10 transition-all duration-500" 
                        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                      />

                      {steps.map((st, sIdx) => {
                        const stepNum = sIdx + 1;
                        const isCompleted = stepNum < currentStep;
                        const isActive = stepNum === currentStep;

                        return (
                          <div key={sIdx} className="flex flex-col items-center gap-1.5">
                            <div className={`w-9.5 h-9.5 rounded-full flex items-center justify-center text-xs font-bold transition-all border shadow-sm ${
                              isCompleted
                                ? 'bg-gradient-to-r from-pink-500 to-indigo-600 text-white border-transparent'
                                : isActive
                                ? 'bg-white border-pink-500 text-pink-600 font-black scale-110 ring-4 ring-pink-50'
                                : 'bg-white border-gray-200 text-gray-400'
                            }`}>
                              {isCompleted ? (
                                <PackageCheck className="h-4.5 w-4.5" />
                              ) : (
                                stepNum
                              )}
                            </div>
                            <div className="text-center">
                              <p className={`text-[10px] font-extrabold ${isActive ? 'text-pink-600' : 'text-gray-500'}`}>
                                {st.label}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action buttons (Cancel / Return) */}
                    <div className="flex justify-end pt-2 border-t border-gray-50 mt-4">
                      {['pending_payment', 'paid', 'confirmed', 'processing'].includes(item.orderStatus) && (
                        <button
                          type="button"
                          onClick={() => handleCancelItem(item.product?._id || item.product)}
                          disabled={actionLoadingId === (item.product?._id || item.product)}
                          className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                          {actionLoadingId === (item.product?._id || item.product) ? 'Cancelling...' : 'Cancel Item'}
                        </button>
                      )}
                      {item.orderStatus === 'delivered' && (
                        <button
                          type="button"
                          onClick={() => handleReturnItem(item.product?._id || item.product)}
                          disabled={actionLoadingId === (item.product?._id || item.product)}
                          className="px-4 py-2 border border-amber-500 text-amber-700 hover:bg-amber-50 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                          {actionLoadingId === (item.product?._id || item.product) ? 'Processing...' : 'Request Return'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="col-span-1 space-y-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Destination</h3>
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-6">
            <div className="space-y-3.5">
              <span className="flex items-center gap-1.5 text-xs font-bold text-gray-800 border-b border-gray-50 pb-2">
                <MapPin className="h-4.5 w-4.5 text-pink-500" />
                Shipping Info
              </span>
              <div className="space-y-1 text-xs text-gray-600">
                <p className="font-extrabold text-gray-800">{order.shippingAddress?.name}</p>
                <p className="font-semibold">{order.shippingAddress?.phone}</p>
                <p className="leading-relaxed font-medium">
                  {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zipCode}
                </p>
              </div>
            </div>

            <div className="space-y-3.5 pt-4 border-t border-gray-100">
              <span className="flex items-center gap-1.5 text-xs font-bold text-gray-800 border-b border-gray-50 pb-2">
                <CreditCard className="h-4.5 w-4.5 text-pink-500" />
                Billing Breakdowns
              </span>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span className="font-semibold">Subtotal</span>
                  <span className="font-bold text-gray-800">{formatPrice(order.totalAmount - order.shippingPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Shipping</span>
                  <span className="font-bold text-gray-800">
                    {order.shippingPrice === 0 ? 'FREE' : formatPrice(order.shippingPrice)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-50 pt-3 text-sm font-extrabold text-gray-800">
                  <span>Grand Total</span>
                  <span className="text-pink-600">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-gray-100 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-500">Method:</span>
                <span className="font-bold text-gray-700 uppercase">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-500">Status:</span>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded capitalize ${
                  order.paymentStatus === 'paid'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
