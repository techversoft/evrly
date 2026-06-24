import React from 'react';

export const metadata = {
  title: 'Refund & Return Policy | CustomizedGiftStore Custom Gifting',
  description: 'Learn about our refund, returns, and cancellation policy on customized products and payment failures.',
};

export default function RefundPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 space-y-8 text-gray-700">
      
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Refund & Return Policy</h1>
        <p className="text-sm text-slate-400 font-medium">Last Updated: June 2026</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 leading-relaxed text-sm">
        
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-800">1. Personalized Gifts Exemption</h2>
          <p>
            Please note that **customized and personalized gifts (such as engraved photo frames, magic mugs, photo explosion boxes, etc.) are strictly exempt from return or refund policies**. Since these products are handcrafted with name/message details unique to your order, they cannot be restocked or resold to other customers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-800">2. Damaged or Defective Items</h2>
          <p>
            If a customized gift is delivered damaged during transit, or if the print text deviates significantly from your submitted custom criteria, please write to us at `support@techversoft.com` within **48 hours of delivery**.
          </p>
          <p>
            Please include photos showing the damaged packing and the incorrect print. Upon auditing the claim, the approved seller will dispatch a replacement item at no additional charge.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-800">3. Cancellations</h2>
          <p>
            Orders for customized items can only be cancelled within **2 hours** of placement. Once the vendor begins sublimation printing or laser engraving, cancellation requests will be rejected.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-800">4. Refund Processing</h2>
          <p>
            Approved refunds (such as order cancellations within limits or payment checkout failures) will be credited back via Razorpay to your original bank account or card within **5 to 7 working days**.
          </p>
        </section>

      </div>

    </div>
  );
}
