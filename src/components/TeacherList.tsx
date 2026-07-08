/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Teacher, Student } from '../types';
import { calculateTeacherCompensation, getInitials, formatCurrency } from '../utils';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Phone, 
  Clock, 
  HelpCircle, 
  DollarSign, 
  Calculator,
  UserCheck,
  Printer
} from 'lucide-react';

interface TeacherListProps {
  teachers: Teacher[];
  students: Student[];
  onAddClick: () => void;
  onEditClick: (teacher: Teacher) => void;
  onDeleteClick: (id: string) => void;
  onPrintClick?: (teacher: Teacher) => void;
}

export default function TeacherList({ teachers, students, onAddClick, onEditClick, onDeleteClick, onPrintClick }: TeacherListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter teachers based on name or subject
  const filteredTeachers = teachers.filter(t => {
    return t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
           t.id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
      
      {/* Directory Title and action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs text-blue-600 font-bold block mb-0.5">شعبة الطاقم البيداغوجي</span>
          <h3 className="text-[15px] font-bold text-gray-900">سجل الأساتذة وإعدادات المستحقات والرواتب</h3>
        </div>
        <button
          onClick={onAddClick}
          className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          id="btn-trigger-add-teacher"
        >
          <Plus className="w-4 h-4" />
          تسجيل أستاذ جديد وتحديد التعويضات
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="بحث باسم الأستاذ، خيار تدريس المادة، أو رقم المعرّف..."
          className="w-full text-xs font-semibold bg-gray-50 border border-gray-300 rounded-xl pr-10 pl-4 py-2.5 focus:bg-white focus:border-blue-600 outline-none transition-colors"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          id="teacher-search-bar"
        />
      </div>

      {/* Teachers Directory Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-xs text-right border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
              <th className="p-3 text-right">الأستاذ</th>
              <th className="p-3 text-right">الهاتف</th>
              <th className="p-3">المادة المسندة</th>
              <th className="p-3">طبيعة المستحقات والتعويض</th>
              <th className="p-3 text-center">أوقات العمل الأسبوعية</th>
              <th className="p-3 text-left bg-blue-50/40 text-blue-900">المستحقات المحتسبة شهرياً</th>
              <th className="p-3 text-left">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTeachers.map((teacher) => {
              // Calculate dynamic dues for this single teacher right now
              const earnedDues = calculateTeacherCompensation(teacher, students);
              
              // Count students enrolled in teacher's subject
              const enrolledCount = students.filter(
                s => s.subject.trim() === teacher.subject.trim() && s.status === 'active'
              ).length;

              return (
                <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors">
                  {/* Name with initials avatar */}
                  <td className="p-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-[10px]">
                        {getInitials(teacher.name)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-950">{teacher.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">معرف: {teacher.id}</div>
                      </div>
                    </div>
                  </td>

                  {/* Mobil phone number */}
                  <td className="p-3 whitespace-nowrap font-mono font-medium text-gray-600 tracking-wide text-right" style={{ direction: 'ltr' }}>
                    {teacher.phone}
                  </td>

                  {/* Subject Badge */}
                  <td className="p-3 whitespace-nowrap">
                    <span className="bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-lg border border-blue-100">
                      {teacher.subject}
                    </span>
                  </td>

                  {/* Compensation details column */}
                  <td className="p-3 whitespace-nowrap">
                    <div className="space-y-0.5">
                      <span className="font-bold text-gray-800">
                        {teacher.compensationType === 'percentage' && `حصة مئوية: ${teacher.compensationValue}%`}
                        {teacher.compensationType === 'fixed' && 'راتب ثابت شهري'}
                        {teacher.compensationType === 'hourly' && `أجر ساعي: ${teacher.compensationValue.toLocaleString()} دج/سا`}
                      </span>
                      <div className="text-[10px] text-gray-400 block font-medium">
                        {teacher.compensationType === 'percentage' && `الطلاب المسجلين بمادته: ${enrolledCount} طلاب`}
                        {teacher.compensationType === 'fixed' && `معدل ثابت: ${teacher.compensationValue.toLocaleString()} دج`}
                        {teacher.compensationType === 'hourly' && `الساعات المنجزة: ${teacher.hoursWorked} ساعة`}
                      </div>
                    </div>
                  </td>

                  {/* Work Day/Time */}
                  <td className="p-3 text-center whitespace-nowrap text-gray-600 font-medium">
                    <div className="space-y-0.5">
                      <span className="font-bold">{teacher.day}</span>
                      <span className="text-[10px] text-gray-400 block font-mono" style={{ direction: 'ltr' }}>{teacher.time}</span>
                    </div>
                  </td>

                  {/* Computed dynamic monthly dues */}
                  <td className="p-3 text-left whitespace-nowrap bg-blue-50/20 text-blue-900 font-mono font-bold text-sm">
                    <div className="space-y-0.5">
                      <span className="text-emerald-800">{formatCurrency(earnedDues)}</span>
                      <span className="text-[9px] text-gray-400 block font-medium">
                        {teacher.compensationType === 'percentage' && 'محتسب حسب مداخيل المسجلين'}
                        {teacher.compensationType === 'fixed' && 'راتب أساسي موحد'}
                        {teacher.compensationType === 'hourly' && 'ضرب الأجر الساعي في العمل'}
                      </span>
                    </div>
                  </td>

                  {/* Actions column */}
                  <td className="p-3 text-left whitespace-nowrap">
                    <div className="flex gap-1.5 justify-end">
                      {onPrintClick && (
                        <button
                          onClick={() => onPrintClick(teacher)}
                          className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                          title="طباعة وثيقة مستحقات الأستاذ"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => onEditClick(teacher)}
                        className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer"
                        title="تعديل شروط المستحقات والحصص"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteClick(teacher.id)}
                        className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-all cursor-pointer"
                        title="حذف الأستاذ نهائياً من سجل المدرسة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

              {filteredTeachers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-gray-400">
                    لا يوجد أساتذة في القائمة يطابقون عبارات البحث المقحمة.
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
