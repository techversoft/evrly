import React from 'react';

export const metadata = {
  title: 'Privacy Policy | CustomizedGiftStore Custom Gifting',
  description: 'Understand how CustomizedGiftStore collects, secures, and uses personal data for customized orders and payments.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 space-y-8 text-gray-700">
      
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-slate-400 font-medium">Last Updated: June 2026</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 leading-relaxed text-sm">
        
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-800">1. Information Collection</h2>
          <p>
            When you purchase customizable gifts on CustomizedGiftStore, we collect details necessary to process your order. This includes your name, email address, shipping address, phoneNumber, and personalized details (such as names, messages, or instructions to print on products).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-800">2. Processing Payments</h2>
          <p>
            Payments are processed securely using Razorpay payment gateways. CustomizedGiftStore does not store card numbers, expiry dates, or bank credentials on our servers. Razorpay handles transactional details under industry standard encryption frameworks.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-800">3. Share of Data with Sellers</h2>
          <p>
            To personalize and fulfill your orders, we share the shipping address and the custom text values (e.g. customized name engravings or message comments) with the approved seller account who lists the item. Sellers are forbidden from using this data for any marketing or out-of-order tracking purposes.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-800">4. Data Security</h2>
          <p>
            We implement standard technical safeguards, including HTTPS SSL encryption and database validation checkpoints, to protect your credentials. We limit data access to authorized systems.
          </p>
        </section>

      </div>

    </div>
  );
}
