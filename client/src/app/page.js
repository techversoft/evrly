'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gift, Heart, ShieldCheck, Truck, Sparkles, Star, ArrowRight, Award, Compass, RefreshCw, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import ProductCard from '../components/product/ProductCard';
import { ProductGridSkeleton } from '../components/common/Skeleton';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch categories and up to 12 products in parallel to distribute into rows
        const [catRes, prodRes] = await Promise.all([
          api.get('/categories'),
          api.get('/products?limit=12'),
        ]);

        setCategories(catRes.data || []);
        setProducts(prodRes.data.products || []);
      } catch (error) {
        console.error('Error fetching home page data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="pb-16 space-y-12 sm:space-y-16">

      {/* 1. Circular Discovery Category Bar (Meesho/Amazon Style) */}
      <section className="bg-white border-b border-gray-100 py-4 shadow-sm -mt-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-6 overflow-x-auto scrollbar-hide py-1">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0 animate-pulse">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-200 rounded-full" />
                  <div className="w-16 h-3 bg-gray-200 rounded" />
                </div>
              ))
            ) : (
              categories.map((cat) => (
                <Link
                  key={cat._id}
                  href={`/products?category=${cat.slug}`}
                  className="flex flex-col items-center gap-2 flex-shrink-0 group text-center cursor-pointer min-w-[80px]"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-transparent group-hover:border-pink-500 group-hover:scale-105 transition-all duration-300 shadow-sm bg-gray-50">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-700 group-hover:text-pink-600 transition-colors leading-tight">
                    {cat.name}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 2. Premium Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white py-20 px-6 sm:px-12 lg:px-16 shadow-xl -mt-12 sm:-mt-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.12),transparent_45%)]" />
        <div className="absolute -bottom-24 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-pink-300">
            <Sparkles className="h-3.5 w-3.5" />
            100% Personalization Available
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Gift Memories With{' '}
            <span className="bg-gradient-to-r from-pink-400 via-rose-300 to-indigo-300 bg-clip-text text-transparent">
              Customized Details
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed font-medium">
            Create unforgettable surprises using name engravings, custom messages, and custom instructions. Handcrafted by specialized sellers with quick delivery across India.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/products"
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-xs font-bold text-white rounded-full hover:shadow-lg hover:shadow-pink-500/20 hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              Browse Gifting Catalog
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register?role=seller"
              className="px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold text-white rounded-full transition-all cursor-pointer"
            >
              Become a Gift Vendor
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">

        {/* 3. Value Propositions Trust Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: ShieldCheck,
              title: 'Razorpay Secure Payment',
              desc: 'Transactions fully encrypted using global checkout frameworks.',
              color: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600',
            },
            {
              icon: Truck,
              title: 'Free Shipping Over ₹500',
              desc: 'Zero shipping charges on order totals above ₹500 across India.',
              color: 'from-indigo-500/10 to-indigo-500/5 text-indigo-600',
            },
            {
              icon: RefreshCw,
              title: 'Quality Verification Guarantee',
              desc: 'We audit active sellers to verify top-quality laser print engravings.',
              color: 'from-pink-500/10 to-pink-500/5 text-pink-600',
            },
          ].map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div
                key={index}
                className={`p-4 rounded-2xl bg-gradient-to-tr ${feat.color} border border-gray-100/50 flex items-start gap-4 shadow-sm`}
              >
                <div className="p-2.5 bg-white rounded-xl shadow-sm flex-shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xs font-extrabold text-gray-800">{feat.title}</h3>
                  <p className="text-[10.5px] text-gray-500 leading-normal font-semibold">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </section>

        {/* Interactive Gift Finder Quiz/Selector */}
        <section className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-1.5 text-center max-w-xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800">Visual Gift Finder</h2>
            <p className="text-xs text-slate-400">Answer 2 simple questions to find the absolute perfect custom surprise</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
            {/* Recipient Picker */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">1. Who is the gift for?</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'For Partner (Him/Her)', slug: 'personalized-mugs', desc: 'Romantic shadow lamps & customized mugs', icon: '❤️' },
                  { name: 'For Friends', slug: 'birthday-gifts', desc: 'Explosion surprise boxes & collage frames', icon: '🎉' },
                  { name: 'For Parents', slug: 'custom-frames', desc: 'Elegant custom photo frames & desk items', icon: '🏡' },
                  { name: 'For Colleagues', slug: 'corporate-gifts', desc: 'Name engraved journals & metal pens', icon: '💼' }
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    href={`/products?category=${item.slug}`}
                    className="p-4 bg-slate-50/50 hover:bg-pink-50/30 border border-slate-100 hover:border-pink-200/50 rounded-2xl text-left cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between h-28 group"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-pink-600 transition-colors leading-tight">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">{item.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Occasion Picker */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">2. What is the occasion?</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Birthday Surprise', keyword: 'birthday', desc: 'Photo frames & birthday cups', icon: '🎂' },
                  { name: 'Anniversary Celebration', keyword: 'anniversary', desc: 'Shadow lamps & couples box', icon: '💍' },
                  { name: 'Housewarming Party', keyword: 'home', desc: 'Custom keyholders & nameplates', icon: '🔑' },
                  { name: 'Corporate Events', keyword: 'office', desc: 'Engraved water bottles & diaries', icon: '🚀' }
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    href={`/products?keyword=${item.keyword}`}
                    className="p-4 bg-slate-50/50 hover:bg-indigo-50/30 border border-slate-100 hover:border-indigo-200/50 rounded-2xl text-left cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between h-28 group"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">{item.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. Showcase Row 1: Featured Products */}
        <section className="space-y-6">
          <div className="flex items-end justify-between border-b border-gray-50 pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-pink-600 font-bold text-xs uppercase tracking-wider">
                <Award className="h-4 w-4" />
                Featured Picks
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-800">Featured Gift Items</h2>
              <p className="text-xs text-gray-400">Exclusive customized combinations recommended for you</p>
            </div>
            <Link
              href="/products"
              className="text-xs font-bold text-pink-600 hover:text-pink-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              See All
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.slice(0, 4).map((prod) => (
                <ProductCard key={prod._id} product={prod} />
              ))}
            </div>
          )}
        </section>

        {/* 5. Showcase Row 2: Trending Products */}
        <section className="space-y-6">
          <div className="flex items-end justify-between border-b border-gray-50 pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-xs uppercase tracking-wider">
                <Compass className="h-4 w-4" />
                Trending Now
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-800">Trending Customized Gifts</h2>
              <p className="text-xs text-gray-400">Handpicked popular items listed by top local sellers</p>
            </div>
            <Link
              href="/products"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              Explore Trends
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.slice(4, 8).map((prod) => (
                <ProductCard key={prod._id} product={prod} />
              ))}
            </div>
          )}
        </section>

        {/* 6. Showcase Row 3: Best Sellers */}
        <section className="space-y-6">
          <div className="flex items-end justify-between border-b border-gray-50 pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs uppercase tracking-wider">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                Best Sellers
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-800">Best Sellers</h2>
              <p className="text-xs text-gray-400">Top rated laser engravings and surprise explosion cards</p>
            </div>
            <Link
              href="/products"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              View Best Sellers
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.slice(8, 12).map((prod) => (
                <ProductCard key={prod._id} product={prod} />
              ))}
            </div>
          )}
        </section>

        {/* Step-by-Step Personalization Guide */}
        <section className="bg-gradient-to-tr from-slate-900 via-slate-850 to-indigo-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl" />

          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-extrabold text-pink-300 uppercase tracking-widest">
              Simple Workflow
            </div>
            <h2 className="text-xl sm:text-2xl font-black">How Personalization Works</h2>
            <p className="text-xs text-slate-300">Four quick steps to craft a beautiful custom surprise for your loved ones</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
            {[
              {
                step: '01',
                title: 'Select a Base Gift',
                desc: 'Browse our catalog and pick from laser-engraved mugs, keychains, shadow lamps, or explosion boxes.',
                icon: '🎁'
              },
              {
                step: '02',
                title: 'Add Custom Text',
                desc: 'Enter custom name engravings, heart touching quotes, or upload personalized layout messages.',
                icon: '✍️'
              },
              {
                step: '03',
                title: 'Handcrafted by Sellers',
                desc: 'Specialized local vendors craft and check your customization detail for premium print quality.',
                icon: '🛠️'
              },
              {
                step: '04',
                title: 'Premium Secure Delivery',
                desc: 'Enjoy safe bubblewrap packing and quick doorstep courier delivery across India with full tracking.',
                icon: '🚚'
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl space-y-4 hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex justify-between items-center">
                  <span className="text-3xl">{item.icon}</span>
                  <span className="text-2xl font-black text-pink-400/30">{item.step}</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-white">{item.title}</h4>
                  <p className="text-[10px] text-slate-300 leading-relaxed font-semibold">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Categories Showcase Cards Grid */}
        <section className="space-y-6">
          <div className="border-b border-gray-50 pb-3">
            <h2 className="text-xl sm:text-2xl font-black text-gray-800">Explore Gifting Catalogs</h2>
            <p className="text-xs text-gray-400">Pick from our specially curated surprise categories</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {loading
              ? Array(6)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 aspect-[4/3] rounded-2xl" />
                ))
              : categories.map((cat) => (
                <Link
                  key={cat._id}
                  href={`/products?category=${cat.slug}`}
                  className="group relative overflow-hidden rounded-2xl bg-slate-900 aspect-square shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 group-hover:opacity-55 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-3">
                    <h3 className="text-xs font-black text-white leading-tight">
                      {cat.name}
                    </h3>
                    <p className="text-[9px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-1 mt-0.5 font-medium">
                      Shop Catalog
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </section>

        {/* 8. Testimonials Section */}
        <section className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-gray-800">What Our Customers Say</h2>
            <p className="text-xs text-gray-400">Verified reviews and comments from our custom gifting community</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Aanya Sharma',
                role: 'Verified Buyer',
                quote: 'Ordered the customized message frame. The print is high quality and engraving has clean precision!',
                rating: 5,
              },
              {
                name: 'Rohan Mehta',
                role: 'Corporate Client',
                quote: 'Requested 50 customized journals with team name tags. Delivered ahead of time in elegant gift packing.',
                rating: 5,
              },
              {
                name: 'Vikram & Sneha',
                role: 'Anniversary Gift Buyers',
                quote: 'The personalized wooden shadow lamp is a piece of art. High precision layout and beautiful lighting.',
                rating: 5,
              },
            ].map((test, i) => (
              <div key={i} className="p-5 border border-slate-50 bg-slate-50/20 rounded-2xl space-y-3">
                <div className="flex gap-0.5 text-amber-400">
                  {Array(test.rating)
                    .fill(0)
                    .map((_, idx) => (
                      <Star key={idx} className="h-3.5 w-3.5 fill-amber-400 stroke-amber-400" />
                    ))}
                </div>
                <p className="text-xs text-gray-600 italic leading-relaxed">"{test.quote}"</p>
                <div>
                  <h4 className="text-xs font-bold text-gray-800">{test.name}</h4>
                  <p className="text-[10px] text-gray-400 font-semibold">{test.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ & Newsletter Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

          {/* Interactive FAQ Accordion Section */}
          <section className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-gray-800">Frequently Asked Questions</h2>
              <p className="text-xs text-gray-400">Everything you need to know about customizing and ordering surprise gifts</p>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {[
                {
                  q: 'How long does it take to customize and dispatch an order?',
                  a: 'Most of our customized items, such as name engraving mugs and shadow lamps, require 24-48 hours to craft. The seller will package and hand over the item to the courier within 3 days of order confirmation.'
                },
                {
                  q: 'Can I request a refund if the custom engraving has an error?',
                  a: 'Personalized items cannot be returned because they are tailor-made. However, if the product arrives damaged or the customization detail differs from what you typed, our Support Team will coordinate a quick replacement or refund!'
                },
                {
                  q: 'How do I add customized photos or specific layout designs?',
                  a: 'When viewing a custom product, you can enter text instructions in the provided form. For photo uploads or advanced design requests, the seller will contact you via WhatsApp/Email shortly after you place the order.'
                },
                {
                  q: 'Is shipping free across India?',
                  a: 'Yes, shipping is completely free for all orders above ₹500. For orders below ₹500, a flat nominal delivery fee of ₹50 is added at checkout.'
                },
                {
                  q: 'Is checkout secure on Evrly - Your Customized GiftStore?',
                  a: 'Yes! We use Razorpay to process payments. All transactions are fully encrypted, securing your UPI, cards, and netbanking credentials.'
                }
              ].map((faq, idx) => (
                <div key={idx} className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300">
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between text-left font-bold text-xs sm:text-sm text-slate-800 hover:text-pink-600 transition-colors px-6 py-4.5 cursor-pointer bg-white border-0 outline-none"
                  >
                    <span>{faq.q}</span>
                    <ChevronRight
                      className={`h-4 w-4 text-slate-400 transform transition-transform duration-300 ${expandedFaq === idx ? 'rotate-90 text-pink-500' : ''
                        }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-350 ease-in-out ${expandedFaq === idx ? 'max-h-40 border-t border-slate-100/50 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                  >
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold bg-slate-50/50 px-6 py-4">
                      {faq.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Premium Newsletter Sign-up Section */}
          <section className="bg-gradient-to-br from-pink-600 via-purple-900 to-indigo-950 rounded-3xl p-6 sm:p-10 text-white text-center shadow-lg relative overflow-hidden flex flex-col justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_40%)]" />

            <div className="relative max-w-xl mx-auto space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl sm:text-3xl font-black tracking-tight">Join the Evrly - Your Customized GiftStore Elite Club</h2>
                <p className="text-xs sm:text-sm text-pink-100/90 max-w-md mx-auto leading-relaxed">
                  Subscribe to get early notifications on new custom frames, exclusive surprise box deals, and get <strong>10% OFF</strong> your first personalized order.
                </p>
              </div>

              {/* Added subscriber benefits/information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-lg mx-auto py-3 border-t border-b border-white/10 text-[10px] sm:text-xs font-bold text-pink-100/80">
                <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                  <span className="text-pink-300">✓</span> Free Custom Audits
                </div>
                <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                  <span className="text-pink-300">✓</span> Priority Dispatch
                </div>
                <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                  <span className="text-pink-300">✓</span> Vendor Deals & Coupons
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('Thank you for subscribing! Check your email for your 10% coupon code.');
                }}
                className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto bg-white/10 backdrop-blur-md p-1.5 rounded-2xl sm:rounded-full border border-white/20"
              >
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  className="flex-1 bg-transparent px-5 py-3 text-white placeholder-white/60 text-xs sm:text-sm font-medium focus:outline-none w-full border-0"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-white hover:bg-pink-50 text-slate-900 text-xs font-black rounded-xl sm:rounded-full cursor-pointer shadow-md transition-all whitespace-nowrap border-0"
                >
                  Get 10% Coupon
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}