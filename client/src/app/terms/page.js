import React from 'react';

export const metadata = {
  title: 'Terms & Conditions | Evrly - Your Customized GiftStore Marketplace',
  description: 'Read the terms of use for buying and selling customized gifts on the Evrly - Your Customized GiftStore platform.',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 space-y-8 text-gray-700">
      
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Terms & Conditions</h1>
        <p className="text-sm text-slate-400 font-medium">Last Updated: June 2026</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 leading-relaxed text-sm">
        
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-800">1. Acceptance of Terms</h2>
          <p>
            By accessing or placing an order on Evrly - Your Customized GiftStore, you agree to comply with and be bound by these Terms and Conditions. These terms govern the relation between buyers, vendors (sellers), and Evrly - Your Customized GiftStore (operated by Techversoft Innovations).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-800">2. Customizations Accuracy</h2>
          <p>
            The buyer is solely responsible for verifying the accuracy of all customization inputs (such as spelling of names, dates, or messages) before adding products to the cart. Once order processing begins, customized details cannot be modified. Sellers are not responsible for typographical errors submitted by buyers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-800">3. Vendor Obligations</h2>
          <p>
            Artisans and sellers must list genuine, high-resolution product photos showing their custom work. Under no circumstances are sellers allowed to fulfill products that differ significantly in quality or materials from the listed catalog display.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-800">4. Limitation of Liability</h2>
          <p>
            Evrly - Your Customized GiftStore provides a multi-vendor platform marketplace and coordinates processing, but is not directly liable for packaging delays or courier failures by logistics partners, though we will assist in resolving disputes.
          </p>
        </section>

      </div>

    </div>
  );
}
