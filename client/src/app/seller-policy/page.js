import React from 'react';

export const metadata = {
  title: 'Seller Policy & Merchant Standards | Evrly - Your Customized GiftStore Portal',
  description: 'Understand seller rules, GSTIN validations, product moderation criteria, and payout commission terms on Evrly - Your Customized GiftStore.',
};

export default function SellerPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 space-y-8 text-gray-700">
      
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Seller & Merchant Policy</h1>
        <p className="text-sm text-slate-400 font-medium">Last Updated: June 2026</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 leading-relaxed text-sm">
        
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-800">1. Onboarding Approval</h2>
          <p>
            Evrly - Your Customized GiftStore operates as an invite-only and heavily moderated multi-vendor portal. To register, merchants must supply a valid shop name, GSTIN (GST registration number), support coordinates, and active bank account credentials for monthly payouts. Seller accounts must be reviewed and approved by Platform Administrators before they can list product items.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-800">2. Product Listing Moderation</h2>
          <p>
            Sellers can add customized gifts under seeded categories. However, every new product listing is held in a "Pending Moderation" state. Administrator auditors review the listing title, price, custom fields builder, and product images before approving it for display on the public catalog.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-800">3. Commission splits & Fees</h2>
          <p>
            Evrly - Your Customized GiftStore charges a flat **10% platform commission fee** on the subtotal value of every item sold. The remaining 90% is logged to the seller's earnings pool.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-800">4. Payout Frequencies</h2>
          <p>
            Earnings are calculated monthly. Payouts are made directly to the seller's bank account on the **10th of every calendar month** for all orders delivered in the preceding month.
          </p>
        </section>

      </div>

    </div>
  );
}
