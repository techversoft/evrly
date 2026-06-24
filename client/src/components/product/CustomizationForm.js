'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

export default function CustomizationForm({ fields, onChange, nameError, messageError }) {
  const [nameText, setNameText] = useState('');
  const [messageText, setMessageText] = useState('');
  const [instructions, setInstructions] = useState('');

  // Determine if Name or Message should be required based on original product fields
  const isNameRequired = fields?.some(f => 
    f.isRequired && 
    (f.fieldName.toLowerCase().includes('name') || 
     f.fieldName.toLowerCase().includes('text') || 
     f.fieldName.toLowerCase().includes('person'))
  ) || false;

  const isMessageRequired = fields?.some(f => 
    f.isRequired && 
    (f.fieldName.toLowerCase().includes('message') || 
     f.fieldName.toLowerCase().includes('quote') || 
     f.fieldName.toLowerCase().includes('secret'))
  ) || false;

  useEffect(() => {
    // Map inputs to standard format: [{ fieldName, value }]
    const formatted = [
      { fieldName: 'Name to be printed on gift', value: nameText },
      { fieldName: 'Custom message', value: messageText },
      { fieldName: 'Additional comments/instructions for seller', value: instructions }
    ];
    onChange(formatted);
  }, [nameText, messageText, instructions]);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200/60 rounded-2xl p-5 space-y-4 shadow-sm">
      
      {/* Header */}
      <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
        <div className="p-1.5 bg-pink-100 text-pink-600 rounded-lg">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-xs font-extrabold text-slate-800 tracking-wide uppercase">Customize Your Gift</h3>
          <p className="text-[10px] text-slate-400 font-medium">Personalize this item with your own custom text details</p>
        </div>
      </div>

      <div className="space-y-4">
        
        {/* Field 1: Name to be printed */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700">
            Name to be printed on gift {isNameRequired && <span className="text-pink-500">*</span>}
          </label>
          <input
            type="text"
            placeholder="Enter name (e.g., Rahul Sharma)"
            value={nameText}
            onChange={(e) => setNameText(e.target.value)}
            className={`w-full px-4 py-2.5 bg-white border rounded-xl text-xs focus:ring-2 focus:outline-none transition-all font-medium text-slate-800 ${
              nameError 
                ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' 
                : 'border-gray-200 focus:ring-pink-500/10 focus:border-pink-500'
            }`}
          />
          {nameError && (
            <p className="text-[10px] font-bold text-red-500 pl-1">{nameError}</p>
          )}
        </div>

        {/* Field 2: Custom Message */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700">
            Custom message {isMessageRequired && <span className="text-pink-500">*</span>}
          </label>
          <textarea
            placeholder="Enter custom greetings, anniversary wishes, or quotes..."
            value={messageText}
            rows={3}
            onChange={(e) => setMessageText(e.target.value)}
            className={`w-full px-4 py-2.5 bg-white border rounded-xl text-xs focus:ring-2 focus:outline-none transition-all font-medium text-slate-800 ${
              messageError 
                ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' 
                : 'border-gray-200 focus:ring-pink-500/10 focus:border-pink-500'
            }`}
          />
          {messageError && (
            <p className="text-[10px] font-bold text-red-500 pl-1">{messageError}</p>
          )}
        </div>

        {/* Field 3: Instructions */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700">
            Additional comments/instructions for seller <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <textarea
            placeholder="E.g., Please make font color white, package in red wrapping paper, etc."
            value={instructions}
            rows={2}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-500/10 focus:border-pink-500 focus:outline-none transition-all font-medium text-slate-800"
          />
        </div>

      </div>

    </div>
  );
}
