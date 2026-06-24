'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, RotateCcw, Star, ChevronRight } from 'lucide-react';
import api from '../../utils/api';

export default function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [rating, setRating] = useState('');
  const [customizable, setCustomizable] = useState('');

  // Fetch categories for filter list
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        setCategories(data);
      } catch (error) {
        console.error('Error fetching filter categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Sync state with URL query parameters
  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || '');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setRating(searchParams.get('rating') || '');
    setCustomizable(searchParams.get('customizable') || '');
  }, [searchParams]);

  const applyFilters = (updates = {}) => {
    const params = new URLSearchParams(searchParams.toString());
    
    const catVal = updates.category !== undefined ? updates.category : selectedCategory;
    const minVal = updates.minPrice !== undefined ? updates.minPrice : minPrice;
    const maxVal = updates.maxPrice !== undefined ? updates.maxPrice : maxPrice;
    const rateVal = updates.rating !== undefined ? updates.rating : rating;
    const customVal = updates.customizable !== undefined ? updates.customizable : customizable;

    if (catVal) params.set('category', catVal);
    else params.delete('category');

    if (minVal) params.set('minPrice', minVal);
    else params.delete('minPrice');

    if (maxVal) params.set('maxPrice', maxVal);
    else params.delete('maxPrice');

    if (rateVal) params.set('rating', rateVal);
    else params.delete('rating');

    if (customVal) params.set('customizable', customVal);
    else params.delete('customizable');

    params.set('page', '1'); // Reset to first page
    router.push(`/products?${params.toString()}`);
  };

  const handleCategorySelect = (slug) => {
    setSelectedCategory(slug);
    applyFilters({ category: slug });
  };

  const handleCustomizableToggle = () => {
    const newVal = customizable === 'true' ? '' : 'true';
    setCustomizable(newVal);
    applyFilters({ customizable: newVal });
  };

  const handleRatingSelect = (num) => {
    const newVal = rating === String(num) ? '' : String(num);
    setRating(newVal);
    applyFilters({ rating: newVal });
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    const keyword = searchParams.get('keyword');
    if (keyword) params.set('keyword', keyword); // Preserve search text
    router.push(`/products?${params.toString()}`);
  };

  const handlePriceSubmit = (e) => {
    e.preventDefault();
    applyFilters({ minPrice, maxPrice });
  };

  return (
    <div className="bg-white border border-gray-200/60 rounded-2xl p-5 space-y-6 shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <SlidersHorizontal className="h-4 w-4 text-pink-500" />
          Filter Options
        </span>
        <button
          onClick={clearFilters}
          className="text-xs font-semibold text-slate-400 hover:text-pink-600 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
          Reset All
        </button>
      </div>

      {/* Categories */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Categories</h4>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => handleCategorySelect('')}
            className={`text-left text-xs py-2 px-3 rounded-xl transition-all ${
              selectedCategory === ''
                ? 'bg-pink-50 text-pink-600 font-bold'
                : 'text-slate-600 hover:bg-slate-50 font-semibold'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => handleCategorySelect(cat.slug)}
              className={`text-left text-xs py-2 px-3 rounded-xl transition-all ${
                selectedCategory === cat.slug
                  ? 'bg-pink-50 text-pink-600 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 font-semibold'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Customization Available */}
      <div className="space-y-2.5 pt-2 border-t border-gray-50">
        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Customizable Gifts</h4>
        <button
          onClick={handleCustomizableToggle}
          className={`w-full text-center py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
            customizable === 'true'
              ? 'bg-gradient-to-r from-pink-500 to-indigo-600 text-white border-transparent shadow-sm'
              : 'border-gray-200 text-slate-600 hover:bg-gray-50'
          }`}
        >
          Yes, Customizable
        </button>
      </div>

      {/* Price Range */}
      <div className="space-y-2.5 pt-2 border-t border-gray-50">
        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Price Range (INR)</h4>
        <form onSubmit={handlePriceSubmit} className="flex items-center gap-1.5">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full px-2.5 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-500/10 focus:border-pink-500 focus:outline-none font-medium text-slate-700"
          />
          <span className="text-gray-300 text-xs">-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full px-2.5 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-500/10 focus:border-pink-500 focus:outline-none font-medium text-slate-700"
          />
          <button
            type="submit"
            className="p-2 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-xl transition-all cursor-pointer flex items-center justify-center"
            title="Apply Price Range"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Ratings */}
      <div className="space-y-2.5 pt-2 border-t border-gray-50">
        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Minimum Rating</h4>
        <div className="flex flex-col gap-1.5">
          {[4, 3, 2].map((num) => (
            <button
              key={num}
              onClick={() => handleRatingSelect(num)}
              className={`flex items-center gap-2 text-xs py-2 px-3 rounded-xl transition-all text-left ${
                rating === String(num)
                  ? 'bg-pink-50 text-pink-600 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 font-semibold'
              }`}
            >
              <div className="flex gap-0.5 text-amber-400">
                {Array(5)
                  .fill(0)
                  .map((_, idx) => (
                    <Star
                      key={idx}
                      className={`h-3 w-3 ${idx < num ? 'fill-amber-400 stroke-amber-400' : 'text-gray-200'}`}
                    />
                  ))}
              </div>
              <span>& Up</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
