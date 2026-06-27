'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '../../utils/api';
import { formatPrice } from '../../utils/format';
import { 
  User, 
  MapPin, 
  Heart, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  Lock, 
  Phone, 
  Mail, 
  Loader2, 
  ShoppingBag, 
  CheckCircle,
  X
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  // Tab State
  const [activeTab, setActiveTab] = useState('profile'); // profile | addresses | wishlist

  // Profile Form State
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  // Addresses State
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  
  // Address Form State
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    isDefault: false
  });

  // Wishlist State
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Protect page
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/profile');
    }
  }, [status]);

  // Load Initial Profile Form Values
  useEffect(() => {
    if (session?.user) {
      setProfileName(session.user.name || '');
      setProfileEmail(session.user.email || '');
      setProfilePhone(session.user.phoneNumber || '');
    }
  }, [session]);

  // Fetch data depending on active tab
  useEffect(() => {
    if (status === 'authenticated') {
      if (activeTab === 'addresses') {
        fetchAddresses();
      } else if (activeTab === 'wishlist') {
        fetchWishlist();
      }
    }
  }, [activeTab, status]);

  // Fetch User Addresses
  const fetchAddresses = async () => {
    try {
      if (addresses.length === 0) {
        setAddressesLoading(true);
      }
      const { data } = await api.get('/auth/addresses');
      setAddresses(data);
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setAddressesLoading(false);
    }
  };

  // Fetch Wishlist Items
  const fetchWishlist = async () => {
    try {
      if (wishlist.length === 0) {
        setWishlistLoading(true);
      }
      const { data } = await api.get('/auth/wishlist');
      setWishlist(data);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  // Submit Profile Form
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });
    setProfileLoading(true);

    try {
      const payload = {
        name: profileName,
        email: profileEmail,
        phoneNumber: profilePhone,
      };
      if (profilePassword.trim()) {
        payload.password = profilePassword;
      }

      const { data } = await api.put('/auth/profile', payload);

      // Trigger NextAuth session update
      await update({
        ...session,
        user: {
          ...session.user,
          name: data.name,
          email: data.email,
          phoneNumber: data.phoneNumber
        }
      });

      setProfilePassword('');
      setProfileMessage({ type: 'success', text: 'Profile details updated successfully.' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile details.';
      setProfileMessage({ type: 'error', text: msg });
    } finally {
      setProfileLoading(false);
    }
  };

  // Submit Address Form (Add / Edit)
  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAddressId) {
        // Edit address
        const { data } = await api.put(`/auth/addresses/${editingAddressId}`, addressForm);
        setAddresses(data);
      } else {
        // Add new address
        const { data } = await api.post('/auth/addresses', addressForm);
        setAddresses(data);
      }
      setShowAddressModal(false);
      resetAddressForm();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save address details.');
    }
  };

  // Delete User Address
  const handleDeleteAddress = async (addressId) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      const { data } = await api.delete(`/auth/addresses/${addressId}`);
      setAddresses(data);
    } catch (err) {
      alert('Failed to delete address.');
    }
  };

  // Open Edit Address Modal
  const openEditAddressModal = (addr) => {
    setEditingAddressId(addr._id);
    setAddressForm({
      name: addr.name,
      phone: addr.phone,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      isDefault: addr.isDefault
    });
    setShowAddressModal(true);
  };

  // Toggle Default status
  const handleSetDefaultAddress = async (addr) => {
    try {
      const { data } = await api.put(`/auth/addresses/${addr._id}`, {
        ...addr,
        isDefault: true
      });
      setAddresses(data);
    } catch (err) {
      alert('Failed to update default address setting.');
    }
  };

  // Reset Address Form
  const resetAddressForm = () => {
    setEditingAddressId(null);
    setAddressForm({
      name: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      isDefault: false
    });
  };

  // Remove Item from Wishlist
  const handleRemoveWishlist = async (productId) => {
    try {
      await api.delete(`/auth/wishlist/${productId}`);
      setWishlist(wishlist.filter(item => item._id !== productId));
    } catch (err) {
      alert('Failed to remove item from wishlist.');
    }
  };

  if (status === 'loading') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Side: Sidebar navigation */}
        <div className="w-full md:w-64 bg-white border border-gray-100 rounded-3xl p-5 shadow-sm h-fit space-y-6">
          <div className="text-center space-y-2 border-b border-gray-50 pb-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-600 text-white flex items-center justify-center text-xl font-bold mx-auto shadow-md">
              {session?.user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-gray-800">{session?.user?.name}</h2>
              <p className="text-[10px] text-gray-400 font-semibold">{session?.user?.email}</p>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {[
              { id: 'profile', label: 'My Profile', icon: User },
              { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
              { id: 'wishlist', label: 'My Wishlist', icon: Heart }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-pink-500/10 to-indigo-600/5 text-pink-600 shadow-sm border-l-4 border-pink-500'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Side: Tab Contents */}
        <div className="flex-grow bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          
          {/* Tab 1: Profile Management */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="border-b border-gray-50 pb-3">
                <h3 className="text-base font-extrabold text-gray-800">Profile Specifications</h3>
                <p className="text-xs text-gray-400">Keep your personal contact details up to date</p>
              </div>

              {profileMessage.text && (
                <div className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  profileMessage.type === 'success' 
                    ? 'bg-green-50 border-green-100 text-green-700' 
                    : 'bg-red-50 border-red-100 text-red-700'
                }`}>
                  <CheckCircle className="h-4.5 w-4.5" />
                  {profileMessage.text}
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-xl">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="Your Full Name"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="10-digit number"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Update Password (Leave blank to keep current)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
                >
                  {profileLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Tab 2: Saved Addresses */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="border-b border-gray-50 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-extrabold text-gray-800">Saved Addresses</h3>
                  <p className="text-xs text-gray-400">Manage multiple billing and delivery addresses</p>
                </div>
                <button
                  onClick={() => { resetAddressForm(); setShowAddressModal(true); }}
                  className="px-4 py-2 border border-pink-500 text-pink-600 hover:bg-pink-50/50 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Add Address
                </button>
              </div>

              {addressesLoading ? (
                <div className="py-12 flex justify-center items-center">
                  <Loader2 className="h-7 w-7 animate-spin text-pink-500" />
                </div>
              ) : addresses.length === 0 ? (
                <div className="p-12 text-center text-xs text-gray-400 italic">
                  No saved addresses found. Add an address to simplify your checkout.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div 
                      key={addr._id} 
                      className={`p-4 border rounded-2xl flex flex-col justify-between space-y-4 shadow-sm relative transition-all hover:border-gray-300 ${
                        addr.isDefault ? 'border-pink-500 bg-pink-50/5/10' : 'border-gray-100'
                      }`}
                    >
                      <div className="space-y-1.5 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-gray-800">{addr.name}</p>
                          {addr.isDefault && (
                            <span className="px-2 py-0.5 bg-pink-100 text-[9px] font-bold text-pink-700 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="font-semibold">{addr.phone}</p>
                        <p className="leading-relaxed font-medium">
                          {addr.street}, {addr.city}, {addr.state} - {addr.zipCode}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 border-t border-gray-50 pt-3">
                        <button
                          onClick={() => openEditAddressModal(addr)}
                          className="text-[10px] font-bold text-gray-500 hover:text-pink-600 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr._id)}
                          className="text-[10px] font-bold text-gray-500 hover:text-red-500 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                        {!addr.isDefault && (
                          <button
                            onClick={() => handleSetDefaultAddress(addr)}
                            className="text-[10px] font-bold text-indigo-600 hover:underline ml-auto cursor-pointer"
                          >
                            Set Default
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Wishlist */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              <div className="border-b border-gray-50 pb-3">
                <h3 className="text-base font-extrabold text-gray-800">My Wishlist</h3>
                <p className="text-xs text-gray-400">Items you have saved to buy later</p>
              </div>

              {wishlistLoading ? (
                <div className="py-12 flex justify-center items-center">
                  <Loader2 className="h-7 w-7 animate-spin text-pink-500" />
                </div>
              ) : wishlist.length === 0 ? (
                <div className="p-12 text-center text-xs text-gray-400 italic">
                  Your wishlist is empty. Add items from the shop pages!
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {wishlist.map((prod) => (
                    <div 
                      key={prod._id} 
                      className="bg-white border border-gray-100 hover:border-pink-200/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group relative"
                    >
                      {/* Image */}
                      <Link href={`/products/${prod.slug}`} className="block aspect-square relative bg-gray-50 overflow-hidden">
                        <img 
                          src={prod.images?.[0]} 
                          alt={prod.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>

                      {/* Detail */}
                      <div className="p-3 flex-grow flex flex-col justify-between space-y-2">
                        <Link 
                          href={`/products/${prod.slug}`}
                          className="text-xs font-bold text-gray-800 hover:text-pink-600 transition-colors line-clamp-1 block"
                        >
                          {prod.name}
                        </Link>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-extrabold text-pink-600">{formatPrice(prod.price)}</span>
                          <button
                            onClick={() => handleRemoveWishlist(prod._id)}
                            className="text-gray-400 hover:text-red-500 cursor-pointer p-1"
                            title="Remove from wishlist"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Address Book Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-100 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-fade-in">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-extrabold text-gray-800">
                {editingAddressId ? 'Edit Saved Address' : 'Add New Address'}
              </h3>
              <button 
                onClick={() => setShowAddressModal(false)}
                className="p-1 border border-gray-100 hover:bg-gray-100 text-gray-400 rounded-lg cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddressSubmit} className="p-5 space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600">Receiver Name</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., John Doe"
                  value={addressForm.name}
                  onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit phone"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Zip Code / Pincode</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., 400001"
                    value={addressForm.zipCode}
                    onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600">Street Address & Landmark</label>
                <input
                  type="text"
                  required
                  placeholder="Flat details, street name, layout"
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">City</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Delhi"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">State</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Maharashtra"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2 select-none">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="rounded text-pink-500 focus:ring-0 cursor-pointer h-4 w-4"
                />
                <span className="text-[11px] font-bold text-gray-600">Set as default delivery address</span>
              </label>

              {/* Submit CTA */}
              <div className="flex gap-3 justify-end pt-3 border-t border-gray-50 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-pink-500 to-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md"
                >
                  Save Address
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
