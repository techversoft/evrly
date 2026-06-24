'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '../../../utils/api';
import { 
  Check, 
  X, 
  Store, 
  ShieldCheck, 
  CreditCard, 
  MapPin,
  Loader2,
  Percent,
  AlertTriangle,
  UserCheck,
  UserX
} from 'lucide-react';

export default function AdminSellersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  
  // Tab control
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'active'

  // Commission Rates inputs state: { [sellerId]: rate }
  const [commissions, setCommissions] = useState({});

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/sellers');
      setSellers(data || []);
      
      // Initialize commissions input states
      const commMap = {};
      data.forEach(s => {
        commMap[s._id] = s.commissionRate !== undefined ? s.commissionRate : 10;
      });
      setCommissions(commMap);
    } catch (error) {
      console.error('Error fetching sellers:', error);
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
      fetchSellers();
    }
  }, [session, status]);

  const handleApprove = async (id, approve) => {
    try {
      setActionLoadingId(id);
      await api.put(`/admin/sellers/${id}/approve`, { approve });
      
      // Refresh list
      await fetchSellers();
      alert(approve ? 'Seller verified successfully!' : 'Seller application rejected.');
    } catch (error) {
      console.error('Error verifying seller:', error);
      alert('Action failed. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleSuspend = async (id) => {
    try {
      setActionLoadingId(id);
      const { data } = await api.put(`/admin/sellers/${id}/suspend`);
      
      // Update local state
      setSellers(sellers.map(s => s._id === id ? { ...s, isSuspended: data.sellerProfile.isSuspended } : s));
      alert(data.message || 'Seller status updated.');
    } catch (error) {
      console.error('Error toggling seller suspension:', error);
      alert('Failed to update suspension status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateCommission = async (id) => {
    const rate = Number(commissions[id]);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      alert('Please enter a valid percentage between 0 and 100.');
      return;
    }

    try {
      setActionLoadingId(id);
      await api.put(`/admin/sellers/${id}/commission`, { commissionRate: rate });
      
      // Refresh list
      await fetchSellers();
      alert('Commission rate updated successfully.');
    } catch (error) {
      console.error('Error updating commission:', error);
      alert(error.response?.data?.message || 'Failed to update commission rate.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  // Filter sellers
  const pendingSellers = sellers.filter(s => !s.isApproved);
  const activeSellers = sellers.filter(s => s.isApproved);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-800">
          Vendor & Partner Administration
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Review verification requests, moderate seller status, and adjust commission schedules
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
          Verification Requests ({pendingSellers.length})
          {activeTab === 'pending' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500 rounded-full animate-fade-in" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-4 text-xs font-bold transition-all relative ${
            activeTab === 'active' 
              ? 'text-pink-600 font-extrabold' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          All Registered Sellers ({activeSellers.length})
          {activeTab === 'active' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500 rounded-full animate-fade-in" />
          )}
        </button>
      </div>

      {/* Tab Contents: Pending Requests */}
      {activeTab === 'pending' && (
        pendingSellers.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center max-w-md mx-auto space-y-3.5 shadow-sm">
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-800 font-semibold text-green-800">All caught up!</h3>
              <p className="text-xs text-gray-400">
                No pending seller validation requests.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingSellers.map((sel) => (
              <div 
                key={sel._id}
                className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-5 flex flex-col justify-between hover:border-gray-200 transition-all"
              >
                <div className="space-y-4">
                  {/* Shop details */}
                  <div className="flex gap-3">
                    <div className="p-3 bg-pink-50 text-pink-500 rounded-2xl flex-shrink-0 self-start">
                      <Store className="h-6 w-6" />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-bold text-gray-800">{sel.shopName}</h3>
                      <p className="text-[10px] text-gray-400">Applicant: {sel.user?.name} ({sel.user?.email})</p>
                      <p className="text-xs text-gray-500 pt-1 leading-normal">{sel.shopDescription}</p>
                    </div>
                  </div>

                  {/* Banking & GST details */}
                  <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100 text-xs text-gray-600 space-y-2 font-medium">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-700 text-[9px] uppercase tracking-wider">
                      <CreditCard className="h-3.5 w-3.5" />
                      Business & Bank Credentials
                    </div>
                    <div className="grid grid-cols-2 gap-2 pl-1">
                      <div>
                        <span className="text-gray-400 block text-[10px]">GSTIN Number</span>
                        <strong className="text-gray-700 font-bold">{sel.gstin || 'NOT SPECIFIED'}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Bank Holder</span>
                        <strong className="text-gray-700 font-bold truncate block">{sel.bankDetails?.holderName || 'Gifts & Co.'}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Account No</span>
                        <strong className="text-gray-700 font-bold">{sel.bankDetails?.accountNo || 'NOT SPECIFIED'}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Bank IFSC</span>
                        <strong className="text-gray-700 font-bold">{sel.bankDetails?.ifscCode || 'NOT SPECIFIED'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Address details */}
                  <div className="space-y-1.5 pl-1.5 text-xs text-gray-500 font-medium">
                    <span className="flex items-center gap-1 font-bold text-gray-700 text-[9px] uppercase tracking-wider">
                      <MapPin className="h-3.5 w-3.5" />
                      Store Address Location
                    </span>
                    <p className="pl-4">
                      {sel.address?.street}, {sel.address?.city}, {sel.address?.state} - {sel.address?.zipCode}
                    </p>
                  </div>
                </div>

                {/* Moderate CTA */}
                <div className="flex gap-3 pt-4 border-t border-gray-50 mt-4">
                  <button
                    disabled={actionLoadingId === sel._id}
                    onClick={() => handleApprove(sel._id, false)}
                    className="flex-1 py-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Deny Shop
                  </button>
                  <button
                    disabled={actionLoadingId === sel._id}
                    onClick={() => handleApprove(sel._id, true)}
                    className="flex-1 py-2 bg-gradient-to-r from-pink-500 to-indigo-600 hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-55"
                  >
                    {actionLoadingId === sel._id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Verify & Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Tab Contents: All Registered Sellers */}
      {activeTab === 'active' && (
        activeSellers.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center max-w-md mx-auto space-y-3.5 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Store className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-800 font-semibold">No approved sellers</h3>
              <p className="text-xs text-gray-400">
                Verify and approve applications under the validation tab.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 font-extrabold text-gray-400 uppercase tracking-wider">
                    <th className="p-4 pl-6">Store Details</th>
                    <th className="p-4">Seller Info</th>
                    <th className="p-4">Commission Rate (%)</th>
                    <th className="p-4">Listing Status</th>
                    <th className="p-4 pr-6 text-center">Fulfill Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-600 font-medium">
                  {activeSellers.map((sel) => (
                    <tr key={sel._id} className="hover:bg-gray-50/30 transition-colors">
                      
                      {/* Shop Column */}
                      <td className="p-4 pl-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-pink-50 text-pink-500 border border-pink-100 flex items-center justify-center flex-shrink-0">
                          <Store className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-bold text-gray-800 block">{sel.shopName}</span>
                          <span className="text-[10px] text-gray-400">GST: {sel.gstin || 'COD ONLY'}</span>
                        </div>
                      </td>

                      {/* Owner Column */}
                      <td className="p-4">
                        <span className="text-gray-800 block font-bold">{sel.user?.name}</span>
                        <span className="text-[10px] text-gray-400">{sel.user?.email}</span>
                      </td>

                      {/* Commission Column */}
                      <td className="p-4">
                        <div className="flex items-center gap-2 max-w-[140px]">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={commissions[sel._id] !== undefined ? commissions[sel._id] : ''}
                              onChange={(e) => setCommissions({ ...commissions, [sel._id]: e.target.value })}
                              className="w-full pl-3 pr-6 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                            />
                            <Percent className="h-3 w-3 text-gray-400 absolute right-2 top-2.5" />
                          </div>
                          <button
                            disabled={actionLoadingId === sel._id}
                            onClick={() => handleUpdateCommission(sel._id)}
                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="p-4">
                        {sel.isSuspended ? (
                          <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded text-[10px] font-bold flex items-center gap-0.5 w-fit">
                            <AlertTriangle className="h-3 w-3" />
                            Suspended
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-green-50 text-green-600 border border-green-100 rounded text-[10px] font-bold flex items-center gap-0.5 w-fit">
                            <ShieldCheck className="h-3 w-3" />
                            Active
                          </span>
                        )}
                      </td>

                      {/* Action Column */}
                      <td className="p-4 pr-6 text-center">
                        <button
                          disabled={actionLoadingId === sel._id}
                          onClick={() => handleToggleSuspend(sel._id)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 mx-auto ${
                            sel.isSuspended
                              ? 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
                              : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                          }`}
                        >
                          {actionLoadingId === sel._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : sel.isSuspended ? (
                            <>
                              <UserCheck className="h-3.5 w-3.5" />
                              Unsuspend Seller
                            </>
                          ) : (
                            <>
                              <UserX className="h-3.5 w-3.5" />
                              Suspend Seller
                            </>
                          )}
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

    </div>
  );
}
