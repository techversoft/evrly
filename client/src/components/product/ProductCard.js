'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Wand2 } from 'lucide-react';
import { formatPrice } from '../../utils/format';

export default function ProductCard({ product }) {
  const { name, slug, price, compareAtPrice, images, rating, numReviews, customizationFields } = product;
  
  // Calculate discount percentage
  const discount = compareAtPrice && compareAtPrice > price
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  const isCustomizable = customizationFields && customizationFields.length > 0;

  return (
    <div className="group bg-white border border-gray-200/60 rounded-2xl overflow-hidden shadow-sm card-hover-effect flex flex-col h-full relative">
      
      {/* Customization Badge */}
      {isCustomizable && (
        <span className="absolute top-2.5 left-2.5 z-10 px-2.5 py-0.5 bg-gradient-to-r from-pink-500 to-indigo-600 text-[9px] font-extrabold text-white rounded-full flex items-center gap-1 shadow-md shadow-pink-500/10">
          <Wand2 className="h-2.5 w-2.5" />
          Customizable
        </span>
      )}

      {/* Discount Badge */}
      {discount > 0 && (
        <span className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 bg-emerald-500 text-[9px] font-extrabold text-white rounded-md shadow-sm">
          {discount}% OFF
        </span>
      )}

      {/* Product Image */}
      <Link href={`/products/${slug}`} className="block overflow-hidden bg-slate-50 aspect-square relative border-b border-gray-100">
        <img
          src={images[0] || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800'}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </Link>

      {/* Card Info */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
        
        <div className="space-y-1.5">
          {/* Rating and Reviews */}
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5 bg-amber-50 px-1 py-0.5 rounded text-amber-500 text-[9px] font-bold">
              <Star className="h-2.5 w-2.5 fill-amber-500 stroke-amber-500" />
              <span>{rating ? rating.toFixed(1) : '4.5'}</span>
            </div>
            <span className="text-[9.5px] text-slate-400 font-bold">({numReviews || 0} reviews)</span>
          </div>

          {/* Product Title - clamp at 2 lines with a minimum height to avoid shifts */}
          <h3 className="h-10 text-xs sm:text-xs font-bold text-slate-800 group-hover:text-pink-600 transition-colors line-clamp-2 leading-snug overflow-hidden">
            <Link href={`/products/${slug}`}>
              {name}
            </Link>
          </h3>
        </div>

        {/* Price & Action Button */}
        <div className="space-y-2">
          {/* Pricing */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm sm:text-base font-extrabold text-slate-900">{formatPrice(price)}</span>
            {compareAtPrice > price && (
              <span className="text-[10px] text-slate-400 line-through font-semibold">{formatPrice(compareAtPrice)}</span>
            )}
          </div>

          {/* Buy CTA */}
          <Link
            href={`/products/${slug}`}
            className="block w-full py-2 text-center text-[10.5px] font-bold text-pink-600 bg-pink-50 hover:bg-pink-100 hover:text-pink-700 transition-colors rounded-xl font-sans"
          >
            Customize & Buy
          </Link>
        </div>

      </div>

    </div>
  );
}
