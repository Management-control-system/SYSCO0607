/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Student } from '../types';
import { CLASSES } from '../initialData';
import { getInitials, formatCurrency } from '../utils';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  BadgeAlert,
  ArrowRight,
  BookOpen,
  Printer,
  CreditCard
} from 'lucide-react';

interface StudentListProps {
  students: Student[];
  onAddClick: () => void;
  onEditClick: (student: Student) => void;
  onDeleteClick: (id: string) => void;
  onPrintClick?: (student: Student) => void;
  onChargilyPayClick: (student: Student) => void;
}

export default function StudentList({ 
  students, 
  onAddClick, 
  onEditClick, 
  onDeleteClick, 
  onPrintClick,
  onChargilyPayClick
}: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<Student | null>(null);

  // Filter students based on search query and grade
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.id.includes(searchTerm);
    const matchesClass = !selectedClass || s.cls === selectedClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* If looking at a detailed pupil file (Administrative receipt view) */}
      {selectedStudentDetails ? (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-all animate-in fade-in zoom-in duration-300">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <h4 className="text-md font-bold text-gray-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-700" />
              تفاصيل تسجيل التلميذ المالي والإداري الرسمي
            </h4>
            <button
              onClick={() => setSelectedStudentDetails(null)}
              className="flex items-center gap-1.5 text-xs bg-gray-100 text-gray-800 hover:bg-gray-200 px-3.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              رجوع للقائمة الرئيسية
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center bg-blue-50/40 p-4 rounded-xl border border-blue-100/50 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
              {getInitials(selectedStudentDetails.name)}
            </div>
            <div className="space-y-1">
              <h5 className="text-lg font-bold text-gray-900">{selectedStudentDetails.name}</h5>
              <div className="flex flex-wrap gap-2 text-xs text-gray-600 font-medium">
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-bold">
                  {selectedStudentDetails.cls}
                </span>
                <span>•</span>
                <span className="font-mono text-gray-700 font-bold">معرف الطالب: {selectedStudentDetails.id}</span>
              </div>
            </div>
          </div>

          {/* Grid fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80">
              <span className="text-[11px] text-gray-500 font-semibold block mb-1">اسم ولي الأمر بالكامل</span>
              <span className="text-sm font-bold text-gray-950">{selectedStudentDetails.parent}</span>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80">
              <span className="text-[11px] text-gray-500 font-semibold block mb-1">رقم هاتف الولي للتواصل السريع</span>
              <span className="text-sm font-bold text-gray-950 font-mono tracking-wider text-left" style={{ direction: 'ltr' }}>
                {selectedStudentDetails.phone}
              </span>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80">
              <span className="text-[11px] text-gray-500 font-semibold block mb-1">تاريخ ميلاد الطالب</span>
              <span className="text-sm font-bold text-gray-950">{selectedStudentDetails.dob}</span>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80">
              <span className="text-[11px] text-gray-500 font-semibold block mb-1">الحالة الإدارية وسلامة الملف</span>
              <span className="inline-flex mt-1">
                {selectedStudentDetails.status === 'active' ? (
                  <span className="bg-green-100 text-green-800 text-xs px-3 py-0.5 rounded-full font-bold">مكتمل ومسدد</span>
                ) : (
                  <span className="bg-red-100 text-red-800 text-xs px-3 py-0.5 rounded-full font-bold">معلق الدفوعات</span>
                )}
              </span>
            </div>
          </div>

          {/* Financial receipt detail */}
          <div className="mt-5 p-5 bg-emerald-50 text-emerald-950 rounded-2xl border border-emerald-200/70 space-y-3">
            <h5 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <span>💳</span> بيانات المستحقات الشهرية وتلقي الحصص
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
              <div>
                <span className="text-gray-500 block">المادة المسجل بها حالياً:</span>
                <span className="font-bold text-emerald-900 text-sm mt-0.5 block">{selectedStudentDetails.subject}</span>
              </div>
              <div>
                <span className="text-gray-500 block">المبلغ الشهري المدفوع:</span>
                <span className="font-bold text-blue-900 text-sm mt-0.5 block font-mono">
                  {formatCurrency(selectedStudentDetails.amount)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">يوم الحضور المحدد والتوقيت:</span>
                <span className="font-bold text-emerald-900 text-sm mt-0.5 block">
                  {selectedStudentDetails.day} ({selectedStudentDetails.time})
                </span>
              </div>
            </div>
          </div>

          {/* Quick inline controls from details view */}
          <div className="flex flex-wrap justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={() => onChargilyPayClick(selectedStudentDetails)}
              className="flex items-center gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-indigo-200" />
              <span>تسديد الاشتراك عبر البطاقة (الذهبية / CIB)</span>
            </button>
            {onPrintClick && (
              <button
                onClick={() => onPrintClick(selectedStudentDetails)}
                className="flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                طباعة وصل التسجيل
              </button>
            )}
            <button
              onClick={() => {
                onEditClick(selectedStudentDetails);
                setSelectedStudentDetails(null);
              }}
              className="flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              تعديل بيانات الطالب المالية
            </button>
            <button
              onClick={() => setSelectedStudentDetails(null)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              رجوع للقائمة
            </button>
          </div>
        </div>
      ) : (
        /* Main Student table directory list */
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs text-blue-600 font-bold block mb-0.5">القائمة الرسمية</span>
              <h3 className="text-[15px] font-bold text-gray-900">سجل إيداعات وتسجيل وبطاقات الطلاب</h3>
            </div>
            <button
              onClick={onAddClick}
              className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              id="btn-trigger-add-student"
            >
              <Plus className="w-4 h-4" />
              تسجيل تلميذ جديد وتوثيق الدفع
            </button>
          </div>

          {/* Filters shelf */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="بحث بالاسم بالكامل، المادة، أو رقم تسجيل التلميذ..."
                className="w-full text-xs font-semibold bg-gray-50 border border-gray-300 rounded-xl pr-10 pl-4 py-2.5 focus:bg-white focus:border-blue-600 outline-none transition-colors"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                id="student-search-bar"
              />
            </div>
            <select
              className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 text-xs font-bold text-gray-700 cursor-pointer outline-none focus:border-blue-600"
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              id="student-grade-filter"
            >
              <option value="">كل الأقسام والمستويات الدراسية</option>
              {CLASSES.map((c, idx) => (
                <option key={idx} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Table container with overflow support */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                  <th className="p-3 text-right">اسم الطالب</th>
                  <th className="p-3">رقم التسجيل</th>
                  <th className="p-3">القسم الملحق</th>
                  <th className="p-3">المادة المسجلة</th>
                  <th className="p-3 text-left">المستحقات المدفوعة</th>
                  <th className="p-3 text-center">يوم الحضور</th>
                  <th className="p-3 text-center">التوقيت الدراسي</th>
                  <th className="p-3 text-center">حالة الطالب</th>
                  <th className="p-3 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Student Identity */}
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-[10px]">
                          {getInitials(student.name)}
                        </div>
                        <div className="font-semibold text-gray-950">{student.name}</div>
                      </div>
                    </td>

                    {/* ID Card */}
                    <td className="p-3 font-mono font-medium text-gray-600 whitespace-nowrap">
                      <code>{student.id}</code>
                    </td>

                    {/* Class grade Badge */}
                    <td className="p-3 whitespace-nowrap">
                      <span className="bg-gray-100 text-gray-800 font-bold px-2.5 py-1 rounded-lg">
                        {student.cls}
                      </span>
                    </td>

                    {/* Subject Specialty */}
                    <td className="p-3 whitespace-nowrap">
                      <span className="bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-md border border-blue-100">
                        {student.subject}
                      </span>
                    </td>

                    {/* Dues paid */}
                    <td className="p-3 text-left whitespace-nowrap font-mono font-bold text-emerald-800">
                      {formatCurrency(student.amount)}
                    </td>

                    {/* Attendance Day */}
                    <td className="p-3 text-center whitespace-nowrap text-gray-600 font-medium">
                      {student.day}
                    </td>

                    {/* Hour frame */}
                    <td className="p-3 text-center whitespace-nowrap text-gray-600 font-medium" style={{ direction: 'ltr' }}>
                      {student.time}
                    </td>

                    {/* Status Badge */}
                    <td className="p-3 text-center whitespace-nowrap">
                      {student.status === 'active' ? (
                        <span className="inline-block bg-green-100/80 text-green-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          نشط ومثبت
                        </span>
                      ) : (
                        <span className="inline-block bg-amber-100/80 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          معلق مؤقتاً
                        </span>
                      )}
                    </td>

                    {/* Action controls */}
                    <td className="p-3 text-left whitespace-nowrap">
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => onChargilyPayClick(student)}
                          className="p-1.5 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-850 rounded-lg transition-colors cursor-pointer"
                          title="تسديد الاشتراك بالبطاقة الذهبية / CIB"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        {onPrintClick && (
                          <button
                            onClick={() => onPrintClick(student)}
                            className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer"
                            title="طباعة وصل التسجيل مالي"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedStudentDetails(student)}
                          className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-blue-700 rounded-lg transition-colors cursor-pointer"
                          title="عرض الوصل والملف بالكامل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditClick(student)}
                          className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-amber-600 rounded-lg transition-colors cursor-pointer"
                          title="تعديل بيانات الطالب"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteClick(student.id)}
                          className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-all cursor-pointer"
                          title="حذف الطالب نهائياً من السجلات"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-gray-400">
                      لا يوجد تلاميذ مطابقين لمعايير أو عبارات البحث المحددة.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
