'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Filter, SlidersHorizontal, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import api from '../../utils/api';
import ProductCard from '../../components/product/ProductCard';
import ProductFilters from '../../components/product/ProductFilters';
import { ProductGridSkeleton } from '../../components/common/Skeleton';

function ProductCatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Read search queries and fetch
  const fetchFilteredProducts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(searchParams.toString());
      
      // Force limit of 60 items per page
      if (!queryParams.has('limit')) {
        queryParams.set('limit', '60');
      }
      
      // Merge sortBy if set
      if (!queryParams.has('sortBy')) {
        queryParams.set('sortBy', sortBy);
      }

      const { data } = await api.get(`/products?${queryParams.toString()}`);
      setProducts(data.products || []);
      setPage(data.page || 1);
      setTotalPages(data.pages || 1);
      setTotalProducts(data.total || 0);
    } catch (error) {
      console.error('Error fetching catalog products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredProducts();
  }, [searchParams, sortBy]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`/products?${params.toString()}`);
  };

  const getPageNumbers = () => {
    const pages = [];
    const delta = 2; // Pages to display before and after active page
    const left = page - delta;
    const right = page + delta + 1;
    let range = [];
    let rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i < right)) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l > 2) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    const params = new URLSearchParams(searchParams.toString());
    params.set('sortBy', e.target.value);
    params.set('page', '1'); // Reset pagination
    router.push(`/products?${params.toString()}`);
  };

  const hasActiveFilters = 
    searchParams.has('category') || 
    searchParams.has('minPrice') || 
    searchParams.has('maxPrice') || 
    searchParams.has('rating') || 
    searchParams.has('customizable') ||
    searchParams.has('keyword');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
            Explore Personalized Gifts
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Found {totalProducts} items matching your custom criteria
          </p>
        </div>

        {/* Sorting Dropdown & Mobile Filter Button */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          
          {/* Mobile Filter Trigger */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="md:hidden flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-4 w-4 text-pink-500" />
            Filters
          </button>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-white text-xs font-bold text-gray-700">
            <span className="text-gray-400 font-semibold">Sort:</span>
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="focus:outline-none bg-transparent cursor-pointer font-bold"
            >
              <option value="newest">Newest Arrival</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="popularity">Popularity</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6">
        
        {/* Desktop Sidebar Filters */}
        <div className="hidden md:block col-span-1 sticky top-[136px] self-start max-h-[calc(100vh-166px)] overflow-y-auto pr-2">
          <ProductFilters />
        </div>

        {/* Product Grid Panel */}
        <div className="col-span-1 md:col-span-3 space-y-8">
          
          {/* Active Filter Tags */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 items-center text-xs">
              <span className="text-gray-400 font-bold">Active tags:</span>
              {searchParams.get('keyword') && (
                <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-semibold">
                  Search: "{searchParams.get('keyword')}"
                </span>
              )}
              {searchParams.get('category') && (
                <span className="bg-pink-50 text-pink-700 px-2.5 py-1 rounded-full font-bold capitalize">
                  {searchParams.get('category').replace('-', ' ')}
                </span>
              )}
              {searchParams.get('customizable') === 'true' && (
                <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-bold">
                  Customizable Only
                </span>
              )}
              {searchParams.get('rating') && (
                <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-bold">
                  ★ {searchParams.get('rating')} & Up
                </span>
              )}
            </div>
          )}

          {/* Catalog Loader / Items Grid */}
          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : products.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <HelpCircle className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-800">No products found</h3>
                <p className="text-xs text-gray-400">
                  Try adjusting your filters, keyword search, or category selections.
                </p>
              </div>
              <button
                onClick={() => router.push('/products')}
                className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer hover:opacity-95 transition-opacity"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((prod) => (
                <ProductCard key={prod._id} product={prod} />
              ))}
            </div>
          )}

          {/* Pagination Controls (Ellipsis style) */}
          {totalPages > 1 && !loading && (
            <div className="flex items-center justify-center gap-1.5 pt-6 border-t border-gray-100 select-none text-xs font-bold">
              {/* Previous page button */}
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              
              {/* Page indicators */}
              {getPageNumbers().map((num, idx) => {
                if (num === '...') {
                  return (
                    <span key={idx} className="px-3 py-2 text-slate-400 font-normal">
                      ...
                    </span>
                  );
                }
                const isCurrent = num === page;
                return (
                  <button
                    key={idx}
                    onClick={() => handlePageChange(num)}
                    className={`px-3.5 py-2 border rounded-lg transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-pink-600 border-pink-600 text-white shadow-sm shadow-pink-500/10'
                        : 'border-gray-200 text-slate-600 hover:bg-gray-50'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}

              {/* Next page button */}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors flex items-center gap-1 cursor-pointer"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Mobile Sidebar Modal Overlay */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 overflow-hidden md:hidden">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl flex flex-col z-50">
            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800">Filter Selection</span>
              <button 
                onClick={() => setShowMobileFilters(false)}
                className="text-xs font-bold text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {/* Reset Router on filter apply to hide overlay */}
              <div onClick={() => setTimeout(() => setShowMobileFilters(false), 300)}>
                <ProductFilters />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function ProductCatalog() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <ProductGridSkeleton count={8} />
      </div>
    }>
      <ProductCatalogContent />
    </Suspense>
  );
}
