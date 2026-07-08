/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Student, SchoolSettings } from '../types';
import { formatCurrency } from '../utils';
import { apiCreateStudentCheckout, ApiError } from '../services/api';
import { 
  X, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle,
  ExternalLink,
  Loader2,
  Lock,
  Calendar,
  Sparkles,
  ArrowLeftRight
} from 'lucide-react';

interface ChargilyPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  schoolId: string;
  onPaymentRecorded: (studentId: string, month: string, amount: number) => void;
}

const ACADEMIC_MONTHS = [
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
  'جانفي',
  'فيفري',
  'مارس',
  'أفريل',
  'ماي',
  'جوان'
];

export default function ChargilyPaymentModal({ 
  isOpen, 
  onClose, 
  student, 
  schoolId,
  onPaymentRecorded 
}: ChargilyPaymentModalProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('أكتوبر');
  const [amountInput, setAmountInput] = useState<number>(3000);
  const [emailInput, setEmailInput] = useState<string>('parent@school.dz');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // To handle case where API credentials are not yet saved
  const [showSandboxFallback, setShowSandboxFallback] = useState<boolean>(false);
  const [fallbackStep, setFallbackStep] = useState<'form' | 'processing' | 'success'>('form');

  useEffect(() => {
    if (student) {
      setAmountInput(student.amount || 3000);
      
      // Select first unpaid month
      const studentPaidMonths = student.paidMonths || [];
      const firstUnpaid = ACADEMIC_MONTHS.find(m => !studentPaidMonths.includes(m));
      if (firstUnpaid) {
        setSelectedMonth(firstUnpaid);
      }
    }
    setError(null);
    setSuccessMsg(null);
    setShowSandboxFallback(false);
    setFallbackStep('form');
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const handleCreateCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await apiCreateStudentCheckout({
        studentId: student.id,
        month: selectedMonth,
        amount: amountInput,
      });

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError('لم نتمكن من استلام رابط الدفع من بوابة Chargily.');
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.needsConfig) {
        setShowSandboxFallback(true);
        setFallbackStep('form');
      } else {
        console.error(err);
        setError(err?.message || 'خطأ غير متوقع أثناء توليد رابط الدفع الإلكتروني.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateSandboxPayment = () => {
    setFallbackStep('processing');
    setTimeout(() => {
      setFallbackStep('success');
      // Record payment locally/Firebase immediately for testing
      onPaymentRecorded(student.id, selectedMonth, amountInput);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-xs text-right" dir="rtl">
      <div className="bg-white rounded-3xl border border-gray-200 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-gray-950">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-linear-to-r from-blue-900 to-indigo-950 text-white">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-300" />
            <h3 className="text-sm font-black">بوابة الدفع الإلكتروني الآمن (Chargily Pay)</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fallback Simulation Area */}
        {showSandboxFallback ? (
          <div className="p-6 space-y-5">
            {fallbackStep === 'form' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs font-semibold text-amber-900 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-amber-950 mb-1">تنبيه المطورين (وضع تجريبي بيداغوجي)</p>
                      <p>لم يتم العثور على المفتاح السري المعتمد <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-800">CHARGILY_SECRET_KEY</code> في إعدادات البيئة.</p>
                      <p className="mt-1.5 text-[10px] text-amber-800">لتنشيط الدفع الحقيقي لعملائك عبر البطاقة الذهبية أو CIB، يرجى تزويد المفتاح السري لخدمة Chargily في لوحة مفاتيح Secrets في خيارات AI Studio.</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-slate-50 border border-gray-150 rounded-2xl space-y-3">
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    محاكاة الدفع التجريبي المتكامل
                  </span>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    يمكنك اختبار رحلة العميل بالكامل (اختيار الشهر، تدوين الدفع، تحديث أرصدة ومستندات الطالب، وتصدير الإيصالات) فورياً بالضغط على زر المحاكاة أدناه.
                  </p>
                  <div className="border-t border-gray-200/60 pt-3 text-xs space-y-1.5 text-gray-700">
                    <div className="flex justify-between">
                      <span>اسم الطالب:</span>
                      <span className="font-bold">{student.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الشهر المستهدف:</span>
                      <span className="font-bold text-blue-900">{selectedMonth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>المبلغ المستحق:</span>
                      <span className="font-bold text-emerald-800">{formatCurrency(amountInput)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSimulateSandboxPayment}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer text-center"
                  >
                    بدء محاكاة عملية الدفع بنجاح
                  </button>
                  <button
                    onClick={() => setShowSandboxFallback(false)}
                    className="px-4 py-3 bg-gray-150 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    رجوع
                  </button>
                </div>
              </div>
            )}

            {fallbackStep === 'processing' && (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <div className="text-center">
                  <h4 className="font-bold text-sm text-gray-800">جاري تأكيد المعاملة الوهمية مع خادم Chargily...</h4>
                  <p className="text-xs text-gray-400 mt-1">يرجى الانتظار لحين معالجة وتفويض رصيد المعاملة لبطاقة الذهبية</p>
                </div>
              </div>
            )}

            {fallbackStep === 'success' && (
              <div className="py-8 space-y-6 text-center">
                <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-emerald-950 text-base">تم محاكاة الدفع بنجاح!</h4>
                  <p className="text-xs text-gray-500">تم تسجيل المستحقات وتوثيق عملية الدفع الإلكتروني لشهر ({selectedMonth}) للطالب {student.name}.</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 text-right text-xs text-gray-600 space-y-1.5">
                  <div className="flex justify-between">
                    <span>رقم رخصة المعاملة:</span>
                    <span className="font-mono font-bold">CHG-SIM-{Date.now().toString().slice(-6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>البطاقة المستخدمة:</span>
                    <span className="font-bold">البطاقة الذهبية (Edahabia)</span>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  إغلاق وتحديث السجلات الرسمية
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Real Form submission */
          <form onSubmit={handleCreateCheckout} className="p-6 space-y-4 flex-1">
            {error && (
              <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 font-semibold flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Student Info Box */}
            <div className="p-4 bg-slate-50 border border-gray-200 rounded-2xl flex justify-between items-center">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-semibold block">المتمدرس المعني بالاشتراك</span>
                <span className="text-xs font-black text-gray-900">{student.name}</span>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-md mr-1.5">
                  {student.cls}
                </span>
              </div>
              <div className="text-left font-mono text-xs text-gray-500">
                <span className="block text-[10px]">رقم التسجيل</span>
                <span className="font-bold text-gray-800">#{student.id}</span>
              </div>
            </div>

            {/* Month selector grid */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block flex items-center gap-1">
                <Calendar className="w-4 h-4 text-blue-700" />
                <span>الشهر الدراسي المراد تسديده بالبطاقة:</span>
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {ACADEMIC_MONTHS.map((month) => {
                  const isPaid = (student.paidMonths || []).includes(month);
                  const isSelected = selectedMonth === month;
                  return (
                    <button
                      key={month}
                      type="button"
                      onClick={() => !isPaid && setSelectedMonth(month)}
                      disabled={isPaid}
                      className={`py-2 text-xs font-bold rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 relative cursor-pointer ${
                        isPaid
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-not-allowed opacity-75'
                          : isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <span>{month}</span>
                      {isPaid && <span className="text-[8px] font-black text-emerald-600">✓ مسدد</span>}
                      {!isPaid && isSelected && <span className="text-[8px] font-bold text-blue-200">محدد حالياً</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">المبلغ المراد دفعه (دينار جزائري DA):</label>
              <div className="relative flex items-center">
                <input 
                  type="number"
                  min="10"
                  required
                  value={amountInput}
                  onChange={e => setAmountInput(Math.max(10, Number(e.target.value)))}
                  className="w-full text-right text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl pr-4 pl-14 py-3 focus:bg-white focus:border-blue-600 outline-none transition-colors"
                />
                <span className="absolute left-4 text-xs font-bold text-gray-400 font-mono">DZD (دج)</span>
              </div>
            </div>

            {/* Email (for billing notices) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">البريد الإلكتروني للولي (لتلقي إشعار الدفع):</label>
              <input 
                type="email"
                required
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="parent@gmail.dz"
                className="w-full text-left text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 focus:bg-white focus:border-blue-600 outline-none transition-colors font-sans"
              />
            </div>

            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 space-y-2 text-[10px] text-indigo-950 font-semibold leading-relaxed">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-700" />
                <span className="font-bold text-indigo-900">حماية وتشفير عالي المستوي</span>
              </div>
              <p>تتم معالجة جميع عمليات الدفع بأمان تام عبر خوادم Chargily الشريك الرسمي المعتمد من قبل بريد الجزائر والبنوك الوطنية.</p>
            </div>

            {/* Submit btn */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10 active:scale-98 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الاتصال بـ Chargily Pay...</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  <span>توليد فاتورة الدفع بالبطاقة الذهبية / CIB</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400 font-medium">
          <span>بوابة الدفع الإلكتروني v2</span>
          <span className="flex items-center gap-1 font-sans">
            Secure connection via SSL • 256bit
          </span>
        </div>

      </div>
    </div>
  );
}
