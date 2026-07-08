/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Student, Teacher } from '../types';
import { calculateTeacherCompensation, formatCurrency } from '../utils';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  UserCheck, 
  Briefcase, 
  FileText, 
  Printer, 
  ArrowLeft, 
  Award, 
  ChevronLeft,
  X,
  Calendar,
  Check,
  AlertCircle
} from 'lucide-react';

interface DashboardStatsProps {
  students: Student[];
  teachers: Teacher[];
  onUpdateStudent?: (student: Student) => void;
  onPrintStudent?: (student: Student) => void;
}

const ACADEMIC_MONTHS = [
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
  'جانفي',
  'فيفري',
  'مارس',
  'أفريل',
  'ماي',
  'جوان',
  'جويلية',
  'أوت'
];

export default function DashboardStats({ students, teachers, onUpdateStudent, onPrintStudent }: DashboardStatsProps) {
  const [printMode, setPrintMode] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'monthly_ledger'>('general');
  const [selectedMonth, setSelectedMonth] = useState<string>('أكتوبر');
  const [monthSearchTerm, setMonthSearchTerm] = useState<string>('');

  const handleTogglePayment = (student: Student) => {
    if (!onUpdateStudent) return;
    const currentPaidMonths = student.paidMonths || [];
    let updatedPaidMonths: string[];
    if (currentPaidMonths.includes(selectedMonth)) {
      updatedPaidMonths = currentPaidMonths.filter(m => m !== selectedMonth);
    } else {
      updatedPaidMonths = [...currentPaidMonths, selectedMonth];
    }

    const updatedStudent: Student = {
      ...student,
      paidMonths: updatedPaidMonths
    };

    onUpdateStudent(updatedStudent);
  };

  // Core metrics
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'active').length;
  const totalTeachers = teachers.length;

  // Global Financial sums
  const totalRevenues = students
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + s.amount, 0);

  const totalExpenditures = teachers.reduce((sum, t) => {
    return sum + calculateTeacherCompensation(t, students);
  }, 0);

  const netProfit = totalRevenues - totalExpenditures;
  const profitMargin = totalRevenues > 0 ? (netProfit / totalRevenues) * 100 : 0;

  // Group students and metrics per subject for detailed bars
  const subjectsMap: { [key: string]: { studentsCount: number; studentFees: number; teacherSalary: number; teacherName: string } } = {};

  students.forEach(s => {
    if (s.status !== 'active') return;
    if (!subjectsMap[s.subject]) {
      subjectsMap[s.subject] = { studentsCount: 0, studentFees: 0, teacherSalary: 0, teacherName: 'لا يوجد أستاذ' };
    }
    subjectsMap[s.subject].studentsCount += 1;
    subjectsMap[s.subject].studentFees += s.amount;
  });

  teachers.forEach(t => {
    const calculatedSalary = calculateTeacherCompensation(t, students);
    if (!subjectsMap[t.subject]) {
      subjectsMap[t.subject] = { studentsCount: 0, studentFees: 0, teacherSalary: 0, teacherName: 'لا يوجد أستاذ' };
    }
    subjectsMap[t.subject].teacherSalary += calculatedSalary;
    subjectsMap[t.subject].teacherName = t.name;
  });

  const subjectEntries = Object.entries(subjectsMap).map(([subject, data]) => ({
    subject,
    ...data,
    netProfit: data.studentFees - data.teacherSalary,
  }));

  const maxStudentsCount = Math.max(...subjectEntries.map(e => e.studentsCount), 1);
  const maxFees = Math.max(...subjectEntries.map(e => Math.max(e.studentFees, e.teacherSalary)), 1);

  if (printMode) {
    return (
      <div id="financial-print-report" className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 text-black max-w-4xl mx-auto my-4 relative">
        <button 
          onClick={() => setPrintMode(false)}
          className="no-print absolute top-4 left-4 flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-lg transition-colors"
          id="btn-close-print-mode"
        >
          <X className="w-4 h-4" />
          إغلاق المعاينة
        </button>

        {/* School Report Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-100 pb-6 mb-6">
          <div className="text-right">
            <h1 className="text-2xl font-bold text-blue-800 mb-1">مدرسة النجاح الخاصة للتعليم والدعم</h1>
            <p className="text-xs text-gray-500">العام الدراسي الحالي: 2025 - 2026</p>
            <p className="text-xs text-gray-500">حالة التقرير: تقرير مالي شهري شامل</p>
            <p className="text-xs text-gray-500 mt-2 font-mono">تاريخ الصدور: {new Date().toISOString().slice(0, 10)}</p>
          </div>
          <div className="text-left border border-blue-100 p-3 rounded-lg bg-blue-50/50">
            <span className="text-blue-900 font-bold block text-sm">شعار المؤسسة</span>
            <span className="text-emerald-700 font-bold block text-sm mt-1">وصل الدفع الرسمي</span>
          </div>
        </div>

        {/* Report Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="border border-gray-200 p-4 rounded-xl text-center">
            <div className="text-xs text-gray-500 mb-1">إجمالي المقبوضات (الطلاب)</div>
            <div className="text-xl font-bold text-emerald-600">{formatCurrency(totalRevenues)}</div>
          </div>
          <div className="border border-gray-200 p-4 rounded-xl text-center">
            <div className="text-xs text-gray-500 mb-1">إجمالي المدفوعات (الأساتذة)</div>
            <div className="text-xl font-bold text-red-600">{formatCurrency(totalExpenditures)}</div>
          </div>
          <div className="border border-green-200 bg-green-50/30 p-4 rounded-xl text-center">
            <div className="text-xs text-green-700 mb-1 font-bold">الربح الصافي للمؤسسة</div>
            <div className="text-xl font-bold text-blue-900">{formatCurrency(netProfit)}</div>
          </div>
        </div>

        {/* Detailed Section Table */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-3 block"> تفصيل الحسابات حسب مادة التدريس</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="p-3 text-right text-gray-700 font-semibold">المادة التعليمية</th>
                <th className="p-3 text-center text-gray-700 font-semibold">عدد التلاميذ</th>
                <th className="p-3 text-left text-gray-700 font-semibold">مداخيل التلاميذ (دج)</th>
                <th className="p-3 text-right text-gray-700 font-semibold">الأستاذ المؤطر</th>
                <th className="p-3 text-left text-gray-700 font-semibold">مستحقات الأستاذ (دج)</th>
                <th className="p-3 text-left text-gray-700 font-semibold">صافي المادة (دج)</th>
              </tr>
            </thead>
            <tbody>
              {subjectEntries.map((entry, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/30">
                  <td className="p-3 text-right font-medium text-gray-900">{entry.subject}</td>
                  <td className="p-3 text-center text-gray-600">{entry.studentsCount} تلميذ</td>
                  <td className="p-3 text-left font-mono text-emerald-700">{formatCurrency(entry.studentFees)}</td>
                  <td className="p-3 text-right text-gray-600 text-xs">{entry.teacherName}</td>
                  <td className="p-3 text-left font-mono text-amber-700">{formatCurrency(entry.teacherSalary)}</td>
                  <td className={`p-3 text-left font-mono font-semibold ${entry.netProfit >= 0 ? 'text-blue-900' : 'text-red-600'}`}>
                    {formatCurrency(entry.netProfit)}
                  </td>
                </tr>
              ))}
              {subjectEntries.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">لا توجد بيانات حالية للمواد والأساتذة لتوليد الكشوف</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-12">توقيع وختم الإدارة العامة</p>
            <div className="w-32 h-0.5 bg-gray-300 mx-auto"></div>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-12">توقيع المسؤول المالي ومراقب الحسابات</p>
            <div className="w-32 h-0.5 bg-gray-300 mx-auto"></div>
          </div>
        </div>

        <div className="no-print mt-8 flex justify-center gap-4">
          <button 
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow transition-colors"
            id="btn-print-action"
          >
            <Printer className="w-4 h-4" />
            طباعة هذا التقرير المالي الآن
          </button>
          <button 
            type="button" 
            onClick={() => setPrintMode(false)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
            id="btn-exit-print-now"
          >
            رجوع
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header with monthly report action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            إحصائيات الموارد والتحليل المالي الشهري الشامل
          </h3>
          <p className="text-xs text-gray-500 mt-1">تتبع التدفق المالي، مداخيل الطلاب، نفقات الأساتذة والربح الصافي للمؤسسة تلقائياً.</p>
        </div>
        <button
          onClick={() => setPrintMode(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
          id="btn-open-print-report"
        >
          <Printer className="w-4 h-4" />
          توليد وطباعة الكشف الشهري الشامل
        </button>
      </div>

      {/* 2. Sub-Tab Switcher */}
      <div className="flex border-b border-gray-200 gap-4">
        <button
          onClick={() => setActiveSubTab('general')}
          className={`pb-3 text-xs font-black transition-all border-b-2 px-2 cursor-pointer ${
            activeSubTab === 'general'
              ? 'border-blue-600 text-blue-700 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
          id="stats-tab-general"
        >
          📈 التحليل المالي والتقرير العام
        </button>
        <button
          onClick={() => setActiveSubTab('monthly_ledger')}
          className={`pb-3 text-xs font-black transition-all border-b-2 px-2 cursor-pointer ${
            activeSubTab === 'monthly_ledger'
              ? 'border-blue-600 text-blue-700 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
          id="stats-tab-monthly"
        >
          🗓️ سجل الاشتراكات والدفع السنوي
        </button>
      </div>

      {activeSubTab === 'general' ? (
        <div className="space-y-6">
          {/* Top Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Metric 1 */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-blue-200 transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-xs text-blue-600 font-medium px-2 py-1 bg-blue-50 rounded-md">
                  {activeStudents} نشط
                </span>
              </div>
              <span className="text-xs text-gray-500 block">إجمالي الطلاب</span>
              <div className="text-2xl font-bold text-gray-900 mt-1">{totalStudents} طالب</div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-emerald-200 transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-xs text-emerald-600 font-medium px-2 py-1 bg-emerald-50 rounded-md">
                  المستحقات
                </span>
              </div>
              <span className="text-xs text-gray-500 block">إجمالي الإيرادات المقبوضة</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">{formatCurrency(totalRevenues)}</div>
            </div>

            {/* Metric 3 */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-red-200 transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                  <Briefcase className="w-5 h-5" />
                </div>
                <span className="text-xs text-red-600 font-medium px-2 py-1 bg-red-50 rounded-md">
                  مجموع الرواتب
                </span>
              </div>
              <span className="text-xs text-gray-500 block">إجمالي رواتب ومستحقات الأساتذة</span>
              <div className="text-2xl font-bold text-red-600 mt-1 font-mono">{formatCurrency(totalExpenditures)}</div>
            </div>

            {/* Metric 4 */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-indigo-200 transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-xs text-indigo-600 font-medium px-2 py-1 bg-indigo-50 rounded-md font-mono">
                  {profitMargin.toFixed(0)}% هامش
                </span>
              </div>
              <span className="text-xs text-gray-500 block">الربح الصافي للمدرسة</span>
              <div className={`text-2xl font-bold mt-1 font-mono ${netProfit >= 0 ? 'text-indigo-900' : 'text-red-700'}`}>
                {formatCurrency(netProfit)}
              </div>
            </div>
          </div>

          {/* Visual Charts & Bars Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side: Student Distribution per subject */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                توزيع وتعداد الطلاب النشطين حسب المواد التعليمية
              </h4>

              <div className="space-y-4">
                {subjectEntries.map((e, idx) => {
                  const percentage = (e.studentsCount / maxStudentsCount) * 100;
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-gray-700">
                        <span>{e.subject}</span>
                        <span className="text-gray-500">{e.studentsCount} طلاب</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {subjectEntries.length === 0 && (
                  <div className="text-center py-10 text-gray-400 text-xs">
                    لا توجد بيانات طلاب مسجلة لعرض إحصائيات التوزيع.
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Financial comparisons per Subject */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                مقارنة الإيرادات (الطلاب) بالرواتب المدفوعة (الأساتذة)
              </h4>

              <div className="space-y-4">
                {subjectEntries.map((e, idx) => {
                  return (
                    <div key={idx} className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-800">{e.subject}</span>
                        <span className="text-xs font-bold text-gray-500">المعلم: {e.teacherName}</span>
                      </div>
                      
                      {/* Revenue indicator */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-gray-500 font-mono">
                          <span>إجمالي المقبوضات:</span>
                          <span className="text-emerald-700 font-bold">{formatCurrency(e.studentFees)}</span>
                        </div>
                        <div className="w-full bg-gray-200/75 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${Math.max((e.studentFees / maxFees) * 100, 2)}%` }}
                          />
                        </div>
                      </div>

                      {/* Salary indicator */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-gray-500 font-mono">
                          <span>مستحقات المعلم الفرعية:</span>
                          <span className="text-red-600 font-bold">{formatCurrency(e.teacherSalary)}</span>
                        </div>
                        <div className="w-full bg-gray-200/75 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-500 h-full rounded-full"
                            style={{ width: `${Math.max((e.teacherSalary / maxFees) * 100, 2)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {subjectEntries.length === 0 && (
                  <div className="text-center py-10 text-gray-400 text-xs">
                    لا توجد بيانات مالية متوفرة حالياً.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subject breakdowns & Detailed ledger */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
            <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-700" />
              دفتر الحسابات وتفاصيل الديون والصافي حسب المادة التدريسية
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                    <th className="p-3">المادة التدريسية</th>
                    <th className="p-3 text-center">الطلاب المسجلين</th>
                    <th className="p-3 text-left">مداخيل الطلاب</th>
                    <th className="p-3">الأستاذ المعين</th>
                    <th className="p-3 text-left">مستحقات الأستاذ</th>
                    <th className="p-3 text-left">رصيد الأرباح الصافي</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectEntries.map((row, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/40">
                      <td className="p-3 font-semibold text-gray-800">{row.subject}</td>
                      <td className="p-3 text-center text-gray-600 font-medium">{row.studentsCount} طلاب نشطين</td>
                      <td className="p-3 text-left font-mono text-emerald-700 font-bold">{formatCurrency(row.studentFees)}</td>
                      <td className="p-3 text-gray-700 font-medium">{row.teacherName}</td>
                      <td className="p-3 text-left font-mono text-amber-700 font-bold">{formatCurrency(row.teacherSalary)}</td>
                      <td className={`p-3 text-left font-mono font-bold ${row.netProfit >= 0 ? 'text-blue-900' : 'text-red-700'}`}>
                        {formatCurrency(row.netProfit)}
                      </td>
                    </tr>
                  ))}
                  {subjectEntries.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-400">
                        لم يتم تسجيل تفاصيل المواد والأساتذة لتوليد الميزانية التفصيلية.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Monthly Tracker UI */
        <div className="space-y-6">
          {/* Monthly grid selector */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
            <span className="text-xs text-blue-600 font-extrabold block">اختر شهر المراجعة والدراسة للتتبع السنوي:</span>
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2">
              {ACADEMIC_MONTHS.map((month) => {
                const isActive = selectedMonth === month;
                // Count paid in this month
                const paidCount = students.filter(s => s.status === 'active' && s.paidMonths?.includes(month)).length;
                return (
                  <button
                    key={month}
                    onClick={() => setSelectedMonth(month)}
                    className={`p-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col justify-between items-center h-16 ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xs font-black">{month}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold mt-1 ${
                      isActive 
                        ? 'bg-blue-500 text-white font-extrabold' 
                        : paidCount > 0 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-gray-200 text-gray-500'
                    }`}>
                      {paidCount} مسدد
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Monthly financial summaries cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Paid Collected */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-emerald-200 transition-all">
              <span className="text-[11px] text-gray-400 font-bold block">مقبوضات الشهر المسددة 🟢</span>
              <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
                {formatCurrency(
                  students.filter(s => s.status === 'active' && s.paidMonths?.includes(selectedMonth))
                    .reduce((sum, s) => sum + s.amount, 0)
                )}
              </div>
              <span className="text-[10px] text-gray-400 block mt-1">
                من قبل {students.filter(s => s.status === 'active' && s.paidMonths?.includes(selectedMonth)).length} طلاب
              </span>
            </div>

            {/* Pending Outstandings */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-amber-200 transition-all">
              <span className="text-[11px] text-gray-400 font-bold block">مستحقات معلقة (غير مسددة) 🟡</span>
              <div className="text-2xl font-black text-amber-700 mt-1 font-mono">
                {formatCurrency(
                  students.filter(s => s.status === 'active' && !s.paidMonths?.includes(selectedMonth))
                    .reduce((sum, s) => sum + s.amount, 0)
                )}
              </div>
              <span className="text-[10px] text-gray-400 block mt-1">
                من قبل {students.filter(s => s.status === 'active' && !s.paidMonths?.includes(selectedMonth)).length} طلاب لم يدفعوا
              </span>
            </div>

            {/* Teacher monthly wage */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-red-200 transition-all">
              <span className="text-[11px] text-gray-400 font-bold block">نفقات أجور المعلمين المؤطرة 🔴</span>
              <div className="text-2xl font-black text-red-600 mt-1 font-mono">
                {formatCurrency(
                  teachers.reduce((sum, t) => sum + calculateTeacherCompensation(t, students), 0)
                )}
              </div>
              <span className="text-[10px] text-gray-400 block mt-1">
                مستحقات ثابتة ونسب مئوية وساعات
              </span>
            </div>

            {/* Net Profits */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-blue-200 transition-all">
              <span className="text-[11px] text-gray-400 font-bold block">صافي الربح الفعلي لشهر {selectedMonth} 🔵</span>
              {(() => {
                const paidRev = students.filter(s => s.status === 'active' && s.paidMonths?.includes(selectedMonth))
                  .reduce((sum, s) => sum + s.amount, 0);
                const teacherExp = teachers.reduce((sum, t) => sum + calculateTeacherCompensation(t, students), 0);
                const profit = paidRev - teacherExp;
                return (
                  <>
                    <div className={`text-2xl font-black mt-1 font-mono ${profit >= 0 ? 'text-blue-900' : 'text-red-600'}`}>
                      {formatCurrency(profit)}
                    </div>
                    <span className="text-[10px] text-gray-400 block mt-1">
                      صافي مداخيل الاشتراكات ناقص الرواتب
                    </span>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Student payment list tracker table */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs text-blue-600 font-black block">قائمة التتبع المالي والتأشير المدرسي</span>
                <h3 className="text-sm font-bold text-gray-900">حالة اشتراكات الطلاب لشهر: {selectedMonth}</h3>
              </div>
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="البحث باسم التلميذ لمراجعة دفعه..."
                  className="w-full text-xs font-semibold bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 outline-none focus:bg-white focus:border-blue-600 transition-all text-right"
                  value={monthSearchTerm}
                  onChange={e => setMonthSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                    <th className="p-3">اسم التلميذ</th>
                    <th className="p-3">المستوى</th>
                    <th className="p-3">المادة</th>
                    <th className="p-3 text-left">المبلغ الشهري</th>
                    <th className="p-3 text-center">حالة الدفع لشهر {selectedMonth}</th>
                    <th className="p-3 text-left">الإجراءات والطباعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students
                    .filter(s => s.status === 'active')
                    .filter(s => s.name.toLowerCase().includes(monthSearchTerm.toLowerCase()))
                    .map((student) => {
                      const isPaid = student.paidMonths?.includes(selectedMonth);
                      return (
                        <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-3 font-semibold text-gray-950">{student.name}</td>
                          <td className="p-3 text-gray-700 font-medium">{student.cls}</td>
                          <td className="p-3">
                            <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md">
                              {student.subject}
                            </span>
                          </td>
                          <td className="p-3 text-left font-mono font-bold text-gray-800">{formatCurrency(student.amount)}</td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleTogglePayment(student)}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold border transition-all cursor-pointer ${
                                isPaid
                                  ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                              }`}
                            >
                              {isPaid ? '🟢 تم السداد' : '🔴 غير مسدد'}
                            </button>
                          </td>
                          <td className="p-3 text-left whitespace-nowrap">
                            <div className="flex gap-2 justify-end">
                              {onPrintStudent && (
                                <button
                                  onClick={() => onPrintStudent(student)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-[10px] font-bold border border-blue-100/50 transition-all cursor-pointer"
                                  title="طباعة وصل تسديد هذا الشهر"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>طباعة الوصل</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {students.filter(s => s.status === 'active').filter(s => s.name.toLowerCase().includes(monthSearchTerm.toLowerCase())).length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-gray-400">
                        لا يوجد طلاب مطابقين للبحث.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
