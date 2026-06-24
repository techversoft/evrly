'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCart } from '../../../context/CartContext';
import { useToast } from '../../../context/ToastContext';
import api from '../../../utils/api';
import { formatPrice } from '../../../utils/format';
import CustomizationForm from '../../../components/product/CustomizationForm';
import ProductCard from '../../../components/product/ProductCard';
import { Star, ShoppingBag, Truck, RotateCcw, AlertTriangle, Check, Loader2, Award, ArrowRight, ShieldCheck, Heart } from 'lucide-react';

export default function ProductDetailClient({ initialProduct, initialReviews, initialShopName, slug }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { addItemToCart } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState(initialProduct);
  const [reviews, setReviews] = useState(initialReviews || []);
  const [shopName, setShopName] = useState(initialShopName || 'Seller');
  const [loading, setLoading] = useState(!initialProduct);
  const [activeImage, setActiveImage] = useState(initialProduct?.images?.[0] || '');
  const [relatedProducts, setRelatedProducts] = useState([]);
  
  const [quantity, setQuantity] = useState(1);
  const [customizationValues, setCustomizationValues] = useState([]);
  const [addingToCart, setAddingToCart] = useState(false);

  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const [inWishlist, setInWishlist] = useState(false);
  const [nameError, setNameError] = useState('');
  const [messageError, setMessageError] = useState('');

  const checkWishlistStatus = async () => {
    if (session && product?._id) {
      try {
        const { data } = await api.get('/auth/wishlist');
        const ids = data.map(item => item._id);
        setInWishlist(ids.includes(product._id));
      } catch (err) {
        console.error('Error fetching wishlist status:', err);
      }
    }
  };

  useEffect(() => {
    checkWishlistStatus();
  }, [session, product?._id]);

  const toggleWishlist = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=/products/${slug}`);
      return;
    }
    try {
      if (inWishlist) {
        await api.delete(`/auth/wishlist/${product._id}`);
        setInWishlist(false);
        showToast('Removed from wishlist', 'info');
      } else {
        await api.post('/auth/wishlist', { productId: product._id });
        setInWishlist(true);
        showToast('Added to wishlist', 'success');
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
      showToast('Failed to update wishlist status.', 'error');
    }
  };

  const fetchProductDetails = async () => {
    try {
      if (!initialProduct) setLoading(true);
      const { data } = await api.get(`/products/${slug}`);
      setProduct(data.product);
      setReviews(data.reviews || []);
      setShopName(data.shopName || 'Gifts Seller');
      if (data.product && data.product.images?.length > 0) {
        setActiveImage(data.product.images[0]);
      }

      // Fetch related products
      if (data.product && data.product.category?.slug) {
        const { data: catData } = await api.get(`/products?category=${data.product.category.slug}&limit=5`);
        const filtered = (catData.products || []).filter(p => p._id !== data.product._id).slice(0, 4);
        setRelatedProducts(filtered);
      }
    } catch (error) {
      console.error('Error fetching product details client side:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product) return;

    if (!session) {
      router.push(`/login?callbackUrl=/products/${slug}`);
      return;
    }

    // Check if Name is required
    const isNameRequired = product.customizationFields?.some(f => 
      f.isRequired && 
      (f.fieldName.toLowerCase().includes('name') || 
       f.fieldName.toLowerCase().includes('text') || 
       f.fieldName.toLowerCase().includes('person'))
    ) || false;

    // Check if Message is required
    const isMessageRequired = product.customizationFields?.some(f => 
      f.isRequired && 
      (f.fieldName.toLowerCase().includes('message') || 
       f.fieldName.toLowerCase().includes('quote') || 
       f.fieldName.toLowerCase().includes('secret'))
    ) || false;

    const nameVal = customizationValues.find(v => v.fieldName === 'Name to be printed on gift')?.value || '';
    const messageVal = customizationValues.find(v => v.fieldName === 'Custom message')?.value || '';

    let hasError = false;
    if (isNameRequired && !nameVal.trim()) {
      setNameError('Name to be printed on gift is required.');
      hasError = true;
    } else {
      setNameError('');
    }

    if (isMessageRequired && !messageVal.trim()) {
      setMessageError('Custom message is required.');
      hasError = true;
    } else {
      setMessageError('');
    }

    if (hasError) return;

    try {
      setAddingToCart(true);
      await addItemToCart(product, quantity, customizationValues);
      showToast('Item added to cart successfully!', 'success');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      showToast('Failed to add item to cart. Please try again.', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!session) {
      router.push('/login');
      return;
    }

    try {
      setReviewSubmitLoading(true);
      setReviewError('');
      await api.post(`/products/${product._id}/reviews`, {
        rating: newRating,
        comment: newComment,
      });

      setNewComment('');
      fetchProductDetails();
    } catch (error) {
      const msg = error.response?.data?.message || 'Could not add review. Already reviewed?';
      setReviewError(msg);
    } finally {
      setReviewSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center items-center">
        <Loader2 className="h-10 w-10 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold">Product Not Found</h2>
        <button 
          onClick={() => router.push('/products')}
          className="px-6 py-2.5 bg-pink-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Shop
        </button>
      </div>
    );
  }

  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 pb-24 md:pb-8">
      
      {/* Dynamic Grid: Image list vs Details */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Side: Professional Multi-Image Gallery */}
        <div className="md:col-span-6 flex flex-col-reverse lg:flex-row gap-4">
          {/* Thumbnails Sidebar */}
          {product.images?.length > 1 && (
            <div className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-x-visible py-1 lg:w-20 w-full flex-shrink-0 scrollbar-hide">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-16 h-16 lg:w-20 lg:h-20 rounded-xl overflow-hidden border bg-white flex-shrink-0 transition-all ${
                    activeImage === img 
                      ? 'border-pink-500 ring-2 ring-pink-500/10' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main Visual Display */}
          <div className="flex-1 bg-white border border-gray-200/60 rounded-3xl overflow-hidden shadow-sm aspect-square relative">
            <img
              src={activeImage || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {discount > 0 && (
              <span className="absolute top-4 right-4 px-3 py-1 bg-emerald-50 text-xs font-black text-white rounded-lg shadow-sm">
                {discount}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Product specifications */}
        <div className="md:col-span-6 space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-[10.5px] font-bold text-slate-400">
              <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full capitalize">
                {product.category?.name}
              </span>
            </div>
            
            <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight leading-snug">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-2 pt-1">
              <div className="flex items-center text-amber-400">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.round(product.rating || 4.5) 
                          ? 'fill-amber-400 stroke-amber-400' 
                          : 'text-gray-200'
                      }`}
                    />
                  ))}
              </div>
              <span className="text-xs font-bold text-slate-600">
                {product.rating ? product.rating.toFixed(1) : '4.5'}
              </span>
              <span className="text-xs text-slate-400 font-medium">({reviews.length} customer reviews)</span>
            </div>
          </div>

          {/* Pricing tag Box */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-0.5">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Special Price</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{formatPrice(product.price)}</span>
                {product.compareAtPrice > product.price && (
                  <span className="text-sm text-slate-400 line-through font-semibold">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                )}
              </div>
            </div>
            {discount > 0 && (
              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-black rounded-xl border border-emerald-100">
                You Save {formatPrice(product.compareAtPrice - product.price)} ({discount}%)
              </span>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2 border-t border-b border-gray-100 py-4">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Gift Information</h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">{product.description}</p>
          </div>

          {/* Customization Inputs form container */}
          {product.customizationFields?.length > 0 && (
            <CustomizationForm 
              fields={product.customizationFields} 
              onChange={setCustomizationValues} 
              nameError={nameError}
              messageError={messageError}
            />
          )}

          {/* Add-to-cart operations */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center gap-4">
              {product.stock > 0 && (
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden h-12 bg-white shadow-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 hover:bg-gray-50 font-extrabold text-gray-500 text-lg transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 font-bold text-sm text-slate-800 select-none w-12 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-4 hover:bg-gray-50 font-extrabold text-gray-500 text-lg transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              )}

              {product.stock > 0 ? (
                <div className="flex-1 flex gap-2">
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="flex-grow h-12 bg-gradient-to-r from-pink-500 to-indigo-600 text-white rounded-xl shadow-lg shadow-pink-500/10 font-bold hover:opacity-95 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
                  >
                    {addingToCart ? (
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    ) : (
                      <ShoppingBag className="h-5 w-5" />
                    )}
                    Add to Cart
                  </button>
                  <button
                    onClick={toggleWishlist}
                    className={`px-4 h-12 border rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      inWishlist 
                        ? 'border-pink-500 bg-pink-50 text-pink-500 shadow-sm' 
                        : 'border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300'
                    }`}
                    title="Toggle Wishlist"
                  >
                    <Heart className={`h-5 w-5 ${inWishlist ? 'fill-pink-500' : ''}`} />
                  </button>
                </div>
              ) : (
                <div className="flex-grow flex gap-2">
                  <div className="flex-1 py-3.5 text-center border border-red-200 bg-red-50 text-red-700 text-xs font-bold rounded-xl shadow-sm flex items-center justify-center">
                    Out of Stock
                  </div>
                  <button
                    onClick={toggleWishlist}
                    className={`px-4 h-12 border rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      inWishlist 
                        ? 'border-pink-500 bg-pink-50 text-pink-500 shadow-sm' 
                        : 'border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300'
                    }`}
                    title="Toggle Wishlist"
                  >
                    <Heart className={`h-5 w-5 ${inWishlist ? 'fill-pink-500' : ''}`} />
                  </button>
                </div>
              )}
            </div>

            {/* Delivery/Shipping details */}
            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-[11px] text-slate-400 font-bold">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-indigo-500" />
                <span>Dispatch within 3 Days</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-indigo-500" />
                <span>No returns for personalized items</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Related recommendations */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-gray-100 pt-10 space-y-6">
          <div className="border-b border-gray-50 pb-3 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-pink-600 font-bold text-xs uppercase tracking-wider">
                <Award className="h-4 w-4" />
                Recommendation
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-800">You May Also Like</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {relatedProducts.map((prod) => (
              <ProductCard key={prod._id} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* Review block splits */}
      <section className="border-t border-gray-100 pt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Write Review */}
        <div className="col-span-1 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wide">Write a Review</h3>
            <p className="text-xs text-slate-400">Share your purchasing and customized experience</p>
          </div>

          {session ? (
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {reviewError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl font-bold">
                  {reviewError}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Rating Stars</label>
                <div className="flex gap-1 text-gray-200">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setNewRating(num)}
                      className="cursor-pointer transition-colors p-0.5"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          num <= newRating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Comment Details</label>
                <textarea
                  placeholder="Describe customization alignment, print details, etc..."
                  value={newComment}
                  required
                  rows={4}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-500/10 focus:border-pink-500 focus:outline-none transition-all font-medium text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={reviewSubmitLoading}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center"
              >
                {reviewSubmitLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  'Submit Review'
                )}
              </button>
            </form>
          ) : (
            <div className="p-5 border border-indigo-50 bg-indigo-50/20 text-center rounded-2xl space-y-3">
              <p className="text-xs text-slate-400 font-semibold">Please sign in to write product reviews.</p>
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-indigo-600 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Log In
              </button>
            </div>
          )}
        </div>

        {/* Right Col: Verified Comments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wide">Customer Feedback ({reviews.length})</h3>
            <p className="text-xs text-slate-400">Verified buyers rating and experience comments</p>
          </div>

          {reviews.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No reviews yet for this product. Be the first to share details!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev._id} className="p-4 bg-white border border-gray-200/60 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{rev.user?.name || 'Anonymous'}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex text-amber-400">
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                            }`}
                          />
                        ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sticky Mobile Buy Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-3 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.05)] md:hidden">
        <div className="flex flex-col">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Special Price</span>
          <span className="text-sm font-extrabold text-slate-800">{formatPrice(product.price)}</span>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={addingToCart || product.stock <= 0}
          className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-indigo-600 text-white rounded-xl text-xs font-bold hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
        >
          {addingToCart ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ShoppingBag className="h-3.5 w-3.5" />
          )}
          Buy Now
        </button>
      </div>

    </div>
  );
}
