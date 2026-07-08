/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { Student, Teacher, SchoolSettings } from '../types';
import { formatCurrency } from '../utils';
import { 
  Printer, 
  X, 
  CheckCircle, 
  Award, 
  School,
  GraduationCap,
  BookOpen,
  Star,
  Compass,
  Library
} from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
  teacher?: Teacher | null;
  schoolSettings: SchoolSettings;
}

const PRESET_ICONS = {
  School,
  GraduationCap,
  Award,
  BookOpen,
  Star,
  Compass,
  Library
};

export default function ReceiptModal({ isOpen, onClose, student, teacher, schoolSettings }: ReceiptModalProps) {
  if (!isOpen) return null;

  const renderLogo = () => {
    if (schoolSettings.logoType === 'icon') {
      const IconComponent = PRESET_ICONS[schoolSettings.logoValue as keyof typeof PRESET_ICONS] || School;
      return <IconComponent className="w-6 h-6 text-blue-800" />;
    } else if (schoolSettings.logoType === 'text') {
      return <span className="text-2xl">{schoolSettings.logoValue || '🏫'}</span>;
    } else if (schoolSettings.logoType === 'image' && schoolSettings.logoValue) {
      return (
        <img 
          src={schoolSettings.logoValue} 
          alt="School Logo" 
          className="h-10 w-auto rounded object-contain max-h-12 animate-fade-in"
          referrerPolicy="no-referrer"
        />
      );
    }
    return <School className="w-6 h-6 text-blue-800" />;
  };

  const handlePrint = () => {
    // We can open standard print dialog for this window.
    // CSS print class 'no-print' hides non-printable elements,
    // and we can force print layout via a dedicated style block.
    window.print();
  };

  const receiptDate = new Date().toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const receiptId = student 
    ? `ST-${student.id}-${new Date().getFullYear()}`
    : teacher 
      ? `TC-${teacher.id}-${new Date().getFullYear()}`
      : 'REC-0000';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto no-print">
      {/* Modal Card Frame */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Top Control Header bar (no-print) */}
        <div className="flex justify-between items-center bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
              <Printer className="w-4 h-4" />
            </span>
            <span className="text-xs font-extrabold text-gray-800">وصل تسجيل وطباعة بيداغوجي رسمي</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-200 text-gray-500 hover:text-gray-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PRINTABLE RECEIPT CONTENT AREA */}
        <div className="p-8 font-sans text-right text-gray-900 leading-relaxed print:p-0" id="printable-receipt-card">
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-receipt-card, #printable-receipt-card * {
                visibility: visible;
              }
              #printable-receipt-card {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 20px !important;
                border: none !important;
                box-shadow: none !important;
                background: white !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}} />

          {/* Double Frame border for official look */}
          <div className="border-4 border-double border-blue-900 p-6 rounded-xl space-y-6 bg-white">
            
            {/* Header School Identity */}
            <div className="flex flex-col sm:flex-row justify-between items-center border-b-2 border-blue-900 pb-4 gap-4">
              <div className="text-center sm:text-right space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  {renderLogo()}
                  <h2 className="text-lg font-black text-blue-900">{schoolSettings.schoolName}</h2>
                </div>
                <p className="text-[10px] text-gray-500 font-bold">بوابة الخدمات التربوية والتأهيل البيداغوجي المتكامل</p>
                <p className="text-[10px] text-gray-500 font-semibold">{schoolSettings.address} • الهاتف: {schoolSettings.phone}</p>
              </div>
              <div className="text-center sm:text-left border border-blue-200 p-2.5 rounded-lg bg-blue-50/50">
                <span className="text-xs font-bold text-blue-950 block">الموسم الدراسي: {schoolSettings.academicYear || '2025/2026'}</span>
                <span className="text-[10px] font-mono text-gray-500 mt-1 block">رقم الكشف: {receiptId}</span>
              </div>
            </div>

            {/* Receipt Title */}
            <div className="text-center py-2 bg-blue-900 text-white rounded-lg">
              <h3 className="text-sm font-black tracking-widest">
                {student ? 'وصل تسـجـيـل مـتمـدرس رسـمـي' : 'وثـيـقـة تـعـيـيـن واستـحـقاق الأسـتـاذ'}
              </h3>
            </div>

            {/* Information Grid */}
            {student && (
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-150">
                  <span className="text-gray-400 block mb-0.5">اسم التلميذ(ة) بالكامل:</span>
                  <span className="font-extrabold text-gray-900 text-sm">{student.name}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-150">
                  <span className="text-gray-400 block mb-0.5">رقم التسجيل المدرسي:</span>
                  <span className="font-bold text-gray-950 font-mono text-sm">{student.id}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-150">
                  <span className="text-gray-400 block mb-0.5">المستوى والقسم الملحق:</span>
                  <span className="font-extrabold text-blue-900">{student.cls}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-150">
                  <span className="text-gray-400 block mb-0.5">تاريخ الميلاد:</span>
                  <span className="font-bold text-gray-800">{student.dob}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-150">
                  <span className="text-gray-400 block mb-0.5">اسم ولي الأمر والاتصال:</span>
                  <span className="font-bold text-gray-900 block">{student.parent}</span>
                  <span className="text-[11px] font-mono text-gray-600 block mt-0.5" style={{ direction: 'ltr' }}>{student.phone}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-150">
                  <span className="text-gray-400 block mb-0.5">المادة التعليمية والتوقيت:</span>
                  <span className="font-extrabold text-blue-900 block">{student.subject}</span>
                  <span className="text-[10px] text-gray-500 block mt-0.5">الحضور: {student.day} ({student.time})</span>
                </div>
              </div>
            )}

            {teacher && (
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-150">
                  <span className="text-gray-400 block mb-0.5">اسم الأستاذ(ة) الفاضل:</span>
                  <span className="font-extrabold text-gray-900 text-sm">{teacher.name}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-150">
                  <span className="text-gray-400 block mb-0.5">رمز المعرّف المهني:</span>
                  <span className="font-bold text-gray-950 font-mono text-sm">{teacher.id}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-150">
                  <span className="text-gray-400 block mb-0.5">رقم الهاتف للتنسيق:</span>
                  <span className="font-bold text-gray-800 font-mono" style={{ direction: 'ltr' }}>{teacher.phone}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-150">
                  <span className="text-gray-400 block mb-0.5">المادة والمقرر المسند:</span>
                  <span className="font-extrabold text-blue-900">{teacher.subject}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-150">
                  <span className="text-gray-400 block mb-0.5">طريقة الاحتساب والتعويض المالي:</span>
                  <span className="font-bold text-gray-900 block">
                    {teacher.compensationType === 'percentage' && `نسبة مئوية من التسجيلات: ${teacher.compensationValue}%`}
                    {teacher.compensationType === 'fixed' && `راتب شهري أساسي ثابت`}
                    {teacher.compensationType === 'hourly' && `أجر بالساعة: ${teacher.compensationValue} دج`}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-150">
                  <span className="text-gray-400 block mb-0.5">الجدول الزمني للحصص:</span>
                  <span className="font-bold text-gray-800 block">{teacher.day}</span>
                  <span className="text-[10px] text-gray-500 font-mono block mt-0.5" style={{ direction: 'ltr' }}>{teacher.time}</span>
                </div>
              </div>
            )}

            {/* Financial Voucher Section */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-extrabold text-emerald-900">حالة المستحقات المالية الرسمية:</span>
                </div>
                <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-black">
                  مـوثـق ومـثبـت إداريـاً
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-emerald-200/50 text-xs">
                <div>
                  <span className="text-emerald-800 block">المبلغ الإجمالي الشهري:</span>
                  <span className="text-lg font-black text-blue-900 font-mono block mt-1">
                    {student && formatCurrency(student.amount)}
                    {teacher && (
                      teacher.compensationType === 'fixed' 
                        ? formatCurrency(teacher.compensationValue)
                        : teacher.compensationType === 'hourly'
                          ? formatCurrency(teacher.compensationValue * teacher.hoursWorked)
                          : 'يحتسب لاحقاً (حسب الطلاب)'
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-800 block">تاريخ إصدار وتوقيع الوصل:</span>
                  <span className="font-bold text-emerald-900 block mt-1">{receiptDate}</span>
                </div>
              </div>
            </div>

            {/* Administrative Stamp & Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-100">
              <div className="text-center">
                <p className="text-[11px] text-gray-400 font-bold mb-14">ختم المؤسسة وإمضاء المدير العام</p>
                <div className="w-24 h-0.5 bg-gray-200 mx-auto"></div>
              </div>
              <div className="text-center">
                <p className="text-[11px] text-gray-400 font-bold mb-14">إمضاء المعني (المسجل)</p>
                <div className="w-24 h-0.5 bg-gray-200 mx-auto"></div>
              </div>
            </div>

            {/* Custom Notes / Terms of Receipt */}
            {schoolSettings.notes && (
              <div className="p-3 bg-blue-50/30 rounded-xl border border-blue-100/30 text-[10px] text-gray-600 text-center font-bold">
                {schoolSettings.notes}
              </div>
            )}

            {/* Footer stamp text */}
            <div className="text-center pt-4 border-t border-gray-100 text-[9px] text-gray-400 font-medium">
              {schoolSettings.schoolName} • وصل بيداغوجي ومالي مشفر ومؤمن سحابياً عبر الرقم التسلسلي.
            </div>

          </div>
        </div>

        {/* Action Button Controls Footer (no-print) */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 no-print">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-gray-150 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            إلغاء وإغلاق
          </button>
          
          <button 
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            طباعة الوصل الآن (Print)
          </button>
        </div>

      </div>
    </div>
  );
}
