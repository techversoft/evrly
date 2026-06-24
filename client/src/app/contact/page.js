'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate support ticket API submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    }, 1200);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16 space-y-8 text-gray-700">
      
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Contact Customer Support</h1>
        <p className="text-sm text-slate-400 font-medium max-w-xl mx-auto">
          Have questions about order tracking, customization options, or vendor registration? Drop us a line.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
        
        {/* Left 5 Cols: Business Details */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.08),transparent_40%)]" />
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold">Business Information</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                CustomizedGiftStore is operated as a custom gifting division of Techversoft Innovations.
              </p>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="flex items-start gap-4">
                <MapPin className="h-5 w-5 text-pink-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-white font-bold">Corporate Office</p>
                  <p className="text-slate-300 leading-relaxed">
                    Techversoft Innovations, near Govt School, Khuda Khurd, Ambala Cantt, Salarheri, Haryana 133104.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Phone className="h-5 w-5 text-pink-400 flex-shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-white font-bold">Phone Number</p>
                  <p className="text-slate-300">+91 98765 43210</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Mail className="h-5 w-5 text-pink-400 flex-shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-white font-bold">Email Support</p>
                  <p className="text-slate-300">support@techversoft.com</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 text-[10px] text-slate-500 font-semibold flex gap-4">
              <span>GSTIN: Pending</span>
              <span>•</span>
              <span>CIN: Pending</span>
            </div>

          </div>
        </div>

        {/* Right 7 Cols: Interactive Form */}
        <div className="md:col-span-7">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="text-sm font-extrabold text-slate-800 border-b border-gray-50 pb-3">Send Support Request</h3>
            
            {submitted ? (
              <div className="p-6 bg-green-50 border border-green-100 rounded-2xl text-center space-y-3 animate-fade-in">
                <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-green-800">Message Submitted Successfully</h4>
                  <p className="text-xs text-green-600 font-medium">
                    We have created a support ticket. Our team will review details and reply to your email within 24 hours.
                  </p>
                </div>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Order cancellation help"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Message details</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide details about your query..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-indigo-600 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {loading ? 'Sending Request...' : 'Send Message'}
                </button>

              </form>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
