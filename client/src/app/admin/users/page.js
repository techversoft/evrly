'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '../../../utils/api';
import { formatDate } from '../../../utils/format';
import { Users, User, Shield, ShieldAlert, Loader2, ArrowLeft } from 'lucide-react';

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/users');
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
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
      fetchUsers();
    }
  }, [session, status]);

  const handleRoleChange = async (userId, newRole) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    
    try {
      setActionLoadingId(userId);
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      
      // Update local state
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      alert('User role updated successfully.');
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update role. Please try again.');
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header and Back Link */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => router.push('/admin/dashboard')}
          className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-500 cursor-pointer"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-800">
            Registered Users Management
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Total {users.length} accounts registered on the platform
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 font-extrabold text-gray-400 uppercase tracking-wider">
                <th className="p-4 pl-6">User Account</th>
                <th className="p-4">Email ID</th>
                <th className="p-4">Role Badge</th>
                <th className="p-4">Registered Date</th>
                <th className="p-4 pr-6 text-center">Change Role Control</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50 text-gray-600 font-medium">
              {users.map((user) => {
                const isCurrentUser = session?.user?.id === user._id;

                return (
                  <tr key={user._id} className="hover:bg-gray-50/20 transition-colors">
                    
                    <td className="p-4 pl-6 flex items-center gap-3">
                      <div className={`p-2 rounded-xl border flex-shrink-0 ${
                        user.role === 'admin' 
                          ? 'bg-red-50 text-red-500 border-red-100/50' 
                          : user.role === 'seller'
                          ? 'bg-indigo-50 text-indigo-500 border-indigo-100/50'
                          : 'bg-slate-50 text-slate-500 border-slate-100/50'
                      }`}>
                        {user.role === 'admin' ? (
                          <ShieldAlert className="h-4 w-4" />
                        ) : user.role === 'seller' ? (
                          <Shield className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-gray-800 block">{user.name}</span>
                        {isCurrentUser && (
                          <span className="text-[9px] text-pink-600 font-extrabold">(You)</span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 font-mono">{user.email}</td>

                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                        user.role === 'admin'
                          ? 'bg-red-50 text-red-700'
                          : user.role === 'seller'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>

                    <td className="p-4">{formatDate(user.createdAt)}</td>

                    <td className="p-4 pr-6 text-center">
                      <select
                        disabled={isCurrentUser || actionLoadingId === user._id}
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className="text-xs font-bold border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer disabled:opacity-40"
                      >
                        <option value="customer">Customer</option>
                        <option value="seller">Seller</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>

                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>
      </div>

    </div>
  );
}
