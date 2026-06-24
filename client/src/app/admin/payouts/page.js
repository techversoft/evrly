'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '../../../utils/api';
import { formatPrice, formatDate } from '../../../utils/format';
import { 
  Building, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Copy,
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function AdminPayoutsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Modal / Input State for approval
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [referenceId, setReferenceId] = useState('');
  
  // Filter Tabs
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'rejected'

  const fetchPayoutRequests = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/payouts');
      setPayouts(data || []);
    } catch (error) {
      console.error('Error fetching admin payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (session && session.user.role !== 'admin') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      fetchPayoutRequests();
    }
  }, [session, status]);

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPayout) return;

    try {
      setActionLoadingId(selectedPayout._id);
      await api.put(`/admin/payouts/${selectedPayout._id}/approve`, {
        referenceId: referenceId.trim() || undefined
      });

      setSelectedPayout(null);
      setReferenceId('');
      await fetchPayoutRequests();
      alert('Payout request approved and settled!');
    } catch (error) {
      console.error('Failed to approve payout request:', error);
      alert('Approval failed. Please check balance or try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    if (!confirm('Are you sure you want to REJECT this payout request? Funds will be returned to the seller\'s available balance.')) return;

    try {
      setActionLoadingId(id);
      await api.put(`/admin/payouts/${id}/reject`);
      await fetchPayoutRequests();
      alert('Payout request rejected. Funds reverted.');
    } catch (error) {
      console.error('Failed to reject payout request:', error);
      alert('Rejection failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCopyText = (text, label) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  // Filter lists based on status
  const filteredPayouts = payouts.filter(p => p.status === activeTab);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-800">
          Seller Settlement Payouts
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Approve manual bank transfer payouts and logs transfer references.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 gap-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-4 text-xs font-bold transition-all relative ${
            activeTab === 'pending' 
              ? 'text-pink-600 font-extrabold' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Pending Review ({payouts.filter(p => p.status === 'pending').length})
          {activeTab === 'pending' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500 rounded-full animate-fade-in" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`pb-4 text-xs font-bold transition-all relative ${
            activeTab === 'approved' 
              ? 'text-pink-600 font-extrabold' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Settled / Approved ({payouts.filter(p => p.status === 'approved').length})
          {activeTab === 'approved' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500 rounded-full animate-fade-in" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={`pb-4 text-xs font-bold transition-all relative ${
            activeTab === 'rejected' 
              ? 'text-pink-600 font-extrabold' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Rejected / Cancelled ({payouts.filter(p => p.status === 'rejected').length})
          {activeTab === 'rejected' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500 rounded-full animate-fade-in" />
          )}
        </button>
      </div>

      {/* Requests Listings Grid */}
      {filteredPayouts.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center max-w-md mx-auto space-y-3.5 shadow-sm">
          <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Building className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-800 font-semibold">No payout records</h3>
            <p className="text-xs text-gray-400">
              No withdrawal requests matching status "{activeTab}" were found.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPayouts.map((po) => (
            <div 
              key={po._id}
              className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-5 flex flex-col justify-between hover:border-gray-200 transition-all text-left"
            >
              <div className="space-y-4">
                
                {/* Header: Amount & Date */}
                <div className="flex justify-between items-start gap-2 border-b border-gray-50 pb-3">
                  <div>
                    <h3 className="text-lg font-black text-gray-800">{formatPrice(po.amount)}</h3>
                    <p className="text-[10px] text-gray-400 font-semibold">Requested: {formatDate(po.createdAt)}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-[9px] font-extrabold rounded-full uppercase ${
                    po.status === 'approved'
                      ? 'bg-green-50 text-green-700'
                      : po.status === 'rejected'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {po.status}
                  </span>
                </div>

                {/* Seller info */}
                <div className="space-y-1 text-xs text-gray-600 font-medium">
                  <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Beneficiary Vendor</span>
                  <p className="font-extrabold text-gray-800">{po.seller?.name || 'Seller User'}</p>
                  <p className="text-[10px] text-gray-400">{po.seller?.email}</p>
                </div>

                {/* Bank Details copy paste helper */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 text-xs">
                  <div className="flex items-center gap-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <Building className="h-3.5 w-3.5 text-slate-400" />
                    Bank Transfer Credentials
                  </div>

                  <div className="space-y-2 pl-1 font-medium">
                    <div className="flex justify-between items-center gap-2">
                      <div>
                        <span className="text-[10px] text-gray-400 block">Bank Name</span>
                        <strong className="text-slate-800 font-bold">{po.bankDetails?.bankName}</strong>
                      </div>
                      <button 
                        onClick={() => handleCopyText(po.bankDetails?.bankName, 'Bank Name')}
                        className="p-1 text-gray-400 hover:text-indigo-600 cursor-pointer"
                        title="Copy bank name"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      <div>
                        <span className="text-[10px] text-gray-400 block">Account Holder Name</span>
                        <strong className="text-slate-800 font-bold">{po.bankDetails?.holderName}</strong>
                      </div>
                      <button 
                        onClick={() => handleCopyText(po.bankDetails?.holderName, 'Holder Name')}
                        className="p-1 text-gray-400 hover:text-indigo-600 cursor-pointer"
                        title="Copy holder name"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      <div>
                        <span className="text-[10px] text-gray-400 block">Account Number</span>
                        <strong className="text-slate-800 font-extrabold">{po.bankDetails?.accountNo}</strong>
                      </div>
                      <button 
                        onClick={() => handleCopyText(po.bankDetails?.accountNo, 'Account Number')}
                        className="p-1 text-gray-400 hover:text-indigo-600 cursor-pointer"
                        title="Copy account no"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      <div>
                        <span className="text-[10px] text-gray-400 block">IFSC Code</span>
                        <strong className="text-slate-800 font-extrabold">{po.bankDetails?.ifscCode}</strong>
                      </div>
                      <button 
                        onClick={() => handleCopyText(po.bankDetails?.ifscCode, 'IFSC Code')}
                        className="p-1 text-gray-400 hover:text-indigo-600 cursor-pointer"
                        title="Copy IFSC code"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>

                  </div>
                </div>

              </div>

              {/* Moderate CTA */}
              {po.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-gray-50 mt-4">
                  <button
                    disabled={actionLoadingId === po._id}
                    onClick={() => handleReject(po._id)}
                    className="flex-1 py-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Request
                  </button>
                  <button
                    disabled={actionLoadingId === po._id}
                    onClick={() => setSelectedPayout(po)}
                    className="flex-1 py-2 bg-gradient-to-r from-pink-500 to-indigo-600 hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-55"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve Settlement
                  </button>
                </div>
              )}

            </div>
          ))}
        </div>
      )}

      {/* Approval dialog (collect referenceId) */}
      {selectedPayout && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleApproveSubmit}
            className="bg-white rounded-3xl border border-pink-100 max-w-md w-full p-6 shadow-2xl space-y-5 animate-fade-in text-left"
          >
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-xs font-extrabold text-gray-800">Confirm Bank Transfer</h3>
              <button 
                type="button"
                onClick={() => { setSelectedPayout(null); setReferenceId(''); }} 
                className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-3.5 bg-yellow-50 text-yellow-800 rounded-2xl flex gap-2.5 items-start text-xs border border-yellow-100 shadow-sm leading-relaxed">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <div>
                <strong className="font-bold">Manual Settlement Required!</strong>
                <p className="text-[10px] text-yellow-600 mt-0.5 font-medium">
                  Please execute a bank transfer of <strong className="text-yellow-800 font-bold">{formatPrice(selectedPayout.amount)}</strong> using the beneficiary details. Once sent, register the transaction reference/UTR code below.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600">Bank Reference / UTR Number</label>
              <input
                type="text"
                placeholder="E.g., UTR128793781298"
                required
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
              <span className="text-[10px] text-gray-400 font-semibold leading-normal block">
                This transaction ID will be shared with the seller as proof of settlement.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-50">
              <button
                type="button"
                onClick={() => { setSelectedPayout(null); setReferenceId(''); }}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoadingId === selectedPayout._id}
                className="px-5 py-2 bg-gradient-to-r from-pink-500 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-md hover:opacity-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {actionLoadingId === selectedPayout._id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Mark as Settled'
                )}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
