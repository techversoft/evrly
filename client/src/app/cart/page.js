'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/format';
import { Trash2, ShoppingBag, Wand2, Info, ArrowRight, Loader2 } from 'lucide-react';

export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const { 
    cartItems, 
    loading, 
    cartSubtotal, 
    cartShipping, 
    cartTotal, 
    updateCartItem, 
    removeItemFromCart 
  } = useCart();

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

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center items-center gap-2 text-sm font-bold text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin text-pink-500" />
        Loading shopping cart...
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-20 h-20 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-gray-800">Your Cart is Empty</h2>
          <p className="text-xs text-gray-400">
            Looks like you haven\'t added any custom gifts to your cart yet.
          </p>
        </div>
        <Link
          href="/products"
          className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer hover:opacity-95 transition-opacity"
        >
          Explore Customizable Gifts
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-xl sm:text-2xl font-black text-gray-800 border-b border-gray-100 pb-5">
        Your Shopping Cart
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">
        
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => {
            const product = item.product;
            if (!product) return null;

            return (
              <div 
                key={item._id} 
                className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 flex gap-4 sm:gap-6 shadow-sm hover:border-gray-200 transition-all"
              >
                
                {/* Product Thumbnail */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 relative border border-gray-100">
                  <img
                    src={product.images?.[0] || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start gap-4">
                      <Link 
                        href={`/products/${product.slug}`}
                        className="text-sm sm:text-base font-bold text-gray-800 hover:text-pink-600 transition-colors line-clamp-1"
                      >
                        {product.name}
                      </Link>
                      <button
                        onClick={() => removeItemFromCart(item._id)}
                        className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer p-1"
                        title="Remove product"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    <p className="text-xs font-extrabold text-gray-900">{formatPrice(product.price)}</p>
                  </div>

                  {/* Customization Details */}
                  {item.customizationValues?.length > 0 && (
                    <div className="mt-2 p-2.5 bg-gray-50 rounded-lg space-y-1 border border-gray-100 text-[10px] text-gray-600">
                      <span className="flex items-center gap-1 font-bold text-indigo-700">
                        <Wand2 className="h-3 w-3" />
                        Custom details:
                      </span>
                      {item.customizationValues.map((cv, idx) => (
                        <div key={idx} className="flex gap-1 items-start flex-wrap">
                          <span className="font-semibold text-gray-500">{cv.fieldName}:</span>
                          {cv.value?.startsWith('http') ? (
                            <a 
                              href={cv.value} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-pink-500 font-bold hover:underline"
                            >
                              View uploaded image
                            </a>
                          ) : (
                            <span className="font-bold text-gray-700">{cv.value}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Controls: Quantity */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-9 bg-white">
                      <button
                        onClick={() => updateCartItem(item._id, Math.max(1, item.quantity - 1))}
                        className="px-2.5 hover:bg-gray-50 font-extrabold text-gray-500 text-sm transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-3 font-bold text-xs text-gray-700 w-10 text-center select-none">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartItem(item._id, item.quantity + 1)}
                        className="px-2.5 hover:bg-gray-50 font-extrabold text-gray-500 text-sm transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-sm font-bold text-gray-800">
                      Total: {formatPrice(product.price * item.quantity)}
                    </span>
                  </div>

                </div>

              </div>
            );
          })}
        </div>

        {/* Cart Summary Panel */}
        <div className="col-span-1">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-6 shadow-sm sticky top-24">
            <h3 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-3">Order Summary</h3>

            {/* Calculations breakdown */}
            <div className="space-y-3.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span className="font-semibold">Subtotal</span>
                <span className="font-bold text-gray-800">{formatPrice(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Shipping Charges</span>
                <span className="font-bold text-gray-800">
                  {cartShipping === 0 ? 'FREE' : formatPrice(cartShipping)}
                </span>
              </div>
              
              {cartShipping > 0 && (
                <div className="p-2.5 bg-indigo-50/50 rounded-xl text-[10px] text-indigo-700 flex gap-2">
                  <Info className="h-4 w-4 flex-shrink-0" />
                  <span>Add {formatPrice(500 - cartSubtotal)} more to qualify for FREE shipping!</span>
                </div>
              )}

              <div className="flex justify-between border-t border-gray-50 pt-4 text-sm font-extrabold text-gray-800">
                <span>Total Amount</span>
                <span className="text-pink-600">{formatPrice(cartTotal)}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={handleCheckoutRedirect}
              className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-indigo-600 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Proceed to Checkout
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
