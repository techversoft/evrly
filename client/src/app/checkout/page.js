'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCart } from '../../context/CartContext';
import api from '../../utils/api';
import { formatPrice } from '../../utils/format';
import { CreditCard, Truck, ShieldCheck, ShoppingBag, Loader2 } from 'lucide-react';

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const { 
    cartItems, 
    cartSubtotal, 
    cartShipping, 
    cartTotal, 
    clearCart 
  } = useCart();

  // Address State
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  // Fetch saved addresses
  useEffect(() => {
    if (status === 'authenticated') {
      const fetchSavedAddresses = async () => {
        try {
          const { data } = await api.get('/auth/addresses');
          setSavedAddresses(data);
          // If there's a default address, select it and auto-fill the form
          const defaultAddr = data.find(addr => addr.isDefault);
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr._id);
            setAddress({
              name: defaultAddr.name || '',
              phone: defaultAddr.phone || '',
              street: defaultAddr.street || '',
              city: defaultAddr.city || '',
              state: defaultAddr.state || '',
              zipCode: defaultAddr.zipCode || '',
            });
          } else if (data.length > 0) {
            // fallback to first address
            setSelectedAddressId(data[0]._id);
            setAddress({
              name: data[0].name || '',
              phone: data[0].phone || '',
              street: data[0].street || '',
              city: data[0].city || '',
              state: data[0].state || '',
              zipCode: data[0].zipCode || '',
            });
          }
        } catch (err) {
          console.error('Error fetching saved addresses:', err);
        }
      };
      fetchSavedAddresses();
    }
  }, [status]);

  const handleAddressSelect = (e) => {
    const val = e.target.value;
    setSelectedAddressId(val);
    if (val === 'custom') {
      setAddress({
        name: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
      });
    } else {
      const found = savedAddresses.find(addr => addr._id === val);
      if (found) {
        setAddress({
          name: found.name || '',
          phone: found.phone || '',
          street: found.street || '',
          city: found.city || '',
          state: found.state || '',
          zipCode: found.zipCode || '',
        });
      }
    }
  };

  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Protect route
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/checkout');
    }
  }, [status]);

  // Load Razorpay script dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleInputChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Check empty fields
    const hasEmpty = Object.values(address).some(val => val.trim() === '');
    if (hasEmpty) {
      setErrorMessage('Please fill out all shipping address fields.');
      return;
    }

    try {
      setLoading(true);

      // 1. Call Backend to create Order
      const { data } = await api.post('/orders', {
        shippingAddress: address,
        paymentMethod,
      });

      const dbOrder = data.order;

      // 2. COD flow
      if (paymentMethod === 'cod') {
        await clearCart();
        router.push(`/orders/${dbOrder._id}`);
        return;
      }

      // 3. Online Razorpay flow
      const razorOrder = data.razorpayOrder;
      
      // If it returned a mock order, handle mock payment simulation
      if (razorOrder.isMock) {
        // Trigger mock validation immediately to proceed without popup block
        const mockVerifyPayload = {
          orderId: dbOrder._id,
          razorpayOrderId: razorOrder.id,
          razorpayPaymentId: `mock_pay_${Math.random().toString(36).substring(2, 11)}`,
          razorpaySignature: 'mock_signature_approved',
        };

        const verifyRes = await api.post('/orders/verify', mockVerifyPayload);
        if (verifyRes.status === 200) {
          await clearCart();
          router.push(`/orders/${dbOrder._id}?success=true`);
        } else {
          setErrorMessage('Payment verification failed.');
        }
        return;
      }

      // Live Razorpay popup configuration
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_key_dummy',
        amount: razorOrder.amount,
        currency: razorOrder.currency,
        name: 'CustomizedGiftStore',
        description: 'Personalized surprises payment checkout',
        order_id: razorOrder.id,
        handler: async function (response) {
          try {
            setLoading(true);
            const verifyPayload = {
              orderId: dbOrder._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            };

            const verifyRes = await api.post('/orders/verify', verifyPayload);
            if (verifyRes.status === 200) {
              await clearCart();
              router.push(`/orders/${dbOrder._id}?success=true`);
            }
          } catch (err) {
            setErrorMessage('Razorpay payment capture failed. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: address.name,
          contact: address.phone,
          email: session?.user?.email || '',
        },
        theme: {
          color: '#EC4899', // Pink theme
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Checkout error:', error);
      const msg = error.response?.data?.message || 'Checkout request failed. Please review values.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm font-bold text-gray-500">
        Authenticating...
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <ShoppingBag className="h-10 w-10 text-gray-400 mx-auto" />
        <h2 className="text-xl font-bold">No Items to Checkout</h2>
        <button 
          onClick={() => router.push('/products')}
          className="px-6 py-2.5 bg-pink-600 text-white rounded-xl text-xs font-bold"
        >
          View Gift Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-xl sm:text-2xl font-black text-gray-800 border-b border-gray-100 pb-5">
        Checkout Checkout
      </h1>

      {errorMessage && (
        <div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-700 text-xs font-bold rounded-2xl">
          {errorMessage}
        </div>
      )}

      <form 
        onSubmit={handleCheckoutSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6"
      >
        
        {/* Left Column: Shipping Address Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-3">
              <Truck className="h-4 w-4 text-pink-500" />
              Delivery Shipping Address
            </h3>

            {savedAddresses.length > 0 && (
              <div className="space-y-1.5 border-b border-gray-100 pb-4">
                <label className="text-xs font-bold text-gray-700">Select Saved Address</label>
                <select
                  value={selectedAddressId}
                  onChange={handleAddressSelect}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer"
                >
                  {savedAddresses.map((addr) => (
                    <option key={addr._id} value={addr._id}>
                      {addr.name} - {addr.street}, {addr.city} ({addr.zipCode}) {addr.isDefault ? '[Default]' : ''}
                    </option>
                  ))}
                  <option value="custom">-- Use Custom/New Address --</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-1 sm:col-span-2">
                <label className="text-xs font-bold text-gray-700">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="E.g., John Doe"
                  value={address.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Contact Number</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="10-digit phone number"
                  value={address.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Pincode / Zip Code</label>
                <input
                  type="text"
                  name="zipCode"
                  required
                  placeholder="E.g., 400001"
                  value={address.zipCode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 col-span-1 sm:col-span-2">
                <label className="text-xs font-bold text-gray-700">Street Address & Landmark</label>
                <input
                  type="text"
                  name="street"
                  required
                  placeholder="Flat no., Building name, Street name"
                  value={address.street}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">City</label>
                <input
                  type="text"
                  name="city"
                  required
                  placeholder="E.g., Mumbai"
                  value={address.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">State</label>
                <input
                  type="text"
                  name="state"
                  required
                  placeholder="E.g., Maharashtra"
                  value={address.state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-3">
              <CreditCard className="h-4 w-4 text-pink-500" />
              Payment Options
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label 
                className={`p-4 border rounded-2xl cursor-pointer flex flex-col justify-between h-24 transition-all relative ${
                  paymentMethod === 'razorpay'
                    ? 'border-pink-500 bg-pink-50/10 shadow-sm'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="razorpay"
                  checked={paymentMethod === 'razorpay'}
                  onChange={() => setPaymentMethod('razorpay')}
                  className="absolute right-4 top-4 text-pink-500 focus:ring-pink-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-extrabold text-gray-800">Online Payment</span>
                <span className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                  Pay via cards, UPI, wallets using Razorpay gateway.
                </span>
              </label>

              <label 
                className={`p-4 border rounded-2xl cursor-pointer flex flex-col justify-between h-24 transition-all relative ${
                  paymentMethod === 'cod'
                    ? 'border-pink-500 bg-pink-50/10 shadow-sm'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="absolute right-4 top-4 text-pink-500 focus:ring-pink-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-extrabold text-gray-800">Cash on Delivery (COD)</span>
                <span className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                  Pay cash at your doorstep. Extra ₹50 shipping applies.
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Submit */}
        <div className="col-span-1">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-6 shadow-sm sticky top-24">
            <h3 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-3">Final Breakdown</h3>

            <div className="space-y-4">
              {/* Mini Item List */}
              <div className="max-h-48 overflow-y-auto space-y-3.5 pr-1 divide-y divide-gray-50">
                {cartItems.map((item, idx) => (
                  <div key={item._id} className={`flex justify-between items-center text-xs ${idx > 0 ? 'pt-3' : ''}`}>
                    <span className="text-gray-500 max-w-[150px] truncate font-semibold">
                      {item.product?.name} <strong className="text-gray-700">x{item.quantity}</strong>
                    </span>
                    <span className="font-bold text-gray-800">
                      {formatPrice((item.product?.price || 0) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Details */}
              <div className="space-y-3 pt-4 border-t border-gray-100 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span className="font-semibold">Items Subtotal</span>
                  <span className="font-bold text-gray-800">{formatPrice(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Delivery Price</span>
                  <span className="font-bold text-gray-800">
                    {cartShipping === 0 ? 'FREE' : formatPrice(cartShipping)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-50 pt-4 text-sm font-extrabold text-gray-800">
                  <span>Grand Total</span>
                  <span className="text-pink-600">{formatPrice(cartTotal)}</span>
                </div>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-pink-500/10 hover:shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                  Processing Order...
                </>
              ) : paymentMethod === 'razorpay' ? (
                <>
                  <ShieldCheck className="h-5 w-5" />
                  Secure Online Pay
                </>
              ) : (
                'Place Cash Order'
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
