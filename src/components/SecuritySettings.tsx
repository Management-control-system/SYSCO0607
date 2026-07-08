/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SavedPin } from '../types';
import { ShieldAlert, Trash2, Plus, KeyRound, UserPlus, Fingerprint, Lock, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface SecuritySettingsProps {
  pins: SavedPin[];
  onAddPin: (label: string, pin: string, role: 'admin' | 'staff') => Promise<void>;
  onDeletePin: (id: string) => void;
  isFirebaseSynced: boolean;
  currentUserPin: SavedPin;
}

export default function SecuritySettings({ 
  pins, 
  onAddPin, 
  onDeletePin, 
  isFirebaseSynced,
  currentUserPin
}: SecuritySettingsProps) {
  const [newLabel, setNewLabel] = useState('');
  const [newPinCode, setNewPinCode] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'staff'>('staff');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMsg(null);

    const cleanLabel = newLabel.trim();
    const cleanPin = newPinCode.trim().replace(/\D/g, '');

    if (!cleanLabel) {
      setValidationError('يرجى تحديد اسم صاحب الرمز الصالح (مثال: أستاذ أحمد، السكريتيرة فاطمة).');
      return;
    }

    if (cleanPin.length < 4 || cleanPin.length > 6) {
      setValidationError('يجب أن يتراوح رمز المرور بين 4 إلى 6 أرقام فقط.');
      return;
    }

    if (cleanPin === '2026') {
      setValidationError('رمز المرور هذا محجوز كرمز افتراضي! يرجى اختيار توليفة أرقام أخرى متميزة.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddPin(cleanLabel, cleanPin, newRole);
      setNewLabel('');
      setNewPinCode('');
      setNewRole('staff');
      setSuccessMsg(`تم تخويل الوصول لـ (${cleanLabel}) بنجاح! يمكن للطرف الآخر الآن استخدام الرمز الجديد (${cleanPin}) لتسجيل الدخول الفوري. يرجى إبلاغه بالرمز الآن — لن يُعرض مجدداً هنا.`);
      setTimeout(() => setSuccessMsg(null), 8000);
    } catch (err: any) {
      setValidationError(err?.message || 'تعذر إنشاء رمز الدخول الجديد. يرجى المحاولة مجدداً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 space-y-8 text-right" dir="rtl">
      
      {/* Settings Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-gray-150 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-900 justify-start">
            <Fingerprint className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-extrabold">بوابة المصادقة وإدارة رموز الدخول (PINs)</h2>
          </div>
          <p className="text-xs text-gray-500">
            تخويل وإلغاء صلاحية الوصول إلى كشوف مدرسة النجاح الخاصة. بصفتك المدير، لك الحق الحصري في إضافة رموز الموظفين والأساتذة.
          </p>
        </div>

        {/* Sync state tag */}
        <div className="self-start sm:self-center">
          {isFirebaseSynced ? (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 font-sans">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>مزامنة الأمان السحابية نشطة</span>
            </div>
          ) : (
            <div className="bg-amber-50 text-amber-800 border border-amber-100 rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 font-sans">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>تشفير محلي (قيد المزامنة)</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Step 1: Create Pin form */}
        <div className="col-span-1 lg:col-span-5 space-y-4">
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
            <h3 className="text-xs font-bold text-gray-900 mb-4 flex items-center gap-1.5 justify-start">
              <UserPlus className="w-4 h-4 text-blue-600" />
              <span>توليد وترخيص رمز مرور جديد</span>
            </h3>

            <form onSubmit={handleCreatePin} className="space-y-4">
              
              {/* Name/Label */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block pr-1">اسم الموظف المستفيد:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الأستاذة مريم، السكرتير وليد..."
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full text-right text-xs px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
                  id="new-pin-label-input"
                />
              </div>

              {/* Pin Code Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block pr-1">رمز المرور الشخصي (4 إلى 6 أرقام):</label>
                <div className="relative flex items-center">
                  <KeyRound className="absolute right-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    required
                    placeholder="مثال: 9812..."
                    value={newPinCode}
                    onChange={(e) => setNewPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full text-right text-xs pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
                    maxLength={6}
                    id="new-pin-code-input"
                  />
                </div>
              </div>

              {/* Role Select */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block pr-1">نوع رخصة الصلاحية:</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'staff')}
                  className="w-full text-right text-xs px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
                  id="new-pin-role-select"
                >
                  <option value="staff">مستخدم عادي / موظف (عرض وتعديل بدون إدارة الرموز)</option>
                  <option value="admin">مسؤول رئيسي / مدير (صلاحية كاملة + إدارة الرموز)</option>
                </select>
              </div>

              {validationError && (
                <div className="bg-red-50 text-red-700 border border-red-100 p-3 rounded-xl text-xs font-bold">
                  {validationError}
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-3 rounded-xl text-xs font-bold flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-md transition-all active:scale-98 disabled:opacity-60"
                id="create-pin-btn"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'جاري الإنشاء...' : 'إضافة رمز جديد وتخويل الدخول'}</span>
              </button>

            </form>
          </div>
        </div>

        {/* Step 2: Manage active PINs list */}
        <div className="col-span-1 lg:col-span-7 space-y-4">
          <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 justify-start pl-1">
            <Lock className="w-4 h-4 text-blue-600" />
            <span>الرموز المرئية والنشطة حالياً ({pins.length + 1})</span>
          </h3>

          <div className="border border-gray-150 rounded-2xl overflow-hidden">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-[11px] font-bold text-gray-500">
                  <th className="px-4 py-3">الاسم / الوظيفة</th>
                  <th className="px-4 py-3">رمز المرور (PIN)</th>
                  <th className="px-4 py-3">مستوى الصلاحية</th>
                  <th className="px-4 py-3 text-center">خيارات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                
                {/* 1. Default fallback Master admin row */}
                <tr className="bg-blue-50/40 hover:bg-blue-50/70 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-blue-950 flex items-center gap-2">
                    <span className="p-1 rounded bg-blue-100 text-blue-800 text-[10px]">المدير العام</span>
                    <span>المدير العام (الافتراضي)</span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-gray-500">
                    •••• (2026)
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-md font-bold">كامل الصلاحيات</span>
                  </td>
                  <td className="px-4 py-3.5 text-center text-gray-400 font-medium italic text-[10px]">
                    محمي بشكل دائم
                  </td>
                </tr>

                {/* 2. Registered authorized PINs from user list */}
                {pins.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-gray-800">
                      {item.label}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-gray-400 tracking-wider text-[10px]">
                      •••• (مشفّر)
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                        item.role === 'admin' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      }`}>
                        {item.role === 'admin' ? 'مدير مسؤول' : 'موظف عادي'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => {
                          if (window.confirm(`⚠️ شطب رمز المرور: هل أنت متأكد من إلغاء وتجميد وصول (${item.label}) إلى كشوف المدرسة فوراً؟`)) {
                            onDeletePin(item.id);
                          }
                        }}
                        disabled={item.id === currentUserPin.id}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                        title={item.id === currentUserPin.id ? "لا يمكنك حذف الرمز الذي تستخدمه حالياً" : "إلغاء تخويل الوصول"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

              </tbody>
            </table>
          </div>

          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-[11px] text-blue-900 leading-relaxed space-y-1">
            <h4 className="font-extrabold text-blue-950 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>إرشادات السلامة والأمن:</span>
            </h4>
            <p>1. قم بكتابة الرموز وتجربتها بشكل صحيح قبل توزيعها على فريق العمل.</p>
            <p>2. لا تشارك الرمز الافتراضي (2026) مع أي موظف؛ بل قم بإنشاء رموز منفصلة ذات صلاحية "موظف عادي" لهم.</p>
            <p>3. في حال وجود اتصال بالإنترنت، سيقوم النظام تلقائياً بربط بيانات الأستاذ والتلاميذ بتلك الرموز لمزامنتهما بالملي ثانية.</p>
          </div>

        </div>

      </div>

    </div>
  );
}
