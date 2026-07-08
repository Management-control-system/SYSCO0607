/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SchoolSettings } from '../types';
import { formatCurrency } from '../utils';
import { apiCreateSubscriptionCheckout, ApiError } from '../services/api';
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Zap, 
  ShieldCheck, 
  Calendar, 
  Crown, 
  TrendingUp, 
  UserCheck, 
  Clock, 
  HelpCircle,
  ExternalLink,
  Loader2,
  Lock,
  ArrowRightCircle,
  Sparkles,
  FileCheck
} from 'lucide-react';

interface SaaSSubscriptionPanelProps {
  settings: SchoolSettings;
  schoolId: string;
  onUpdateSubscription: (plan: 'bronze' | 'gold' | 'ultimate', expiryDays: number) => void;
  isFirebaseSynced: boolean;
}

const PLANS = [
  {
    id: 'bronze' as const,
    name: 'الخطة البرونزية',
    price: 15000,
    period: 'سنة كاملة',
    description: 'مناسبة للمدارس والروضات الناشئة ومراكز الدروس الخصوصية الصغيرة.',
    features: [
      'إدارة حتى 100 تلميذ نشط',
      'إدارة شؤون الأساتذة وتفاصيل رواتبهم',
      'طباعة وتوليد فواتير ووصولات أساسية',
      'المزامنة السحابية المحدودة',
      'دعم فني عبر البريد الإلكتروني'
    ],
    popular: false,
    color: 'from-amber-700 to-yellow-600',
    icon: ShieldCheck
  },
  {
    id: 'gold' as const,
    name: 'الخطة الذهبية',
    price: 28000,
    period: 'سنة كاملة',
    description: 'الخيار الأكثر شعبية وشمولية لإدارة المدارس والاقسام الكبيرة بكفاءة.',
    features: [
      'عدد تلاميذ غير محدود (مفتوح)',
      'إدارة الأساتذة والمجموعات والحصص بلا قيود',
      'طباعة فواتير وتفويضات مخصصة بشعار المؤسسة',
      'الإحصائيات المالية المتقدمة والميزانية ومؤشرات الربح',
      'أعلى حماية للمزامنة السحابية الفورية للأجهزة',
      'دعم فني متميز ومتواصل 24/7'
    ],
    popular: true,
    color: 'from-blue-700 to-indigo-800',
    icon: Crown
  },
  {
    id: 'ultimate' as const,
    name: 'الخطة الاحترافية',
    price: 49000,
    period: 'سنة كاملة',
    description: 'مخصصة للمؤسسات والمدارس التعليمية التي تبحث عن أفضل امتيازات الخدمة.',
    features: [
      'كل ميزات الخطة الذهبية بلا قيود',
      'دومين مخصص وتطبيق ويب مخصص للمدرسة',
      'لوحة تحكم إضافية مخصصة لأولياء الأمور للطلب',
      'سيرفرات سحابية سريعة وخاصة وقاعدة بيانات منفصلة',
      'مدير حساب تقني مخصص للمساعدة والتثبيت والتدريب الميداني',
      'تحديثات وميزات حصرية ومبكرة قبل الجميع'
    ],
    popular: false,
    color: 'from-purple-800 to-fuchsia-950',
    icon: Zap
  }
];

export default function SaaSSubscriptionPanel({
  settings,
  schoolId,
  onUpdateSubscription,
  isFirebaseSynced
}: SaaSSubscriptionPanelProps) {
  const [isLoadingPlan, setIsLoadingPlan] = useState<'bronze' | 'gold' | 'ultimate' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fallback Simulation for Sandbox / Testing when CHARGILY_SECRET_KEY is missing
  const [showSandboxSim, setShowSandboxSim] = useState<boolean>(false);
  const [simulatedPlan, setSimulatedPlan] = useState<typeof PLANS[number] | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Calculate remaining days
  const expiryDateStr = settings.subscriptionExpiry;
  const status = settings.subscriptionStatus === 'trial' ? 'expired' : (settings.subscriptionStatus || 'expired');
  const planName = settings.subscriptionPlan || 'bronze';

  let daysRemaining = 0;
  if (status === 'active' && expiryDateStr) {
    const diffTime = new Date(expiryDateStr).getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  } else {
    daysRemaining = 0;
  }

  const handleSubscribe = async (plan: typeof PLANS[number]) => {
    setError(null);
    setIsLoadingPlan(plan.id);

    try {
      const data = await apiCreateSubscriptionCheckout(plan.id.toUpperCase());

      if (data.checkoutUrl) {
        // Redirect director to Chargily payment page
        window.location.href = data.checkoutUrl;
      } else {
        setError('لم نتمكن من الحصول على رابط فاتورة الدفع لخطتكم.');
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.needsConfig) {
        setSimulatedPlan(plan);
        setShowSandboxSim(true);
      } else {
        console.error(err);
        setError(err?.message || 'حدث عطل غير متوقع أثناء توليد الطلب.');
      }
    } finally {
      setIsLoadingPlan(null);
    }
  };

  const executeSandboxSimulation = () => {
    if (!simulatedPlan) return;
    setIsSimulating(true);

    setTimeout(() => {
      onUpdateSubscription(simulatedPlan.id, 365); // Subscribe for 1 year (365 days)
      setIsSimulating(false);
      setShowSandboxSim(false);
      setSimulatedPlan(null);
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 2000);
  };

  return (
    <div className="space-y-8 text-right text-gray-950" dir="rtl">
      
      {/* 1. Header Information */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 justify-start text-indigo-900">
            <Lock className="w-6 h-6 text-indigo-600" />
            <h2 className="text-lg font-black">إدارة اشتراك النظام والدفع السحابي</h2>
          </div>
          <p className="text-xs text-gray-500">
            تابع تفاصيل اشتراك مدرستك، قم بترقية خطتك التعليمية، أو قم بتسديد رسوم التجديد السنوي بأمان تام بالبطاقة الذهبية أو CIB عبر شريكنا الرسمي Chargily Pay.
          </p>
        </div>

        <div className="self-start md:self-center">
          <span className="bg-indigo-50 text-indigo-800 border border-indigo-100 px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-bounce" />
            بوابة تجديد مرخصة وئامنة
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-xs font-semibold rounded-2xl border border-red-100 flex items-start gap-2 leading-relaxed">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Interactive Sandbox Simulation Modal / Backdrop */}
      {showSandboxSim && simulatedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-gray-200 w-full max-w-md shadow-2xl p-6 text-right space-y-5 text-gray-950">
            <div className="flex items-center gap-2 justify-start text-amber-900">
              <AlertCircle className="w-6 h-6 text-amber-600" />
              <h3 className="text-sm font-black">محاكاة الدفع التجريبي (بوابة الدفع غير مهيأة)</h3>
            </div>
            
            <p className="text-xs text-gray-600 leading-relaxed">
              لم نتمكن من العثور على المفتاح السري المعتمد <code className="bg-gray-100 px-1.5 py-0.5 rounded text-red-600 font-mono text-[10px]">CHARGILY_SECRET_KEY</code> في إعدادات الخادم لربط حساب الدفع الحقيقي الخاص بك كمالك للمشروع.
            </p>

            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 space-y-3">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                تفاصيل الفاتورة المراد ترقيتها:
              </span>
              
              <div className="text-xs space-y-1.5 text-gray-700">
                <div className="flex justify-between">
                  <span>الخطة المطلوبة:</span>
                  <span className="font-bold text-indigo-900">{simulatedPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>المبلغ السنوي:</span>
                  <span className="font-bold text-emerald-800">{formatCurrency(simulatedPlan.price)} / سنة</span>
                </div>
                <div className="flex justify-between">
                  <span>كود مساحة المدرسة:</span>
                  <span className="font-mono font-bold text-gray-900">#{schoolId}</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-400">
              💡 اضغط أدناه لتجربة ترقية نظام مساحة عمل مدرستك إلى هذه الخطة بنجاح فوري والتحقق من الميزات والواجهات.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={executeSandboxSimulation}
                disabled={isSimulating}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري تفعيل خطتك...</span>
                  </>
                ) : (
                  <span>محاكاة الدفع وتفعيل الاشتراك</span>
                )}
              </button>
              
              <button
                onClick={() => { setShowSandboxSim(false); setSimulatedPlan(null); }}
                className="px-4 py-3 bg-gray-150 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Current Subscription Status Card */}
      <div className="bg-linear-to-r from-blue-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/15 rounded-full blur-2xl -ml-10 -mb-10"></div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* Status Display */}
          <div className="space-y-2.5">
            <span className="text-[10px] uppercase tracking-wider text-indigo-200 font-bold block">حالة اشتراك مساحة العمل الحالية</span>
            <div className="flex items-center gap-2 justify-start">
              {status === 'active' ? (
                <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>اشتراك سنوي نشط (نشط)</span>
                </div>
              ) : (
                <div className="bg-red-500/20 text-red-300 border border-red-500/40 px-3.5 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                  <span>غير نشط / بانتظار تفعيل الاشتراك السنوي</span>
                </div>
              )}
            </div>
            
            <h3 className="text-xl font-black mt-1">
              {status === 'active' ? (
                <>
                  {planName === 'bronze' && 'الخطة البرونزية المحدودة'}
                  {planName === 'gold' && 'الخطة الذهبية المتكاملة 👑'}
                  {planName === 'ultimate' && 'الخطة الاحترافية المطلقة ⚡'}
                </>
              ) : (
                'بانتظار سداد رسوم الترخيص لتنشيط النظام'
              )}
            </h3>
          </div>

          {/* Time Remaining Indicator */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="p-3 bg-white/10 rounded-xl text-indigo-200 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-indigo-200 font-bold block">الوقت المتبقي لانتهاء الترخيص:</span>
              <span className="text-base font-black tracking-tight font-sans">
                {daysRemaining} {daysRemaining > 10 ? 'يوم' : 'أيام'}
              </span>
              <span className="text-[9px] text-indigo-300 block">
                {status === 'active' && expiryDateStr ? `تنتهي في: ${new Date(expiryDateStr).toLocaleDateString('ar-DZ')}` : 'مساحة العمل مغلقة مؤقتاً لحين الدفع'}
              </span>
            </div>
          </div>

          {/* Core Info Details */}
          <div className="space-y-2 text-xs text-indigo-100 border-r md:border-r-0 md:border-l border-white/15 pr-4 md:pr-0 md:pl-6">
            <div className="flex justify-between items-center">
              <span>كود المدرسة المخصص:</span>
              <span className="font-mono font-bold bg-white/10 px-2 py-0.5 rounded text-white">{schoolId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>نوع تفعيل الخادم:</span>
              <span className="font-bold">{isFirebaseSynced ? 'مزامنة سحابية نشطة' : 'نسخة أوفلاين مؤمنة'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>طريقة الدفع التلقائي:</span>
              <span className="font-semibold text-indigo-300">البطاقة الذهبية / CIB</span>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Pricing Plans Cards Grid */}
      <div className="space-y-4">
        {/* 7-Day Money-Back Guarantee Alert Banner */}
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs leading-relaxed font-semibold">
          <span className="text-2xl shrink-0">🛡️</span>
          <div>
            <h4 className="font-black text-amber-950">ضمان استرداد الأموال الكامل لمدة 7 أيام (أسبوع كامل)</h4>
            <p className="text-[11px] text-amber-850 mt-0.5">
              نحن نثق بجودة خدماتنا؛ إن لم تجد أن نظام الإدارة ومزامنة الأجهزة يلبي تطلعات مدرستك أو مركزك التعليمي خلال أول أسبوع من اشتراكك، يمكنك تقديم طلب استرداد مالي بسيط لتسترجع 100% من المبلغ المدفوع مباشرة دون أي تعقيد. رضاكم هو رأس مالنا.
            </p>
          </div>
        </div>

        <div className="text-right">
          <h3 className="text-sm font-black text-blue-950 flex items-center gap-1 justify-start">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <span>اختر الخطة المناسبة وقم بالترقية أو التجديد الفوري:</span>
          </h3>
          <p className="text-[11px] text-gray-400 mt-1">لا توجد رسوم خفية. يتم الدفع مرة واحدة سنوياً وتفعيل مميزات خطتكم فورياً وعبر كافة الأجهزة المسجلة بمدرستك.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = planName === plan.id;
            const IconComponent = plan.icon;
            return (
              <div 
                key={plan.id}
                className={`bg-white rounded-3xl border transition-all flex flex-col relative overflow-hidden ${
                  plan.popular 
                    ? 'border-blue-600 shadow-xl lg:-translate-y-2 scale-[1.02]' 
                    : 'border-gray-200 shadow-xs'
                }`}
              >
                {/* Popular tag */}
                {plan.popular && (
                  <div className="absolute top-0 left-0 bg-blue-600 text-white text-[9px] font-black px-4 py-1.5 rounded-br-2xl flex items-center gap-1 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    الخيار الموصى به
                  </div>
                )}

                {/* Plan Header */}
                <div className="p-6 space-y-4 border-b border-gray-100 flex-1">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-gray-900">{plan.name}</h4>
                      <p className="text-[10px] text-gray-400 leading-relaxed">{plan.description}</p>
                    </div>
                    <div className={`p-2 bg-linear-to-br ${plan.color} text-white rounded-xl shrink-0`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Pricing Info */}
                  <div className="pt-2">
                    <span className="text-2xl font-black font-sans text-gray-900 tracking-tight">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="text-xs text-gray-400 mr-1">/ {plan.period}</span>
                  </div>

                  {/* Plan Features list */}
                  <ul className="space-y-2.5 pt-4 text-xs text-gray-700 font-semibold border-t border-gray-100/60">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 justify-start leading-relaxed">
                        <CheckCircle className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? 'text-blue-600' : 'text-emerald-600'}`} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Subscription CTA buttons */}
                <div className="p-6 bg-slate-50 border-t border-gray-100">
                  {isCurrent ? (
                    <div className="w-full py-3 bg-emerald-50 text-emerald-800 border border-emerald-200 font-black text-xs rounded-xl text-center flex items-center justify-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>خطتك الحالية المفعلة بمدرستك</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSubscribe(plan)}
                      disabled={isLoadingPlan !== null}
                      className={`w-full py-3 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 ${
                        plan.popular 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10' 
                          : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-200'
                      }`}
                    >
                      {isLoadingPlan === plan.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>جاري توليد طلب الدفع...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          <span>الترقية والدفع عبر البطاقة</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Footer safety information */}
      <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100/50 space-y-3">
        <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5 justify-start">
          <Lock className="w-4 h-4 text-indigo-600" />
          <span>الضمان التقني والحماية الكاملة للمدفوعات عبر خوادم بريد الجزائر</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] text-indigo-900 leading-relaxed font-semibold">
          <p>
            تتم معالجة كافة العمليات المالية بنظام تشفير عالي الكفاءة (SSL 256-bit) عبر البوابة الرسمية والشريكة لخدمات Chargily المرخصة لموزع المدفوعات الوطني لبريد الجزائر وبنك الجزائر المالي. لا يتم تدوين أو تخزين أي بيانات لبطاقاتكم في خوادمنا.
          </p>
          <p>
            بمجرد نجاح عملية الدفع، سيتم إرسال فاتورة إلكترونية مفصلة بالرقم المرجعي والضريبة إلى بريدكم الإلكتروني المسجل، مع ترقية وتجديد حساب مساحتك الإدارية مباشرة في نفس اللحظة دون الحاجة لتدخل بشري.
          </p>
        </div>
      </div>

    </div>
  );
}
