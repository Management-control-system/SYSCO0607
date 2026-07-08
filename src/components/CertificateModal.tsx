/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Student, SchoolSettings } from '../types';
import { 
  Printer, 
  X, 
  Award, 
  School,
  GraduationCap,
  BookOpen,
  Star,
  Compass,
  Library
} from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
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

export default function CertificateModal({ isOpen, onClose, student, schoolSettings }: CertificateModalProps) {
  const [certTitle, setCertTitle] = useState('شهادة نجاح وتفوق');
  const [achievement, setAchievement] = useState('لحصوله على نتائج متميزة ومواظبته المثالية خلال الموسم الدراسي');
  const [certDate, setCertDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (isOpen) {
      setCertTitle('شهادة نجاح وتفوق');
      setAchievement('لحصوله على نتائج متميزة ومواظبته المثالية خلال الموسم الدراسي');
      setCertDate(new Date().toISOString().slice(0, 10));
    }
  }, [isOpen, student?.id]);

  if (!isOpen || !student) return null;

  const renderLogo = () => {
    if (schoolSettings.logoType === 'icon') {
      const IconComponent = PRESET_ICONS[schoolSettings.logoValue as keyof typeof PRESET_ICONS] || School;
      return <IconComponent className="w-8 h-8 text-amber-800" />;
    } else if (schoolSettings.logoType === 'text') {
      return <span className="text-3xl">{schoolSettings.logoValue || '🏫'}</span>;
    } else if (schoolSettings.logoType === 'image' && schoolSettings.logoValue) {
      return (
        <img
          src={schoolSettings.logoValue}
          alt="School Logo"
          className="h-12 w-auto rounded object-contain max-h-14"
          referrerPolicy="no-referrer"
        />
      );
    }
    return <School className="w-8 h-8 text-amber-800" />;
  };

  const handlePrint = () => window.print();

  const formattedDate = new Date(certDate).toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const certId = `CERT-${student.id}-${new Date().getFullYear()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto no-print" dir="rtl">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">

        {/* Top Control Header bar (no-print) */}
        <div className="flex justify-between items-center bg-gray-50 px-6 py-4 border-b border-gray-200 no-print">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
              <Award className="w-4 h-4" />
            </span>
            <span className="text-xs font-extrabold text-gray-800">توليد وطباعة شهادة نجاح رسمية</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 text-gray-500 hover:text-gray-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Editable fields (no-print) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-6 py-4 bg-white border-b border-gray-100 no-print">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 block">عنوان الشهادة</label>
            <input
              type="text"
              value={certTitle}
              onChange={(e) => setCertTitle(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-amber-500 outline-hidden"
            />
          </div>
          <div className="space-y-1 sm:col-span-1">
            <label className="text-[10px] font-bold text-gray-500 block">تاريخ الإصدار</label>
            <input
              type="date"
              value={certDate}
              onChange={(e) => setCertDate(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-amber-500 outline-hidden font-sans"
            />
          </div>
          <div className="space-y-1 sm:col-span-3">
            <label className="text-[10px] font-bold text-gray-500 block">نص الاستحقاق / سبب التكريم</label>
            <textarea
              value={achievement}
              onChange={(e) => setAchievement(e.target.value)}
              rows={2}
              className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-amber-500 outline-hidden resize-none"
            />
          </div>
        </div>

        {/* PRINTABLE CERTIFICATE CONTENT */}
        <div className="p-8 font-sans text-center text-gray-900 leading-relaxed print:p-0 bg-amber-50/30" id="printable-certificate-card">
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-certificate-card, #printable-certificate-card * {
                visibility: visible;
              }
              #printable-certificate-card {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 24px !important;
                border: none !important;
                box-shadow: none !important;
                background: white !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}} />

          <div className="border-8 border-double border-amber-700 p-8 sm:p-10 rounded-2xl space-y-6 bg-white relative overflow-hidden">
            {/* Decorative corner flourishes */}
            <div className="absolute top-3 right-3 text-amber-200 text-4xl select-none">✦</div>
            <div className="absolute top-3 left-3 text-amber-200 text-4xl select-none">✦</div>
            <div className="absolute bottom-3 right-3 text-amber-200 text-4xl select-none">✦</div>
            <div className="absolute bottom-3 left-3 text-amber-200 text-4xl select-none">✦</div>

            {/* School identity header */}
            <div className="flex items-center justify-center gap-2">
              {renderLogo()}
              <h2 className="text-base font-black text-amber-900">{schoolSettings.schoolName}</h2>
            </div>
            <p className="text-[10px] text-gray-400 font-bold -mt-4">
              {schoolSettings.address} • الموسم الدراسي: {schoolSettings.academicYear || '2025/2026'}
            </p>

            {/* Certificate title */}
            <div className="py-2">
              <Award className="w-12 h-12 text-amber-600 mx-auto mb-2" />
              <h1 className="text-2xl sm:text-3xl font-black text-amber-900 tracking-wide">{certTitle}</h1>
            </div>

            {/* Body text */}
            <div className="space-y-3 py-4">
              <p className="text-xs text-gray-500 font-semibold">تشهد إدارة المؤسسة التربوية بأن التلميذ(ة):</p>
              <h2 className="text-3xl font-black text-blue-950 py-2 border-b-2 border-t-2 border-amber-100 inline-block px-8">
                {student.name}
              </h2>
              <p className="text-xs text-gray-500 font-semibold">المسجل(ة) بالقسم / الفوج: <span className="font-bold text-gray-800">{student.cls}</span> — مادة: <span className="font-bold text-gray-800">{student.subject}</span></p>
              <p className="text-sm text-gray-700 font-bold max-w-lg mx-auto leading-loose pt-2">
                {achievement}
              </p>
            </div>

            {/* Date + ID */}
            <div className="text-[10px] text-gray-400 font-bold font-sans">
              حُررت بتاريخ: {formattedDate} • الرقم المرجعي: {certId}
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-100">
              <div className="text-center">
                <p className="text-[11px] text-gray-400 font-bold mb-12">ختم المؤسسة</p>
                <div className="w-28 h-0.5 bg-gray-200 mx-auto"></div>
              </div>
              <div className="text-center">
                <p className="text-[11px] text-gray-400 font-bold mb-12">إمضاء المدير العام</p>
                <div className="w-28 h-0.5 bg-gray-200 mx-auto"></div>
              </div>
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
            className="flex items-center gap-1.5 px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            طباعة الشهادة الآن (Print)
          </button>
        </div>

      </div>
    </div>
  );
}
