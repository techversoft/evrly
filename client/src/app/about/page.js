import React from 'react';

export const metadata = {
  title: 'About Us | CustomizedGiftStore Personalized Surprises',
  description: 'Learn more about CustomizedGiftStore, India\'s leading marketplace for custom engravings, photo frames, mugs, and personalized surprises.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 space-y-8 text-gray-700">
      
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">About CustomizedGiftStore</h1>
        <p className="text-sm text-slate-400 font-medium max-w-xl mx-auto">
          Connecting specialized artisans with custom gifting enthusiasts across India
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 leading-relaxed text-sm">
        
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-800">Our Story</h2>
          <p>
            CustomizedGiftStore was founded with a single, clear objective: to make personalized gifting seamless, premium, and accessible. In a market flooded with generic, mass-produced items, we realized that the most memorable gifts are those carrying a unique touch—whether it is an engraved name, a customized date, or a custom secret message.
          </p>
          <p>
            We built a multi-vendor platform dedicated strictly to custom crafts. We recruit, audit, and onboarding specialized local printing hubs, laser engraving workshops, and handmade card artisans, connecting them directly with clients who want to purchase premium customized surprises.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-800">How CustomizedGiftStore Works</h2>
          <p>
            Every single product listed on our platform is customizable. During checkout, clients fill out specialized form specifications (such as names to print, anniversary dates, or instructions). Approved sellers then process these details using state-of-the-art laser engraving or high-definition sublimation printers to craft high-quality personalized items.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-800">Our Quality Guarantee</h2>
          <p>
            We hold our vendors to high operational standards. All sellers undergo strict verification, including GSTIN validation and bank audits, before they are approved to list products. This ensures that every order placed on CustomizedGiftStore is produced using top-grade materials, carefully packaged, and delivered securely using trusted logistics partners.
          </p>
        </section>

        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400 font-semibold">
          <span>Developed by Techversoft Innovations</span>
          <span>Ambala Cantt, Haryana, India</span>
        </div>

      </div>

    </div>
  );
}
