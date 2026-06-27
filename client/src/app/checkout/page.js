'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCart } from '../../context/CartContext';
import api from '../../utils/api';
import { formatPrice } from '../../utils/format';
import { 
  CreditCard, 
  Truck, 
  ShieldCheck, 
  ShoppingBag, 
  Loader2, 
  CheckCircle2,
  ChevronLeft,
  X
} from 'lucide-react';

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

  // Multi-step state: 2 = Address, 3 = Payment, 4 = Summary
  const [activeStep, setActiveStep] = useState(2);

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
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Modals & order details state
  const [showCodSuccessModal, setShowCodSuccessModal] = useState(false);
  const [createdOrderDetails, setCreatedOrderDetails] = useState(null);

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
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: null });
    }
  };

  // Address validation with focus/scroll helper and detailed field validations
  const validateAddress = () => {
    setErrorMessage('');
    const errors = {};

    if (!address.name.trim()) {
      errors.name = 'Full name is required.';
    }

    const phoneTrim = address.phone.trim();
    if (!phoneTrim) {
      errors.phone = 'Contact number is required.';
    } else if (!/^[6-9]\d{9}$/.test(phoneTrim)) {
      errors.phone = 'Please enter a valid 10-digit mobile number starting with 6-9.';
    }

    const zipTrim = address.zipCode.trim();
    if (!zipTrim) {
      errors.zipCode = 'Pincode is required.';
    } else if (!/^\d{6}$/.test(zipTrim)) {
      errors.zipCode = 'Please enter a valid 6-digit Pincode.';
    }

    if (!address.street.trim()) {
      errors.street = 'Street address is required.';
    }

    if (!address.city.trim()) {
      errors.city = 'City is required.';
    }

    if (!address.state.trim()) {
      errors.state = 'State is required.';
    }

    setFieldErrors(errors);

    const firstErrorKey = Object.keys(errors)[0];
    if (firstErrorKey) {
      setErrorMessage('Please fix the highlighted errors before proceeding.');
      const inputEl = document.getElementById(`address-${firstErrorKey}`);
      if (inputEl) {
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          inputEl.focus({ preventScroll: true });
        }, 450);
      }
      return false;
    }
    return true;
  };

  // Step 2 Proceed to Payment handler
  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    if (!validateAddress()) return;

    // Auto-save address to user's saved addresses if it is not already saved
    const isAlreadySaved = savedAddresses.some(
      (addr) =>
        addr.name?.toLowerCase() === address.name.trim().toLowerCase() &&
        addr.phone === address.phone.trim() &&
        addr.street?.toLowerCase() === address.street.trim().toLowerCase() &&
        addr.city?.toLowerCase() === address.city.trim().toLowerCase() &&
        addr.state?.toLowerCase() === address.state.trim().toLowerCase() &&
        addr.zipCode === address.zipCode.trim()
    );

    if (!isAlreadySaved) {
      try {
        const hasDefault = savedAddresses.some((addr) => addr.isDefault);
        const { data: updatedAddresses } = await api.post('/auth/addresses', {
          ...address,
          isDefault: !hasDefault,
        });
        setSavedAddresses(updatedAddresses);
      } catch (addrErr) {
        console.error('Failed to auto-save address:', addrErr);
      }
    }

    setActiveStep(3);
  };

  // Step 3 Checkout Order Submission handler
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setErrorMessage('');

    if (!validateAddress()) {
      setActiveStep(2);
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
      setCreatedOrderDetails(dbOrder);

      // 2. COD flow
      if (paymentMethod === 'cod') {
        await clearCart();
        // Open the COD success popup modal. Step 4 Summary rendering is handled in modal callback
        setShowCodSuccessModal(true);
        return;
      }

      // 3. Online Razorpay flow
      const razorOrder = data.razorpayOrder;

      if (!razorOrder) {
        const errorMsg = data.paymentInitiationError || 'Could not initialize Razorpay checkout session. Please verify your API credentials.';
        setErrorMessage(errorMsg);
        setLoading(false);
        return;
      }

      // Live Razorpay popup configuration (Always open Razorpay SDK popup)
      const options = {
        key: data.razorpayKey || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_5qg8zGfFq8mK6D', // Fallback to a valid alphanumeric dummy key pattern
        amount: razorOrder.amount,
        currency: razorOrder.currency,
        name: 'Evrly - Your Customized GiftStore',
        description: 'Personalized surprises payment checkout',
        handler: async function (response) {
          try {
            setLoading(true);
            const verifyPayload = {
              orderId: dbOrder._id,
              razorpayOrderId: response.razorpay_order_id || razorOrder.id,
              razorpayPaymentId: response.razorpay_payment_id || `mock_pay_${Math.random().toString(36).substring(2, 11)}`,
              razorpaySignature: response.razorpay_signature || 'mock_signature_approved',
            };

            const verifyRes = await api.post('/orders/verify', verifyPayload);
            if (verifyRes.status === 200) {
              await clearCart();
              try {
                const { data: freshOrder } = await api.get(`/orders/${dbOrder._id}`);
                setCreatedOrderDetails(freshOrder);
              } catch (err) {
                console.error(err);
              }
              setActiveStep(4);
            }
          } catch (err) {
            setErrorMessage('Razorpay payment capture failed. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: address.name || data.customer?.name || session?.user?.name || '',
          contact: address.phone || data.customer?.phoneNumber || session?.user?.phoneNumber || '',
          email: data.customer?.email || session?.user?.email || '',
        },
        theme: {
          color: '#EC4899', // Pink theme
        },
      };

      // Only attach order_id if it's a real order created via backend API credentials
      if (!razorOrder.isMock) {
        options.order_id = razorOrder.id;
      }

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

  // COD Success Dialog OK callback
  const handleCodOk = async () => {
    setShowCodSuccessModal(false);
    if (createdOrderDetails) {
      try {
        const { data: freshOrder } = await api.get(`/orders/${createdOrderDetails._id}`);
        setCreatedOrderDetails(freshOrder);
      } catch (err) {
        console.error(err);
      }
    }
    setActiveStep(4); // Stay on checkout page and transition to Step 4 Summary!
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 flex flex-col justify-center items-center gap-3 text-sm font-bold text-gray-500 bg-[#f8f9fa] min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
        <span className="animate-pulse">Authenticating checkout session...</span>
      </div>
    );
  }

  if (cartItems.length === 0 && activeStep < 4 && !createdOrderDetails) {
    return (
      <div className="bg-[#f8f9fa] min-h-screen flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm">
          <div className="w-20 h-20 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mx-auto shadow-sm border border-pink-100/65">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-800">No Items to Checkout</h2>
            <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto leading-relaxed">
              Your cart is empty. Please add items to your cart before proceeding to checkout!
            </p>
          </div>
          <div className="pt-2">
            <button 
              onClick={() => router.push('/products')}
              className="px-8 py-3 bg-gradient-to-r from-pink-500 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer hover:opacity-95 transition-all"
            >
              View Gift Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/50 min-h-screen pb-16 text-slate-800">
      
      {/* Premium Stepper Progress Bar */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100 py-4 px-4 sm:px-6 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between text-[11px] sm:text-xs font-semibold text-slate-400 select-none">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-6 h-6 rounded-full border border-pink-500 flex items-center justify-center font-bold text-pink-500 bg-pink-50/50">1</span>
            <span className="text-pink-500 font-extrabold">Cart</span>
          </div>
          <div className="flex-1 h-0.5 bg-pink-500 mx-2 sm:mx-4" />
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold transition-all duration-300 ${
              activeStep >= 2
                ? 'border-pink-500 text-white bg-pink-500 shadow-sm shadow-pink-500/25'
                : 'border-slate-200 bg-white text-slate-400'
            }`}>2</span>
            <span className={`transition-all duration-300 font-extrabold ${activeStep >= 2 ? 'text-pink-600' : ''}`}>Address</span>
          </div>
          <div className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-all duration-300 ${activeStep >= 3 ? 'bg-pink-500' : 'bg-slate-100'}`} />
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold transition-all duration-300 ${
              activeStep >= 3
                ? 'border-pink-500 text-white bg-pink-500 shadow-sm shadow-pink-500/25'
                : 'border-slate-200 bg-white text-slate-400'
            }`}>3</span>
            <span className={`transition-all duration-300 font-extrabold ${activeStep >= 3 ? 'text-pink-600' : ''}`}>Payment</span>
          </div>
          <div className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-all duration-300 ${activeStep >= 4 ? 'bg-pink-500' : 'bg-slate-100'}`} />
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold transition-all duration-300 ${
              activeStep >= 4
                ? 'border-pink-500 text-white bg-pink-500 shadow-sm shadow-pink-500/25'
                : 'border-slate-200 bg-white text-slate-400'
            }`}>4</span>
            <span className={`transition-all duration-300 font-extrabold ${activeStep >= 4 ? 'text-pink-600' : ''}`}>Summary</span>
          </div>
        </div>
      </div>

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${activeStep === 4 ? 'py-4' : 'py-8'}`}>
        {activeStep < 4 && (
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight border-b border-slate-100 pb-4 text-left">
            Checkout
          </h1>
        )}

        {errorMessage && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold rounded-2xl text-left animate-pulse">
            {errorMessage}
          </div>
        )}

        {activeStep < 4 ? (
          <form 
            onSubmit={handleCheckoutSubmit}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6"
          >
            
            {/* Left Column: Shipping Address Form (Step 2) OR Payment Section (Step 3) */}
            <div className="lg:col-span-2 space-y-6">
              
              {activeStep === 2 ? (
                <div className="bg-white border border-slate-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5 text-left">
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
                    <Truck className="h-4 w-4 text-pink-500" />
                    Shipping Address
                  </h3>

                  {savedAddresses.length > 0 && (
                    <div className="space-y-1.5 border-b border-slate-100 pb-4">
                      <label className="text-xs font-bold text-slate-600">Select Saved Address</label>
                      <select
                        value={selectedAddressId}
                        onChange={handleAddressSelect}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500/10 focus:border-pink-500 cursor-pointer transition-all"
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
                      <label className="text-xs font-bold text-slate-600">Full Name</label>
                      <input
                        id="address-name"
                        type="text"
                        name="name"
                        placeholder="E.g., John Doe"
                        value={address.name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm transition-all focus:ring-4 focus:outline-none ${
                          fieldErrors.name
                            ? 'border-rose-500 focus:ring-rose-500/10 focus:border-rose-500'
                            : 'border-slate-200 focus:ring-pink-500/10 focus:border-pink-500'
                        }`}
                      />
                      {fieldErrors.name && (
                        <p className="text-[10px] font-semibold text-rose-500 mt-1">{fieldErrors.name}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600">Contact Number</label>
                      <input
                        id="address-phone"
                        type="tel"
                        name="phone"
                        placeholder="10-digit phone number"
                        value={address.phone}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm transition-all focus:ring-4 focus:outline-none ${
                          fieldErrors.phone
                            ? 'border-rose-500 focus:ring-rose-500/10 focus:border-rose-500'
                            : 'border-slate-200 focus:ring-pink-500/10 focus:border-pink-500'
                        }`}
                      />
                      {fieldErrors.phone && (
                        <p className="text-[10px] font-semibold text-rose-500 mt-1">{fieldErrors.phone}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600">Pincode / Zip Code</label>
                      <input
                        id="address-zipCode"
                        type="text"
                        name="zipCode"
                        placeholder="E.g., 122001"
                        value={address.zipCode}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm transition-all focus:ring-4 focus:outline-none ${
                          fieldErrors.zipCode
                            ? 'border-rose-500 focus:ring-rose-500/10 focus:border-rose-500'
                            : 'border-slate-200 focus:ring-pink-500/10 focus:border-pink-500'
                        }`}
                      />
                      {fieldErrors.zipCode && (
                        <p className="text-[10px] font-semibold text-rose-500 mt-1">{fieldErrors.zipCode}</p>
                      )}
                    </div>

                    <div className="space-y-1.5 col-span-1 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-600">Street Address & Landmark</label>
                      <input
                        id="address-street"
                        type="text"
                        name="street"
                        placeholder="Flat no., Building name, Street name"
                        value={address.street}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm transition-all focus:ring-4 focus:outline-none ${
                          fieldErrors.street
                            ? 'border-rose-500 focus:ring-rose-500/10 focus:border-rose-500'
                            : 'border-slate-200 focus:ring-pink-500/10 focus:border-pink-500'
                        }`}
                      />
                      {fieldErrors.street && (
                        <p className="text-[10px] font-semibold text-rose-500 mt-1">{fieldErrors.street}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600">City</label>
                      <input
                        id="address-city"
                        type="text"
                        name="city"
                        placeholder="E.g., Mumbai"
                        value={address.city}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm transition-all focus:ring-4 focus:outline-none ${
                          fieldErrors.city
                            ? 'border-rose-500 focus:ring-rose-500/10 focus:border-rose-500'
                            : 'border-slate-200 focus:ring-pink-500/10 focus:border-pink-500'
                        }`}
                      />
                      {fieldErrors.city && (
                        <p className="text-[10px] font-semibold text-rose-500 mt-1">{fieldErrors.city}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600">State</label>
                      <input
                        id="address-state"
                        type="text"
                        name="state"
                        placeholder="E.g., Maharashtra"
                        value={address.state}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm transition-all focus:ring-4 focus:outline-none ${
                          fieldErrors.state
                            ? 'border-rose-500 focus:ring-rose-500/10 focus:border-rose-500'
                            : 'border-slate-200 focus:ring-pink-500/10 focus:border-pink-500'
                        }`}
                      />
                      {fieldErrors.state && (
                        <p className="text-[10px] font-semibold text-rose-500 mt-1">{fieldErrors.state}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Shipping summary preview */}
                  <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 text-left">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <Truck className="h-4 w-4 text-pink-500" />
                        Shipping Address Details
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveStep(2)}
                        className="text-xs font-black text-pink-500 hover:text-pink-600 flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="h-3 w-3" /> Edit Address
                      </button>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1.5 pl-1 font-semibold">
                      <p className="font-extrabold text-gray-800 text-sm">{address.name}</p>
                      <p className="text-gray-500">{address.phone}</p>
                      <p className="leading-relaxed text-gray-700 font-medium">
                        {address.street}, {address.city}, {address.state} - {address.zipCode}
                      </p>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 text-left">
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-3">
                      <CreditCard className="h-4 w-4 text-pink-500" />
                      Payment Options
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label 
                        className={`p-4 border rounded-2xl cursor-pointer flex flex-col justify-between h-24 transition-all relative ${
                          paymentMethod === 'razorpay'
                            ? 'border-pink-500 bg-pink-50/10 shadow-sm'
                            : 'border-gray-200 hover:bg-gray-55'
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
                            : 'border-gray-200 hover:bg-gray-55'
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
              )}
            </div>

            {/* Right Column: Pricing & Submit */}
            <div className="col-span-1">
              <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-6 shadow-sm sticky top-24">
                <h3 className="text-sm font-bold text-gray-800 border-b border-gray-55 pb-3 text-left">Final Breakdown</h3>

                <div className="space-y-4">
                  {/* Mini Item List */}
                  <div className="max-h-48 overflow-y-auto space-y-3.5 pr-1 divide-y divide-gray-55">
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
                  <div className="space-y-3 pt-4 border-t border-gray-100 text-xs text-gray-600 text-left font-semibold">
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

                {/* Action Buttons based on active step */}
                {activeStep === 2 ? (
                  <button
                    type="button"
                    onClick={handleProceedToPayment}
                    className="w-full py-4 bg-gradient-to-r from-pink-500 to-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-pink-500/10 hover:shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer font-black"
                  >
                    Proceed to Payment
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-pink-500 to-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-pink-500/10 hover:shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed font-black"
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
                )}
              </div>
            </div>

          </form>
        ) : (
          /* Step 4: Order Summary Screen */
          <div className="pt-0">
            {createdOrderDetails && (
              <div className="max-w-3xl mx-auto bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-left">
                <div className="text-center space-y-3 pb-6 border-b border-gray-100">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                    <CheckCircle2 className="h-9 w-9 animate-bounce" />
                  </div>
                  <h2 className="text-xl font-black text-gray-800">Order Placed Successfully!</h2>
                  <p className="text-xs text-gray-400 font-semibold max-w-sm mx-auto">
                    Thank you for shopping with Evrly. Your order has been registered and is being processed by our custom sellers.
                  </p>
                </div>

                {/* Order Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  
                  {/* Items Summary */}
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Purchased Items</h4>
                    <div className="space-y-3 divide-y divide-gray-50 max-h-60 overflow-y-auto pr-1">
                      {createdOrderDetails.items?.map((item, idx) => (
                        <div key={item._id || idx} className={`flex justify-between items-center text-xs ${idx > 0 ? 'pt-3.5' : ''}`}>
                          <div className="flex items-center gap-3">
                            {item.images?.[0] && (
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-55 border border-gray-100 shrink-0">
                                <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <span className="text-gray-700 font-bold truncate max-w-[150px]">
                              {item.name} <strong className="text-gray-400 font-semibold">x{item.quantity}</strong>
                            </span>
                          </div>
                          <span className="font-extrabold text-gray-800">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping & Payment Summary */}
                  <div className="space-y-4 md:border-l md:pl-6 md:border-gray-100">
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Shipping Destination</h4>
                      <div className="text-xs text-gray-600 space-y-1 pl-1 font-semibold">
                        <p className="font-extrabold text-gray-800">{createdOrderDetails.shippingAddress?.name}</p>
                        <p className="text-gray-500">{createdOrderDetails.shippingAddress?.phone}</p>
                        <p className="leading-relaxed text-gray-700 font-medium">
                          {createdOrderDetails.shippingAddress?.street}, {createdOrderDetails.shippingAddress?.city}, {createdOrderDetails.shippingAddress?.state} - {createdOrderDetails.shippingAddress?.zipCode}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payment Info</h4>
                      <div className="text-xs pl-1 space-y-1.5 font-semibold">
                        <div className="flex justify-between">
                          <span className="text-gray-500 font-semibold">Method:</span>
                          <span className="font-bold text-gray-850 uppercase">{createdOrderDetails.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 font-semibold">Amount:</span>
                          <span className="font-bold text-pink-600">{formatPrice(createdOrderDetails.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* CTA Actions */}
                <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => router.push(`/orders/${createdOrderDetails._id}`)}
                    className="flex-1 py-3.5 bg-gradient-to-r from-pink-500 to-indigo-600 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-lg transition-all text-center cursor-pointer font-black"
                  >
                    Track Order Status
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/products')}
                    className="py-3.5 px-6 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold rounded-xl transition-all text-center cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* COD SUCCESS CONFIRMATION DIALOG POPUP */}
      {showCodSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100 animate-bounce">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-gray-800">Order Confirmed!</h3>
              <p className="text-xs text-gray-400 font-semibold max-w-xs mx-auto leading-relaxed">
                Your Cash on Delivery order has been successfully placed. Our sellers will start custom printing your surprises immediately!
              </p>
            </div>

            <button
              type="button"
              onClick={handleCodOk}
              className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-indigo-600 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer font-black"
            >
              OK
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
