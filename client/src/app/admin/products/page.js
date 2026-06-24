'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '../../../utils/api';
import { formatPrice } from '../../../utils/format';
import { 
  Check, 
  X, 
  ShoppingBag, 
  ShieldCheck, 
  Wand2, 
  DollarSign, 
  Loader2 
} from 'lucide-react';

export default function AdminProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchPendingProducts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/products/pending');
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching pending products:', error);
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
      fetchPendingProducts();
    }
  }, [session, status]);

  const handleApprove = async (id, approve) => {
    try {
      setActionLoadingId(id);
      await api.put(`/admin/products/${id}/approve`, { approve });
      
      // Filter from state
      setProducts(products.filter((p) => p._id !== id));
      alert(approve ? 'Product catalog approved!' : 'Product submission rejected.');
    } catch (error) {
      console.error('Error verifying product:', error);
      alert('Action failed. Please try again.');
    } finally {
      setActionLoadingId(null);
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
        Product Moderation Pipeline
      </h1>

      {products.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center max-w-md mx-auto space-y-3.5 shadow-sm">
          <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-800 font-semibold text-green-800">No products to review</h3>
            <p className="text-xs text-gray-400">
              All seller uploads have been checked and approved!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((prod) => (
            <div 
              key={prod._id}
              className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-gray-200 transition-all"
            >
              
              <div className="space-y-4">
                
                {/* Product Detail top card */}
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                    <img src={prod.images?.[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                      <span className="capitalize">{prod.category?.name}</span>
                      <span>•</span>
                      <span>Seller: <strong className="text-gray-600 font-bold">{prod.seller?.name}</strong></span>
                    </div>
                    <h3 className="text-sm font-black text-gray-800 leading-snug line-clamp-2">{prod.name}</h3>
                    <p className="text-xs font-extrabold text-pink-600 flex items-center gap-0.5">
                      <DollarSign className="h-3.5 w-3.5" />
                      Price: {formatPrice(prod.price)}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed font-medium line-clamp-3">{prod.description}</p>

                {/* Customizations specification details preview */}
                {prod.customizationFields?.length > 0 && (
                  <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100 text-xs text-gray-600 space-y-2">
                    
                    <div className="flex items-center gap-1 font-bold text-indigo-700 text-[9px] uppercase tracking-wider">
                      <Wand2 className="h-3.5 w-3.5" />
                      Fulfillment customization Fields ({prod.customizationFields.length})
                    </div>

                    <div className="divide-y divide-gray-100 pl-1">
                      {prod.customizationFields.map((field, idx) => (
                        <div key={idx} className="py-1.5 flex justify-between items-center text-[10px] font-semibold text-gray-500">
                          <span>{field.fieldName}</span>
                          <div className="flex gap-1.5">
                            <span className="bg-white border border-gray-200 rounded px-1.5 capitalize text-[8px] font-bold">
                              {field.fieldType}
                            </span>
                            {field.isRequired && (
                              <span className="text-red-500 font-bold text-[8px]">
                                [Required]
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Approval controls */}
              <div className="flex gap-3 pt-4 border-t border-gray-50 mt-4">
                <button
                  disabled={actionLoadingId === prod._id}
                  onClick={() => handleApprove(prod._id, false)}
                  className="flex-1 py-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Reject & Delete
                </button>
                <button
                  disabled={actionLoadingId === prod._id}
                  onClick={() => handleApprove(prod._id, true)}
                  className="flex-1 py-2 bg-gradient-to-r from-pink-500 to-indigo-600 hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-55"
                >
                  {actionLoadingId === prod._id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Approve to Catalog
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
