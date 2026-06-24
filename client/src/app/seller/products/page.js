'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '../../../utils/api';
import { formatPrice } from '../../../utils/format';
import { 
  PlusCircle, 
  Trash2, 
  Wand2, 
  CheckCircle, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Loader2,
  Edit
} from 'lucide-react';

export default function SellerProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isApproved, setIsApproved] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Toggle form
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Editing Product State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCompareAtPrice, setEditCompareAtPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editCustomizationFields, setEditCustomizationFields] = useState([]);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editSubmitLoading, setEditSubmitLoading] = useState(false);

  // New Product Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState([]); // File objects
  
  // Customization builder state
  const [customizationFields, setCustomizationFields] = useState([]);

  const fetchSellerProducts = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.get('/seller/products'),
        api.get('/categories'),
      ]);
      setProducts(prodRes.data.products || []);
      setIsApproved(prodRes.data.isApproved !== undefined ? prodRes.data.isApproved : true);
      setCategories(catRes.data || []);
      if (catRes.data?.length > 0) {
        setCategory(catRes.data[0]._id); // Default select first category
      }
    } catch (error) {
      console.error('Error loading seller inventory data:', error);
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
      fetchSellerProducts();
    }
  }, [session, status]);

  const handleAddField = () => {
    setCustomizationFields([
      ...customizationFields,
      { fieldName: '', fieldType: 'text', isRequired: true, placeholder: '' },
    ]);
  };

  const handleRemoveField = (idx) => {
    setCustomizationFields(customizationFields.filter((_, i) => i !== idx));
  };

  const handleFieldChange = (idx, key, val) => {
    const updated = [...customizationFields];
    updated[idx][key] = val;
    setCustomizationFields(updated);
  };

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const handleEditClick = (prod) => {
    setEditingProduct(prod);
    setEditName(prod.name);
    setEditDescription(prod.description);
    setEditPrice(prod.price);
    setEditCompareAtPrice(prod.compareAtPrice || '');
    setEditStock(prod.stock);
    setEditCategory(prod.category?._id || prod.category || '');
    setEditCustomizationFields(prod.customizationFields || []);
    setEditIsActive(prod.isActive !== undefined ? prod.isActive : true);
  };

  const handleAddEditField = () => {
    setEditCustomizationFields([
      ...editCustomizationFields,
      { fieldName: '', fieldType: 'text', isRequired: true, placeholder: '' },
    ]);
  };

  const handleRemoveEditField = (idx) => {
    setEditCustomizationFields(editCustomizationFields.filter((_, i) => i !== idx));
  };

  const handleEditFieldChange = (idx, key, val) => {
    const updated = [...editCustomizationFields];
    updated[idx][key] = val;
    setEditCustomizationFields(updated);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSubmitLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', editName);
      formData.append('description', editDescription);
      formData.append('price', editPrice);
      formData.append('compareAtPrice', editCompareAtPrice);
      formData.append('stock', editStock);
      formData.append('category', editCategory);
      formData.append('customizationFields', JSON.stringify(editCustomizationFields));
      formData.append('isActive', editIsActive);

      await api.put(`/products/${editingProduct._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setEditingProduct(null);
      fetchSellerProducts();
      alert('Product updated successfully!');
    } catch (error) {
      console.error('Failed to update product:', error);
      alert(error.response?.data?.message || 'Error updating product.');
    } finally {
      setEditSubmitLoading(false);
    }
  };

  const handleDeleteProduct = async (prodId) => {
    if (!confirm('Are you sure you want to delete this product listing?')) return;
    try {
      await api.delete(`/products/${prodId}`);
      setProducts(products.filter((p) => p._id !== prodId));
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', price);
      if (compareAtPrice) formData.append('compareAtPrice', compareAtPrice);
      formData.append('stock', stock);
      formData.append('categoryName', category); // category ID passed
      formData.append('customizationFields', JSON.stringify(customizationFields));

      // Append image files
      images.forEach((file) => {
        formData.append('images', file);
      });

      await api.post('/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Clear states
      setName('');
      setDescription('');
      setPrice('');
      setCompareAtPrice('');
      setStock('');
      setImages([]);
      setCustomizationFields([]);
      setShowAddForm(false);

      // Refresh list
      fetchSellerProducts();
      alert('Product created successfully! Pending admin approval.');
    } catch (error) {
      console.error('Failed to upload product:', error);
      alert(error.response?.data?.message || 'Error submitting product listing.');
    } finally {
      setSubmitLoading(false);
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
      
      {/* Verification Warning Alert */}
      {!isApproved && (
        <div className="p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl flex gap-3 items-start shadow-sm">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-extrabold text-amber-800">Listing Blocked: Verification Pending</h4>
            <p className="text-[10px] text-amber-600 leading-normal mt-0.5">
              Your seller shop verification is currently pending admin approval. You will be able to list new customized gifts on the public marketplace once your account is fully verified.
            </p>
          </div>
        </div>
      )}

      {/* Page Title & Add action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-800">
            Listed Gifting Inventory
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage your catalog listings or add customized items
          </p>
        </div>

        {isApproved && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="self-end sm:self-auto px-5 py-2.5 bg-gradient-to-r from-pink-500 to-indigo-600 text-xs font-bold text-white rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            {showAddForm ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Close Add Form
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4" />
                Add Custom Gift
              </>
            )}
          </button>
        )}
      </div>

      {/* Dynamic Add Product Multi-part Form */}
      {showAddForm && isApproved && (
        <form 
          onSubmit={handleFormSubmit}
          className="bg-white border border-pink-100 rounded-3xl p-5 sm:p-6 shadow-md space-y-6 animate-fade-in-down"
        >
          <h3 className="text-sm font-extrabold text-gray-800 border-b border-gray-50 pb-3">New Custom Product Specification</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            {/* Left Block: Basic Details */}
            <div className="sm:col-span-2 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Customized Couples Coffee Mug"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Detailed Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Add features, print specifications, washing guidelines..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Price (INR)</label>
                  <input
                    type="number"
                    required
                    placeholder="299"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Compare Price (Optional)</label>
                  <input
                    type="number"
                    placeholder="499"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Stock Count</label>
                  <input
                    type="number"
                    required
                    placeholder="50"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Right Block: Category & Images */}
            <div className="col-span-1 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Select Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs bg-white text-gray-700 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Image Files (Max 5)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 cursor-pointer"
                />
                <span className="text-[10px] text-gray-400 block font-semibold leading-normal">
                  Upload crisp photos showing print/gift details. Multi-files will be saved directly on Cloudinary storage.
                </span>
              </div>
            </div>

          </div>

          {/* Bottom Block: Custom fields builder */}
          <div className="border-t border-gray-100 pt-4 space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <h4 className="text-xs font-extrabold text-gray-800">Add Personalization Inputs</h4>
                <p className="text-[10px] text-gray-400">Configure questions/files customers must provide during checkout</p>
              </div>
              <button
                type="button"
                onClick={handleAddField}
                className="px-3.5 py-1.5 border border-pink-200 hover:bg-pink-50 text-[10px] font-bold text-pink-600 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Add Question
              </button>
            </div>

            {customizationFields.length > 0 && (
              <div className="space-y-3.5 max-w-3xl">
                {customizationFields.map((field, idx) => (
                  <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-3 items-center p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    
                    <div className="flex-1 min-w-[150px] space-y-1">
                      <input
                        type="text"
                        required
                        placeholder="E.g., Name to engrave"
                        value={field.fieldName}
                        onChange={(e) => handleFieldChange(idx, 'fieldName', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                      />
                    </div>

                    <div className="w-36">
                      <select
                        value={field.fieldType}
                        onChange={(e) => handleFieldChange(idx, 'fieldType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700 focus:outline-none cursor-pointer"
                      >
                        <option value="text">Short Text</option>
                        <option value="textarea">Long Text message</option>
                        <option value="image">Image Upload</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        id={`req_${idx}`}
                        checked={field.isRequired}
                        onChange={(e) => handleFieldChange(idx, 'isRequired', e.target.checked)}
                        className="text-pink-500 focus:ring-pink-500 rounded cursor-pointer"
                      />
                      <label htmlFor={`req_${idx}`} className="text-gray-500 font-bold select-none cursor-pointer">
                        Required
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveField(idx)}
                      className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-indigo-600 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
            >
              {submitLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  Adding Listing...
                </>
              ) : (
                'Save and Publish'
              )}
            </button>
          </div>

        </form>
      )}

      {/* Inventory Listings Table */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        
        {products.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 font-medium italic">
            You haven\'t listed any products yet. Use the button above to publish customized gifts.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              
              {/* Table header */}
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100 font-extrabold text-gray-400 uppercase tracking-wider">
                  <th className="p-4 pl-6">Product Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Approvals</th>
                  <th className="p-4 pr-6 text-center">Actions</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-gray-50 text-gray-600 font-medium">
                {products.map((prod) => (
                  <tr key={prod._id} className="hover:bg-gray-50/30 transition-colors">
                    
                    <td className="p-4 pl-6 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                        <img src={prod.images?.[0]} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="space-y-0.5 max-w-[200px] truncate">
                        <span className="font-bold text-gray-800 block truncate">{prod.name}</span>
                        {prod.customizationFields?.length > 0 && (
                          <span className="flex items-center gap-0.5 text-[9px] text-indigo-500 font-extrabold capitalize">
                            <Wand2 className="h-3 w-3" />
                            {prod.customizationFields.length} custom fields
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 capitalize">{prod.category?.name}</td>
                    
                    <td className="p-4 font-bold text-gray-800">{formatPrice(prod.price)}</td>
                    
                    <td className="p-4">
                      {prod.stock < 5 ? (
                        <span className="text-red-500 font-extrabold flex items-center gap-0.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-500 fill-red-50" />
                          Low ({prod.stock})
                        </span>
                      ) : (
                        <span>{prod.stock} items</span>
                      )}
                    </td>

                    <td className="p-4">
                      {prod.isApproved ? (
                        <span className="px-2 py-0.5 bg-green-50 text-green-600 border border-green-100 rounded text-[10px] font-bold">
                          Active Catalog
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[10px] font-bold">
                          Pending Moderation
                        </span>
                      )}
                    </td>

                    <td className="p-4 pr-6 text-center flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleEditClick(prod)}
                        className="p-2 text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer"
                        title="Edit listing"
                      >
                        <Edit className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod._id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Delete listing"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form 
            onSubmit={handleEditSubmit}
            className="bg-white rounded-3xl border border-pink-100 max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6 animate-fade-in-down my-8 text-left"
          >
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-extrabold text-gray-800">Edit Product: {editingProduct.name}</h3>
              <button 
                type="button"
                onClick={() => setEditingProduct(null)} 
                className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              {/* Left Block: Basic Details */}
              <div className="sm:col-span-2 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Customized Couples Coffee Mug"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Detailed Description</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Add features, print specifications..."
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Price (INR)</label>
                    <input
                      type="number"
                      required
                      placeholder="299"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Compare Price (Optional)</label>
                    <input
                      type="number"
                      placeholder="499"
                      value={editCompareAtPrice}
                      onChange={(e) => setEditCompareAtPrice(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Stock Count</label>
                    <input
                      type="number"
                      required
                      placeholder="50"
                      value={editStock}
                      onChange={(e) => setEditStock(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Right Block: Category & Status */}
              <div className="col-span-1 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Select Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs bg-white text-gray-700 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="edit_isActive"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="text-pink-500 focus:ring-pink-500 rounded cursor-pointer h-4 w-4"
                  />
                  <label htmlFor="edit_isActive" className="text-xs font-bold text-gray-700 select-none cursor-pointer">
                    Listed / Active on Shop
                  </label>
                </div>
              </div>

            </div>

            {/* Custom fields builder */}
            <div className="border-t border-gray-100 pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold text-gray-800">Edit Personalization Inputs</h4>
                  <p className="text-[10px] text-gray-400">Configure inputs customers must provide during checkout</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddEditField}
                  className="px-3.5 py-1.5 border border-pink-200 hover:bg-pink-50 text-[10px] font-bold text-pink-600 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Add Question
                </button>
              </div>

              {editCustomizationFields.length > 0 && (
                <div className="space-y-3.5">
                  {editCustomizationFields.map((field, idx) => (
                    <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-3 items-center p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      
                      <div className="flex-1 min-w-[150px] space-y-1">
                        <input
                          type="text"
                          required
                          placeholder="E.g., Name to engrave"
                          value={field.fieldName}
                          onChange={(e) => handleEditFieldChange(idx, 'fieldName', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                        />
                      </div>

                      <div className="w-36">
                        <select
                          value={field.fieldType}
                          onChange={(e) => handleEditFieldChange(idx, 'fieldType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white text-gray-700 focus:outline-none cursor-pointer"
                        >
                          <option value="text">Short Text</option>
                          <option value="textarea">Long Text message</option>
                          <option value="image">Image Upload</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          id={`edit_req_${idx}`}
                          checked={field.isRequired}
                          onChange={(e) => handleEditFieldChange(idx, 'isRequired', e.target.checked)}
                          className="text-pink-500 focus:ring-pink-500 rounded cursor-pointer"
                        />
                        <label htmlFor={`edit_req_${idx}`} className="text-gray-500 font-bold select-none cursor-pointer">
                          Required
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveEditField(idx)}
                        className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editSubmitLoading}
                className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-indigo-600 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
              >
                {editSubmitLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    Saving Changes...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
