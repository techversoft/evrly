import React from 'react';
import Link from 'next/link';
import { Gift, Mail, Phone, MapPin, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Footer Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Column 1: Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg overflow-hidden bg-white flex items-center justify-center border border-gray-200/50">
                <img src="/logo.png" alt="Evrly - Your Customized GiftStore Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Evrly - Your Customized GiftStore
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India\'s premium multi-vendor custom gifting marketplace. Helping you craft personalized surprises for birthdays, anniversaries, and milestones.
            </p>
          </div>

          {/* Column 2: Categories */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Shop Categories</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/products?category=birthday-gifts" className="hover:text-pink-400 transition-colors">
                  Birthday Gifts
                </Link>
              </li>
              <li>
                <Link href="/products?category=anniversary-gifts" className="hover:text-pink-400 transition-colors">
                  Anniversary Gifts
                </Link>
              </li>
              <li>
                <Link href="/products?category=corporate-gifts" className="hover:text-pink-400 transition-colors">
                  Corporate Gifts
                </Link>
              </li>
              <li>
                <Link href="/products?category=personalized-mugs" className="hover:text-pink-400 transition-colors">
                  Personalized Mugs
                </Link>
              </li>
              <li>
                <Link href="/products?category=custom-frames" className="hover:text-pink-400 transition-colors">
                  Custom Frames
                </Link>
              </li>
              <li>
                <Link href="/products?category=surprise-boxes" className="hover:text-pink-400 transition-colors">
                  Surprise Boxes
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Seller Resources */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Vendor Center</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/register?role=seller" className="hover:text-pink-400 transition-colors">
                  Apply as Vendor
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-pink-400 transition-colors">
                  Seller Login
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-pink-400 transition-colors">
                  Gift Catalog Listings
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Techversoft Corporate Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Corporate Office</h3>
            <div className="text-xs text-slate-400 space-y-3">
              <p className="leading-relaxed">
                <strong className="text-slate-200">Techversoft Innovations</strong>, near Govt School, Khuda Khurd, Ambala Cantt, Salarheri, Haryana 133104.
              </p>
              <p className="text-[11px] text-slate-500 leading-normal">
                IT and software company providing web, mobile, UI/UX and custom software solutions.
              </p>
            </div>
            
            <ul className="space-y-2 pt-2 text-[11px] text-slate-400">
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-pink-500" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-pink-500" />
                <span>info@techversoft.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Footer Bottom Block */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500">
          <p>© {new Date().getFullYear()} Evrly - Your Customized GiftStore. Developed by Techversoft Innovations. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-pink-500 fill-pink-500" /> for customized memories
          </p>
        </div>

        {/* Legal and compliance policy routes links */}
        <div className="mt-6 pt-4 border-t border-slate-800/40 flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-2 text-[10px] text-slate-400 font-bold">
          <Link href="/about" className="hover:text-pink-400 transition-colors">About Us</Link>
          <Link href="/contact" className="hover:text-pink-400 transition-colors">Contact Us</Link>
          <Link href="/privacy" className="hover:text-pink-400 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-pink-400 transition-colors">Terms & Conditions</Link>
          <Link href="/refund" className="hover:text-pink-400 transition-colors">Refund Policy</Link>
          <Link href="/shipping" className="hover:text-pink-400 transition-colors">Shipping Policy</Link>
          <Link href="/seller-policy" className="hover:text-pink-400 transition-colors">Seller Policy</Link>
        </div>

      </div>
    </footer>
  );
}
