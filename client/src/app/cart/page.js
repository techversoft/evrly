'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/format';
import api from '../../utils/api';
import { 
  Trash2, 
  ShoppingBag, 
  Wand2, 
  Info, 
  ArrowRight, 
  Loader2, 
  Heart, 
  ShieldCheck, 
  Truck, 
  Lock, 
  Gift, 
  ChevronRight, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  
  const { 
    cartItems, 
    loading, 
    cartSubtotal, 
    cartShipping, 
    cartTotal, 
    updateCartItem, 
    removeItemFromCart 
  } = useCart();

  // Local state to prevent double clicks and track active item loading state
  const [processingItemId, setProcessingItemId] = useState(null);

  // Promo Code / Coupon state
  const [promoCode, setPromoCode] = useState('WELCOME10');
  const [couponApplied, setCouponApplied] = useState(true);
  const [appliedCode, setAppliedCode] = useState('WELCOME10');
  const [couponDiscount, setCouponDiscount] = useState(50); // Pre-apply a 50 currency discount for Meesho feel

  // Protect route - cart requires authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/cart');
    }
  }, [status]);

  const handleCheckoutRedirect = () => {
    if (session) {
      router.push('/checkout');
    } else {
      router.push('/login?callbackUrl=/checkout');
    }
  };

  const handleUpdateQuantity = async (itemId, newQty) => {
    if (processingItemId) return;
    setProcessingItemId(itemId);
    try {
      await updateCartItem(itemId, newQty);
    } catch (err) {
      console.error('Failed to update cart item:', err);
      showToast('Could not update quantity. Please try again.', 'error');
    } finally {
      setProcessingItemId(null);
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (processingItemId) return;
    setProcessingItemId(itemId);
    try {
      await removeItemFromCart(itemId);
      showToast('Item removed from your cart.', 'info');
    } catch (err) {
      console.error('Failed to remove cart item:', err);
      showToast('Could not remove item. Please try again.', 'error');
    } finally {
      setProcessingItemId(null);
    }
  };

  const handleSaveForLater = async (itemId, productId) => {
    if (processingItemId) return;
    setProcessingItemId(itemId);
    try {
      await api.post(`/auth/wishlist/${productId}`);
      await removeItemFromCart(itemId);
      showToast('Moved to saved items wishlist!', 'success');
    } catch (err) {
      console.error('Failed to save for later:', err);
      showToast('Could not save item for later. Already in wishlist?', 'error');
    } finally {
      setProcessingItemId(null);
    }
  };

  const handleApplyCoupon = () => {
    if (!promoCode.trim()) return;
    setCouponApplied(true);
    setAppliedCode(promoCode.trim().toUpperCase());
    setCouponDiscount(50); // apply a fixed $50 discount
    showToast('Promo code applied successfully!', 'success');
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(false);
    setAppliedCode('');
    setCouponDiscount(0);
    showToast('Promo code removed.', 'info');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 flex flex-col justify-center items-center gap-3 text-sm font-bold text-gray-500 bg-[#f8f9fa] min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
        <span className="animate-pulse">Loading shopping cart details...</span>
      </div>
    );
  }

  // Calculate pricing breakdown
  const totalOriginalPrice = cartItems.reduce(
    (acc, item) => acc + (item.product?.originalPrice || item.product?.price || 0) * item.quantity,
    0
  );

  const baseDiscount = cartItems.reduce(
    (acc, item) => {
      const original = item.product?.originalPrice || item.product?.price || 0;
      const current = item.product?.price || 0;
      return acc + (original - current) * item.quantity;
    },
    0
  );

  const discountFromCoupon = couponApplied ? couponDiscount : 0;
  const totalDiscounts = baseDiscount + discountFromCoupon;
  const finalTotalAmount = Math.max(0, cartTotal - discountFromCoupon);

  if (cartItems.length === 0) {
    return (
      <div className="bg-[#f8f9fa] min-h-screen flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm">
          <div className="w-20 h-20 bg-[#fef2f2] text-pink-500 rounded-full flex items-center justify-center mx-auto shadow-sm border border-pink-100/65 animate-bounce">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-800">Your Cart is Empty</h2>
            <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto leading-relaxed">
              Add premium customizable gifts to your shopping cart to see them listed here!
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-pink-500 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer hover:opacity-95 hover:shadow-lg transition-all"
            >
              Explore Gifting Collection
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-24 lg:pb-12 text-slate-850">
      
      {/* Stepper Progress Bar (Meesho Style) */}
      <div className="bg-white border-b border-gray-200/60 py-3.5 px-4">
        <div className="max-w-md mx-auto flex items-center justify-between text-[11px] font-black text-slate-400 select-none">
          <div className="flex flex-col items-center gap-1">
            <span className="w-5 h-5 rounded-full border border-pink-500 flex items-center justify-center font-bold text-pink-500 bg-pink-50/50">1</span>
            <span className="text-pink-500 font-black">Cart</span>
          </div>
          <div className="flex-1 h-px bg-slate-200 mx-2 -mt-4" />
          <div className="flex flex-col items-center gap-1">
            <span className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center font-bold">2</span>
            <span>Address</span>
          </div>
          <div className="flex-1 h-px bg-slate-200 mx-2 -mt-4" />
          <div className="flex flex-col items-center gap-1">
            <span className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center font-bold">3</span>
            <span>Payment</span>
          </div>
          <div className="flex-1 h-px bg-slate-200 mx-2 -mt-4" />
          <div className="flex flex-col items-center gap-1">
            <span className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center font-bold">4</span>
            <span>Summary</span>
          </div>
        </div>
      </div>

      {/* Save Alert Banner */}
      <div className="max-w-7xl mx-auto px-4 pt-4 sm:px-6 lg:px-8">
        <div className="bg-[#e6f7ed] text-[#008c45] px-4 py-2.5 flex items-center gap-2 text-xs font-bold text-left rounded-xl border border-[#d4f2e1]">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-[#008c45]" />
          <span>Save 10% on your total order value by completing secure online checkout!</span>
        </div>
      </div>

      {/* Main Content Layout Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: Cart Items & Saved Actions */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Cart Listings wrapper */}
            <div className="space-y-4">
              {cartItems.map((item) => {
                const product = item.product;
                if (!product) return null;

                const isItemProcessing = processingItemId === item._id;
                const isLowStock = product.stock <= 5;

                return (
                  <div 
                    key={item._id} 
                    className={`bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm relative text-left transition-all ${
                      isItemProcessing ? 'opacity-70 pointer-events-none' : ''
                    }`}
                  >
                    {/* Item Loading Screen */}
                    {isItemProcessing && (
                      <div className="absolute inset-0 bg-white/45 backdrop-blur-[1px] flex items-center justify-center z-15">
                        <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
                      </div>
                    )}

                    {/* Card Content Row */}
                    <div className="p-4 flex gap-4">
                      {/* Product Image Thumbnail */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-55 border border-slate-100 shrink-0">
                        <img
                          src={product.images?.[0] || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Content info */}
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <Link 
                            href={`/products/${product.slug}`}
                            className="text-sm font-black text-slate-800 hover:text-pink-600 transition-colors line-clamp-1 leading-snug"
                          >
                            {product.name}
                          </Link>
                          
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item._id)}
                            disabled={isItemProcessing}
                            className="text-slate-400 hover:text-red-500 font-extrabold text-[13px] px-1 focus:outline-none shrink-0"
                            title="Remove item"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Pricing details matching Meesho layout */}
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-sm font-black text-slate-900">{formatPrice(product.price)}</span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <>
                              <span className="text-xs text-slate-400 line-through font-semibold">{formatPrice(product.originalPrice)}</span>
                              <span className="text-[10px] font-black text-pink-500">
                                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% Off
                              </span>
                            </>
                          )}
                        </div>

                        {/* Return/Courier status */}
                        <p className="text-[10px] font-bold text-slate-400">
                          Handcrafted customized checks • Quality verified
                        </p>

                        {/* Details, quantity adjust */}
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-bold text-slate-500">
                          <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] text-slate-600">
                            Qty: {item.quantity}
                          </span>
                          
                          {/* Qty increment block */}
                          <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm h-6">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item._id, Math.max(1, item.quantity - 1))}
                              disabled={isItemProcessing || item.quantity <= 1}
                              className="px-2 hover:bg-slate-50 font-black text-slate-500 transition-colors disabled:opacity-40"
                            >
                              -
                            </button>
                            <span className="px-1.5 font-bold text-[10px] text-slate-800 text-center w-5 select-none">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                              disabled={isItemProcessing || item.quantity >= product.stock}
                              className="px-2 hover:bg-slate-50 font-black text-slate-500 transition-colors disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Customization Details Sub-card */}
                    {item.customizationValues?.length > 0 && (
                      <div className="mx-4 mb-4 p-3 bg-pink-50/20 border border-dashed border-pink-100 rounded-xl space-y-1.5 text-[10px] text-slate-600">
                        <div className="flex items-center gap-1 font-bold text-indigo-700">
                          <Gift className="h-3.5 w-3.5 text-pink-500" />
                          Personalization Details:
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {item.customizationValues.map((cv, idx) => (
                            <div key={idx} className="bg-white border border-pink-50 px-2.5 py-1 rounded-lg">
                              <span className="text-slate-400 font-bold">{cv.fieldName}:</span>{' '}
                              {cv.value?.startsWith('http') ? (
                                <a href={cv.value} target="_blank" rel="noreferrer" className="text-pink-500 font-extrabold hover:underline">
                                  View attachment
                                </a>
                              ) : (
                                <span className="font-black text-slate-700">{cv.value}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer Row of Card */}
                    <div className="border-t border-slate-100 px-4 py-2.5 bg-[#fafafb] flex justify-between items-center text-[10px] font-bold text-slate-500">
                      <div className="flex items-center gap-1">
                        <span>Sold by: Evrly Partner</span>
                        {isLowStock && (
                          <span className="text-amber-600 font-extrabold bg-amber-50 px-1.5 py-0.5 rounded">
                            Only {product.stock} units left!
                          </span>
                        )}
                      </div>
                      <span className="text-emerald-600 uppercase font-extrabold">Free Delivery</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Wishlist Navigation Bar */}
            <Link
              href="/profile?tab=wishlist"
              className="bg-white border border-gray-200/80 rounded-2xl px-4 py-3 flex justify-between items-center text-xs font-bold text-slate-700 shadow-sm hover:border-pink-200 hover:text-pink-600 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Heart className="h-4.5 w-4.5 text-pink-500 shrink-0 fill-pink-50" />
                <span>Saved Wishlist Products</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>

            {/* Save for Later / Add to Wishlist Quick Actions (mimicking save actions) */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 text-left shadow-sm space-y-3.5">
              <h4 className="text-xs font-black text-slate-700">Quick saved actions</h4>
              <div className="divide-y divide-slate-50">
                {cartItems.map((item) => (
                  <div key={`sfl-${item._id}`} className="py-2.5 flex justify-between items-center text-[11px] font-bold">
                    <span className="text-slate-500 truncate max-w-[200px]">{item.product?.name}</span>
                    <button
                      type="button"
                      onClick={() => handleSaveForLater(item._id, item.product?._id)}
                      disabled={processingItemId !== null}
                      className="text-pink-500 hover:text-pink-700 flex items-center gap-1 focus:outline-none"
                    >
                      <Heart className="h-3.5 w-3.5 shrink-0" />
                      Save for Later
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Billing Pricing Detail Card & Safe Checkouts */}
          <div className="col-span-1 space-y-4">
            
            {/* Promo Code Coupon Application block */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 space-y-3 shadow-sm text-left">
              <span className="text-xs font-black text-slate-700 block">Apply Discount Code</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Coupon Code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  disabled={couponApplied}
                  className="flex-1 border border-slate-200 px-3.5 py-2 rounded-xl text-xs focus:ring-1 focus:ring-pink-500 focus:outline-none disabled:bg-slate-50 font-bold uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponApplied || !promoCode.trim()}
                  className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl text-xs hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
              
              {couponApplied && (
                <div className="flex items-center justify-between bg-pink-50/50 border border-pink-100 rounded-xl px-3 py-2.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <span className="font-extrabold text-pink-600">{appliedCode}</span> applied!
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">Extra discount: - {formatPrice(couponDiscount)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-pink-500 hover:text-pink-700 font-black shrink-0 text-[11px] focus:outline-none"
                  >
                    ✕ Remove
                  </button>
                </div>
              )}
            </div>

            {/* Billing price details block */}
            <div id="price-details-section" className="bg-white border border-gray-200/80 rounded-2xl p-5 space-y-4 shadow-sm text-left">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-50 pb-2.5">
                Price Details ({cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'})
              </h3>

              <div className="space-y-3.5 text-xs font-semibold text-slate-550">
                <div className="flex justify-between">
                  <span>Total Product Price</span>
                  <span className="font-bold text-slate-800">{formatPrice(totalOriginalPrice)}</span>
                </div>
                
                {baseDiscount > 0 && (
                  <div className="flex justify-between text-slate-550">
                    <span>Seller Discount</span>
                    <span className="font-bold text-slate-800">- {formatPrice(baseDiscount)}</span>
                  </div>
                )}

                {couponApplied && (
                  <div className="flex justify-between text-pink-600">
                    <span>Platform Coupon Discount</span>
                    <span className="font-bold">- {formatPrice(discountFromCoupon)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  {cartShipping === 0 ? (
                    <span className="font-black text-emerald-600 uppercase text-[10px] bg-emerald-50 px-2 py-0.5 rounded">Free Delivery</span>
                  ) : (
                    <span className="font-bold text-slate-800">{formatPrice(cartShipping)}</span>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-between items-baseline text-sm font-extrabold text-slate-850">
                  <span>Order Total</span>
                  <span className="text-base font-black text-slate-900">{formatPrice(finalTotalAmount)}</span>
                </div>
              </div>

              {/* Yay Discount Confirmation tag */}
              <div className="bg-[#e6f7ed] text-[#008c45] px-3.5 py-2.5 rounded-xl text-[10px] font-black flex items-center gap-1.5 justify-center border border-[#d4f2e1]">
                <CheckCircle2 className="h-4.5 w-4.5 text-[#008c45] shrink-0" />
                <span>Yay! Your total discount on this order is {formatPrice(totalDiscounts)}</span>
              </div>

              <p className="text-[10px] text-slate-400 font-bold text-center mt-2.5">
                Clicking on 'Continue' will not deduct any money
              </p>
            </div>

            {/* Desktop Action checkout button */}
            <button
              onClick={handleCheckoutRedirect}
              disabled={processingItemId !== null}
              className="w-full hidden lg:flex py-4 bg-gradient-to-r from-pink-500 to-indigo-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-pink-500/10 hover:shadow-xl hover:opacity-95 transition-all items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="h-4.5 w-4.5 shrink-0" />
              Continue to Address
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Secure Payments indicators */}
            <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4 space-y-3.5">
              <span className="text-[10px] font-black text-slate-455 uppercase tracking-wider block text-left">
                Safety Guarantee
              </span>
              <div className="grid grid-cols-1 gap-2.5 text-left text-[10px] text-slate-500 font-semibold leading-relaxed">
                <div className="flex items-center gap-2.5 bg-white px-3 py-2 rounded-xl border border-slate-100/70 shadow-sm">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                  <span>Razorpay Secure payments transaction gate.</span>
                </div>
                <div className="flex items-center gap-2.5 bg-white px-3 py-2 rounded-xl border border-slate-100/70 shadow-sm">
                  <Truck className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
                  <span>Handled by premium prompt courier dispatch.</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Fixed Sticky Mobile Continuation Footer Action (Matching Screenshot) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-250/60 p-3.5 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.06)] lg:hidden text-left">
        <div className="flex flex-col">
          <span className="text-base font-black text-slate-800">{formatPrice(finalTotalAmount)}</span>
          <button 
            type="button"
            onClick={() => {
              const el = document.getElementById('price-details-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-[10px] font-black text-pink-500 tracking-wide uppercase mt-0.5 focus:outline-none"
          >
            View Price Details
          </button>
        </div>
        <button
          onClick={handleCheckoutRedirect}
          disabled={processingItemId !== null}
          className="px-10 py-3 bg-gradient-to-r from-pink-500 to-indigo-600 text-white rounded-xl text-xs font-black shadow-md hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>

    </div>
  );
}
