import React from 'react';

export const metadata = {
  title: 'Shipping & Delivery Policy | CustomizedGiftStore Customized Gifts',
  description: 'Understand shipping fees, transit timelines, and delivery coordinates across India for personalized items.',
};

export default function ShippingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 space-y-8 text-gray-700">
      
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Shipping & Delivery Policy</h1>
        <p className="text-sm text-slate-400 font-medium">Last Updated: June 2026</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 leading-relaxed text-sm">
        
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-800">1. Production & Dispatch Window</h2>
          <p>
            Because customized gifts require individual printing, sublimation, or wood carving, they do not ship instantly. The standard vendor preparation and dispatch window is **3 working days** from payment receipt.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-800">2. Delivery Timelines</h2>
          <p>
            Once dispatched, the package is handed over to our delivery partners (such as Delhivery, Blue Dart, or India Post). Transit times vary by coordinate:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>**Metro Cities**: 3 to 5 working days</li>
            <li>**Rest of India**: 5 to 7 working days</li>
            <li>**Remote Locations**: Up to 10 working days</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-800">3. Shipping Fees</h2>
          <p>
            We offer **free standard shipping on all orders with a total cart value above ₹500** across India. For orders below ₹500, a flat shipping charge of **₹50** is added during checkout.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-800">4. Shipping Tracking</h2>
          <p>
            Once your order is marked as shipped by the seller, a tracking URL and tracking ID will be sent to your registered email address and updated in your customer orders dashboard list.
          </p>
        </section>

      </div>

    </div>
  );
}
