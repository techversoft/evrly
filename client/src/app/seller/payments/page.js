'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '../../../utils/api';
import { formatPrice, formatDate } from '../../../utils/format';
import { 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  Loader2, 
  Building,
  History
} from 'lucide-react';

export default function SellerPaymentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [balance, setBalance] = useState({
    availableBalance: 0,
    pendingBalance: 0,
    withdrawnBalance: 0,
  });
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);

  // Form State
  const [amount, setAmount] = useState('');
  const [holderName, setHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/seller/payouts');
      setBalance(data.balance || { availableBalance: 0, pendingBalance: 0, withdrawnBalance: 0 });
      setPayouts(data.requests || []);
    } catch (error) {
      console.error('Error fetching payments details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (session && session.user.role !== 'seller') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      fetchPaymentDetails();
    }
  }, [session, status]);

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    const reqAmount = Number(amount);
    
    if (isNaN(reqAmount) || reqAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    if (reqAmount > balance.availableBalance) {
      alert('Insufficient available balance to withdraw.');
      return;
    }

    try {
      setRequestLoading(true);
      await api.post('/seller/payouts/request', {
        amount: reqAmount,
        bankDetails: {
          holderName,
          bankName,
          accountNo,
          ifscCode,
        }
      });

      // Clear Form
      setAmount('');
      setHolderName('');
      setBankName('');
      setAccountNo('');
      setIfscCode('');
      
      // Refresh Balance and Transactions
      await fetchPaymentDetails();
      alert('Payout request submitted successfully.');
    } catch (error) {
      console.error('Error requesting payout:', error);
      alert(error.response?.data?.message || 'Failed to submit payout request.');
    } finally {
      setRequestLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-800">
          Payouts & Earnings Portal
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Monitor your shop revenue, view earnings breakdown, and withdraw funds
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Available Balance */}
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
            <DollarSign className="h-44 w-44" />
          </div>
          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider opacity-90">Available Balance</span>
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black">{formatPrice(balance.availableBalance)}</h2>
              <p className="text-[10px] opacity-80 mt-1">Ready for instant bank transfer</p>
            </div>
          </div>
        </div>

        {/* Pending Balance */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
            <Clock className="h-44 w-44" />
          </div>
          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider opacity-90">Pending Balance</span>
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black">{formatPrice(balance.pendingBalance)}</h2>
              <p className="text-[10px] opacity-80 mt-1">Locked until orders are marked Delivered</p>
            </div>
          </div>
        </div>

        {/* Withdrawn Balance */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
            <ArrowUpRight className="h-44 w-44" />
          </div>
          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider opacity-90">Withdrawn Balance</span>
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black">{formatPrice(balance.withdrawnBalance)}</h2>
              <p className="text-[10px] opacity-80 mt-1">Total payout successfully settled</p>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Withdrawal Form */}
        <div className="lg:col-span-1 bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
            <Building className="h-5 w-5 text-pink-500" />
            <h3 className="text-sm font-extrabold text-gray-800">Request Bank Settlement</h3>
          </div>

          <form onSubmit={handleRequestPayout} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600">Withdrawal Amount (INR)</label>
              <input
                type="number"
                required
                min="1"
                placeholder="E.g., 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600">Account Holder Name</label>
              <input
                type="text"
                required
                placeholder="As per bank passbook"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600">Bank Name</label>
              <input
                type="text"
                required
                placeholder="E.g., HDFC Bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600">Bank Account Number</label>
              <input
                type="password"
                required
                placeholder="Enter account number"
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600">IFSC Code</label>
              <input
                type="text"
                required
                placeholder="E.g., HDFC0000123"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
            </div>

            <button
              type="submit"
              disabled={requestLoading || balance.availableBalance <= 0}
              className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              {requestLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  Processing request...
                </>
              ) : (
                'Submit Payout Request'
              )}
            </button>
          </form>
        </div>

        {/* Payout Requests History list */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
            <History className="h-5 w-5 text-pink-500" />
            <h3 className="text-sm font-extrabold text-gray-800">Settlement Transactions History</h3>
          </div>

          {payouts.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400 font-medium italic">
              No payout settlement history found. Request a payout to begin.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 font-extrabold text-gray-400 uppercase tracking-wider">
                    <th className="p-3 pl-4">Request Date</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Beneficiary Account</th>
                    <th className="p-3 pr-4 text-right">Fulfillment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-600 font-medium">
                  {payouts.map((po) => (
                    <tr key={po._id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="p-3 pl-4 whitespace-nowrap">{formatDate(po.createdAt)}</td>
                      <td className="p-3 font-bold text-gray-800">{formatPrice(po.amount)}</td>
                      <td className="p-3">
                        <span className="font-semibold text-gray-700 block">{po.bankDetails?.bankName}</span>
                        <span className="text-[10px] text-gray-400">A/c: ****{po.bankDetails?.accountNo?.slice(-4)}</span>
                      </td>
                      <td className="p-3 pr-4 text-right">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded capitalize ${
                          po.status === 'approved'
                            ? 'bg-green-50 text-green-700 border border-green-100'
                            : po.status === 'rejected'
                            ? 'bg-red-50 text-red-700 border border-red-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
