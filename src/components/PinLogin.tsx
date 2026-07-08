/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { SavedPin, SchoolSettings } from '../types';
import { 
  Shield, 
  KeyRound, 
  ArrowRight, 
  UserCheck, 
  AlertCircle, 
  Eye, 
  EyeOff,
  School,
  PlusCircle,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  Lock,
  Search
} from 'lucide-react';
import { getSavedState, saveState, verifyPinLocal, hashPinLocal } from '../utils';
import { signInWithBackendToken } from '../services/firebase';
import { apiLogin, apiRegisterSchool, ApiError } from '../services/api';

interface PinLoginProps {
  isFirebaseActive: boolean;
  onLoginSuccess: (pin: SavedPin, schoolId: string, customSettings?: SchoolSettings) => void;
  fallbackAdminPin: string;
}

export default function PinLogin({ isFirebaseActive, onLoginSuccess, fallbackAdminPin }: PinLoginProps) {
  // Navigation: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login inputs
  const [schoolIdInput, setSchoolIdInput] = useState<string>(() => 
    getSavedState<string>('nj_last_school_id', 'najah')
  );
  const [pinInput, setPinInput] = useState<string>('');
  const [showPin, setShowPin] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Registration inputs
  const [regName, setRegName] = useState('');
  const [regCode, setRegCode] = useState('');
  const [regAdminPin, setRegAdminPin] = useState('');
  const [regPhone, setRegPhone] = useState('0555-00-00-00');
  const [regAddress, setRegAddress] = useState('ولاية الجزائر، الجزائر');
  const [regAcademicYear, setRegAcademicYear] = useState('2025/2026');
  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Pad numbers click handler for PIN input
  const handleNumberClick = (num: string) => {
    setLoginError(null);
    if (pinInput.length < 6) {
      setPinInput(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPinInput('');
    setLoginError(null);
  };

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);

    const targetSchoolId = schoolIdInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!targetSchoolId) {
      setLoginError('يرجى إدخال كود المدرسة الخاص بك.');
      return;
    }

    if (pinInput.length < 4) {
      setLoginError('يجب أن يتكون رمز المرور من 4 أرقام على الأقل.');
      return;
    }

    setIsLoggingIn(true);

    try {
      // 1. If Firebase is active, verify the PIN on our backend (which uses
      // the Admin SDK — the client never reads PIN data directly) and sign
      // in to Firebase Auth with the custom token it returns.
      if (isFirebaseActive) {
        try {
          const result = await apiLogin(targetSchoolId, pinInput);
          const success = await signInWithBackendToken(result.customToken);
          if (!success) {
            setLoginError('خطأ في الاتصال بخدمة Firebase Auth. يرجى التحقق من صحة وصلاحيات مفتاح Service Account المرفق ومن أنه ينتمي لنفس مشروع Firebase.');
            setPinInput('');
            setIsLoggingIn(false);
            return;
          }
          saveState('nj_last_school_id', targetSchoolId);
          onLoginSuccess(
            { id: result.pin.id, pin: '', label: result.pin.label, role: result.pin.role, createdAt: '' },
            targetSchoolId,
            (result.settings as SchoolSettings) || undefined
          );
        } catch (err) {
          const message = err instanceof ApiError ? err.message : 'كود المدرسة أو رمز المرور غير صحيح.';
          setLoginError(message);
          setPinInput('');
        }
        return;
      }

      // 2. Offline / Local Fallback storage checks (single device, no cloud)
      const localPins = getSavedState<SavedPin[]>(`nj_school_pins_${targetSchoolId}`, []);
      const fetchedSettings = getSavedState<SchoolSettings | null>(`nj_school_settings_${targetSchoolId}`, null);

      let matchedPin: SavedPin | null = null;
      for (const p of localPins) {
        if (await verifyPinLocal(pinInput, p.pin)) {
          matchedPin = p;
          break;
        }
      }

      // If target is najah (default) and no local pins, allow fallback
      if (!matchedPin && targetSchoolId === 'najah' && pinInput === fallbackAdminPin) {
        matchedPin = {
          id: 'najah_admin',
          pin: fallbackAdminPin,
          label: 'المدير العام (رمز افتراضي)',
          role: 'admin',
          createdAt: new Date().toISOString()
        };
      }

      if (matchedPin) {
        saveState('nj_last_school_id', targetSchoolId);
        onLoginSuccess(matchedPin, targetSchoolId, fetchedSettings || undefined);
      } else {
        setLoginError('رمز المرور غير صحيح أو كود المدرسة غير مسجل. يرجى التأكد من كود المدرسة ورمز PIN.');
        setPinInput('');
      }
    } catch (err) {
      console.error(err);
      setLoginError('عذراً، حدث خطأ أثناء الاتصال بمساحة العمل. تأكد من اتصال الإنترنت.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    const schoolCode = regCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!schoolCode) {
      setRegError('يرجى إدخال كود مدرسة بالإنجليزية أو الأرقام فقط.');
      return;
    }

    if (schoolCode.length < 3) {
      setRegError('يجب أن يتكون كود المدرسة من 3 أحرف على الأقل.');
      return;
    }

    if (regAdminPin.length < 4) {
      setRegError('رمز مرور المدير يجب أن يتكون من 4 أرقام على الأقل.');
      return;
    }

    setIsRegistering(true);

    try {
      // Cloud registration goes entirely through the backend now: it
      // checks uniqueness, hashes the admin PIN, creates the Firestore
      // documents via the Admin SDK, and returns a custom token to sign in
      // with — the client never writes school/pin documents directly.
      if (isFirebaseActive) {
        try {
          const result = await apiRegisterSchool({
            schoolId: schoolCode,
            schoolName: regName.trim(),
            adminPin: regAdminPin,
            phone: regPhone.trim(),
            address: regAddress.trim(),
            academicYear: regAcademicYear.trim(),
          });
          const success = await signInWithBackendToken(result.customToken);
          if (!success) {
            setRegError('تم إنشاء المدرسة، ولكن فشلت عملية المصادقة السحابية التلقائية. يرجى محاولة تسجيل الدخول يدوياً والتحقق من صحة مفتاح Service Account.');
            setIsRegistering(false);
            return;
          }

          setRegSuccess(`🎉 تم إنشاء وتخصيص مساحة عمل مدرستك بنجاح! كود المدرسة هو (${schoolCode}). للتنشيط الفوري والبدء بالعمل السحابي، يرجى تسجيل الدخول وتفعيل خطتك السنوية مع ضمان استرداد أموالك كاملاً في غضون 7 أيام (أسبوع كامل) إن لم ترض عن الخدمة.`);
          setSchoolIdInput(schoolCode);
          setPinInput(regAdminPin);
          setRegName('');
          setRegCode('');
          setRegAdminPin('');
          setTimeout(() => setActiveTab('login'), 5000);
        } catch (err) {
          setRegError(err instanceof ApiError ? err.message : 'حدث خطأ أثناء إنشاء مساحة العمل.');
        }
        return;
      }

      // Offline / local-only registration (single device, no cloud).
      const existingLocal = localStorage.getItem(`nj_school_settings_${schoolCode}`);
      if (existingLocal !== null) {
        setRegError('⚠️ كود المدرسة هذا مستخدم بالفعل على هذا الجهاز! يرجى اختيار كود فريد مختلف.');
        setIsRegistering(false);
        return;
      }

      const now = new Date();
      const settings: SchoolSettings = {
        id: 'school',
        schoolName: regName.trim(),
        logoType: 'icon',
        logoValue: 'School',
        phone: regPhone.trim(),
        address: regAddress.trim(),
        notes: 'ملاحظة: الرسوم المدفوعة غير قابلة للاسترجاع بعد انطلاق الحصص. يرجى مرافقة التلميذ بانتظام.',
        academicYear: regAcademicYear.trim(),
        subscriptionStatus: 'expired',
        subscriptionPlan: 'bronze',
        subscriptionExpiry: now.toISOString()
      };

      const adminPin: SavedPin = {
        id: `admin_${Date.now()}`,
        pin: await hashPinLocal(regAdminPin),
        label: 'مدير المؤسسة',
        role: 'admin',
        createdAt: new Date().toISOString()
      };

      saveState(`nj_school_settings_${schoolCode}`, settings);
      saveState(`nj_school_pins_${schoolCode}`, [adminPin]);
      saveState(`nj_school_students_${schoolCode}`, []);
      saveState(`nj_school_teachers_${schoolCode}`, []);

      setRegSuccess(`🎉 تم إنشاء وتخصيص مساحة عمل مدرستك بنجاح! كود المدرسة هو (${schoolCode}). للتنشيط الفوري والبدء بالعمل السحابي، يرجى تسجيل الدخول وتفعيل خطتك السنوية مع ضمان استرداد أموالك كاملاً في غضون 7 أيام (أسبوع كامل) إن لم ترض عن الخدمة.`);
      
      setSchoolIdInput(schoolCode);
      setPinInput(regAdminPin);
      setRegName('');
      setRegCode('');
      setRegAdminPin('');

      setTimeout(() => {
        setActiveTab('login');
      }, 5000);

    } catch (err) {
      console.error(err);
      setRegError('حدث خطأ فني أثناء تهيئة مساحة عمل المدرسة. يرجى المحاولة لاحقاً.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-gray-950 flex flex-col items-center justify-center p-4 sm:p-6" dir="rtl">
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 border border-white/20"
      >
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center">
            <School className="w-9 h-9 text-blue-600 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-blue-950">النظام الموحد لإدارة المدارس الخاصة</h2>
            <p className="text-xs text-gray-500 font-medium">مساحات عمل مخصصة ومستقلة لـ 20+ مدرسة شريكة مع مزامنة سحابية</p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setLoginError(null); }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            تسجيل دخول لمدرسة مسجلة
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setRegError(null); }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            إنشاء مساحة مدرسة جديدة
          </button>
        </div>

        {/* Form rendering */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* School Code Input */}
            <div className="space-y-1 text-right">
              <label className="text-xs font-bold text-gray-700 block pr-1 flex items-center gap-1">
                <Search className="w-3.5 h-3.5 text-blue-600" />
                <span>كود المدرسة المعين (مثال: najah):</span>
              </label>
              <input
                type="text"
                required
                value={schoolIdInput}
                onChange={(e) => {
                  setLoginError(null);
                  setSchoolIdInput(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
                }}
                placeholder="أدخل كود مدرسة النجاح أو مدرستك الخاصة"
                className="w-full text-center text-xs font-bold px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-hidden transition-all text-blue-900 placeholder-gray-400 font-sans"
              />
              <p className="text-[10px] text-gray-400 text-right pr-1">ملاحظة: الكود الافتراضي لبدء الاستكشاف هو <b>najah</b> (ورمز PIN هو <b>2026</b>)</p>
            </div>

            {/* PIN Input */}
            <div className="space-y-1 text-right">
              <label className="text-xs font-bold text-gray-700 block pr-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                <span>رمز PIN الشخصي للدخول:</span>
              </label>
              <div className="relative flex items-center">
                <KeyRound className="absolute right-3.5 w-5 h-5 text-gray-400" />
                <input
                  type={showPin ? "text" : "password"}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={pinInput}
                  onChange={(e) => {
                    setLoginError(null);
                    setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                  }}
                  placeholder="••••••"
                  className="w-full text-center tracking-widest text-lg font-bold pr-12 pl-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:outline-hidden transition-all text-blue-950 placeholder-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute left-3.5 p-1 text-gray-400 hover:text-blue-600 cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-start gap-2 text-xs text-red-700 font-bold leading-relaxed">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Action submit button */}
            <button
              type="submit"
              disabled={isLoggingIn || pinInput.length < 4}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-200 disabled:text-gray-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/10 active:scale-98 transition-all"
            >
              <Shield className="w-4 h-4" />
              <span>{isLoggingIn ? 'قيد التحقق والمزامنة...' : 'دخول مساحة العمل الآمنة'}</span>
            </button>

            {/* Quick Digital Keypad */}
            <div className="pt-2">
              <p className="text-[10px] text-center text-gray-400 font-medium mb-3">لوحة مفاتيح الأرقام السريعة للهاتف المحمول</p>
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleNumberClick(num)}
                    className="py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-150 rounded-xl font-extrabold text-gray-800 hover:text-blue-800 transition-colors active:scale-95 duration-100 cursor-pointer text-sm"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClear}
                  className="py-2.5 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl font-bold text-red-700 text-xs cursor-pointer"
                >
                  مسح
                </button>
                <button
                  type="button"
                  onClick={() => handleNumberClick('0')}
                  className="py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-150 rounded-xl font-extrabold text-gray-800 hover:text-blue-800 cursor-pointer text-sm"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-150 rounded-xl font-bold text-amber-700 text-xs cursor-pointer"
                >
                  حذف
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-right">
            
            {/* School registration details */}
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 mb-2">
              <p className="text-[11px] text-blue-900 font-bold leading-relaxed">
                💡 بإنشاء مدرسة جديدة، سيقوم النظام تلقائياً بحجز وتخصيص قاعدة بيانات معزولة ومستقلة تماماً لمؤسستك على السحابة، بحيث لا يرى أحد آخر متمدرسي مدرسة النجاح أو أساتذتكم، ويمكنكم تعيين وصولات وشعارات مستقلة بالكامل.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block pr-1">اسم المؤسسة التعليمية:</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="مثال: مدرسة الآفاق للغات"
                  className="w-full text-right text-xs px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-hidden text-gray-900 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block pr-1">كود المدرسة الفريد (للأعضاء):</label>
                <input
                  type="text"
                  required
                  value={regCode}
                  onChange={(e) => setRegCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="مثال: afak-school (بالانجليزية)"
                  className="w-full text-center text-xs px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-hidden text-blue-900 font-sans font-bold"
                />
                <span className="text-[9px] text-gray-400 block pr-1">يستخدم هذا الكود من قبل الموظفين لتسجيل الدخول.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block pr-1">رمز مرور المدير الخاص (Admin PIN):</label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={regAdminPin}
                  onChange={(e) => setRegAdminPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="رقم سري من 4 أرقام على الأقل"
                  className="w-full text-center text-xs px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-hidden text-gray-900 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block pr-1">الموسم الدراسي النشط:</label>
                <input
                  type="text"
                  required
                  value={regAcademicYear}
                  onChange={(e) => setRegAcademicYear(e.target.value)}
                  placeholder="2025/2026"
                  className="w-full text-center text-xs px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-hidden text-gray-800 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block pr-1">رقم هاتف المدرسة المعتمد:</label>
                <input
                  type="text"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full text-center text-xs px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-hidden text-gray-800 font-semibold"
                  style={{ direction: 'ltr' }}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block pr-1">عنوان المقر الإداري:</label>
                <input
                  type="text"
                  required
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  className="w-full text-right text-xs px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-hidden text-gray-800 font-semibold"
                />
              </div>
            </div>

            {regError && (
              <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-start gap-2 text-xs text-red-700 font-bold">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl flex items-start gap-2 text-xs text-emerald-800 font-bold leading-relaxed">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
                <span>{regSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-gray-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10 active:scale-98 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isRegistering ? 'جاري حجز المساحة وتوليد الخادم السحابي...' : 'تثبيت وتهيئة مساحة المدرسة الجديدة'}</span>
            </button>
          </form>
        )}

        {/* Sync Info Banner */}
        <div className="text-center pt-2">
          {isFirebaseActive ? (
            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-900 border border-blue-100 px-3 py-1.5 rounded-full text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>الخدمات السحابية ومصادقة PIN نشطة ومستقرة</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-100 px-3 py-1.5 rounded-full text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>العمل في الوضع المحلي (يتم حفظ السجلات محلياً لكل مدرسة)</span>
            </div>
          )}
        </div>

      </motion.div>

      {/* SaaS Pricing Plans & Capabilities Showcase */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-lg mt-6 bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-800 p-6 space-y-4 shadow-xl text-white"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg">
              <School className="w-5 h-5 text-indigo-400" />
            </span>
            <div>
              <h3 className="text-xs font-black text-white">بوابة الشركاء ومديري المدارس (SaaS)</h3>
              <p className="text-[10px] text-gray-400">نظام موحد ومستقل لإدارة المدارس الخاصة، مدارس الدعم، ومراكز التكوين واللغات</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-4 space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed font-semibold">
            هل أنت صاحب مدرسة دعم أو مركز تعليمي؟ رقمن أعمالك الآن ووفر خدمات سحابية متكاملة لمؤسستك. الدخول وتجربة الترقية مدعومة بـ <span className="text-yellow-400 font-bold">ضمان استرداد الأموال في غضون 7 أيام (أسبوع كامل)</span> إذا لم تحز الخدمة على رضاك، حيث يمكنك استرجاع مبلغ اشتراكك فورياً بنسبة 100%.
          </p>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3.5">
            <h4 className="text-xs font-black text-indigo-300 flex items-center gap-1.5 justify-start">
              <span>💳 خطط الاشتراك السنوي المتوفرة (الدفع الآمن بـ Chargily Pay):</span>
            </h4>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-200 block text-[11px]">🥉 الخطة البرونزية (Bronze)</span>
                  <span className="text-[9px] text-slate-400">للمراكز والروضات الناشئة حتى 100 تلميذ</span>
                </div>
                <div className="text-left font-mono font-black text-amber-500 text-[11px]">
                  5,000 دج / سنة
                </div>
              </div>

              <div className="p-2.5 bg-indigo-950/40 rounded-xl border border-indigo-900/40 flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="font-black text-indigo-200 block text-[11px]">👑 الخطة الذهبية الشاملة (Gold)</span>
                  <span className="text-[9px] text-indigo-300">تلاميذ غير محدودين + إدارة الرواتب والمالية</span>
                </div>
                <div className="text-left font-mono font-black text-emerald-400 text-[11px]">
                  12,000 دج / سنة
                </div>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-200 block text-[11px]">⚡ الخطة الاحترافية الشاملة (Ultimate)</span>
                  <span className="text-[9px] text-slate-400">تطبيق ودومين مخصص ومساحة تواصل الأولياء</span>
                </div>
                <div className="text-left font-mono font-black text-purple-400 text-[11px]">
                  25,000 دج / سنة
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-950/30 p-2 rounded-xl border border-slate-800/40">
            <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>نظام دفع إلكتروني آمن ومؤمن 100% بالتعاون مع بريد الجزائر والمدفوعات الوطنية (CIB / الذهبية).</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
