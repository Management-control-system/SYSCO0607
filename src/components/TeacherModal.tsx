/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Teacher, CompensationType } from '../types';
import { SUBJECTS, DAYS_OF_WEEK } from '../initialData';
import { X, Check, HelpCircle } from 'lucide-react';

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (teacher: Teacher) => void;
  editingTeacher: Teacher | null;
}

export default function TeacherModal({ isOpen, onClose, onSave, editingTeacher }: TeacherModalProps) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [compensationType, setCompensationType] = useState<CompensationType>('percentage');
  const [compensationValue, setCompensationValue] = useState(60);
  const [hoursWorked, setHoursWorked] = useState(16);
  const [day, setDay] = useState(DAYS_OF_WEEK[0]);
  const [time, setTime] = useState('08:00 - 12:00');

  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (editingTeacher) {
      setId(editingTeacher.id);
      setName(editingTeacher.name);
      setPhone(editingTeacher.phone);
      setSubject(editingTeacher.subject);
      setCompensationType(editingTeacher.compensationType);
      setCompensationValue(editingTeacher.compensationValue);
      setHoursWorked(editingTeacher.hoursWorked);
      setDay(editingTeacher.day);
      setTime(editingTeacher.time);
    } else {
      const randNum = Math.floor(100 + Math.random() * 900);
      setId(`T-${randNum}`);
      setName('');
      setPhone('');
      setSubject(SUBJECTS[0]);
      setCompensationType('percentage');
      setCompensationValue(60); // 60% standard share
      setHoursWorked(16);
      setDay(DAYS_OF_WEEK[0]);
      setTime('08:00 - 12:00');
    }
    setValidationError('');
  }, [editingTeacher, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!name.trim()) {
      setValidationError('يرجى كتابة اسم الأستاذ بالكامل.');
      return;
    }
    if (!id.trim()) {
      setValidationError('معرف الأستاذ مطلوب ولا يمكن تركه فارغاً.');
      return;
    }
    if (compensationValue < 0 || isNaN(compensationValue)) {
      setValidationError('قيمة المستحقات أو نسبة الأستاذ يجب أن تكون قيماً موجبة.');
      return;
    }
    if (compensationType === 'hourly' && (hoursWorked < 0 || isNaN(hoursWorked))) {
      setValidationError('يرجى تحديد عدد الساعات المنجزة بشكل صحيح.');
      return;
    }

    const savedTeacher: Teacher = {
      id: id.trim(),
      name: name.trim(),
      phone: phone.trim() || '—',
      subject,
      compensationType,
      compensationValue: Number(compensationValue),
      hoursWorked: compensationType === 'hourly' ? Number(hoursWorked) : 0,
      day,
      time: time.trim() || 'غير محدد'
    };

    onSave(savedTeacher);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-gray-200/90 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-gray-900">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-md font-bold text-blue-800">
            {editingTeacher ? 'تعديل ملف الأستاذ وشروط المستحقات' : 'تسجيل أستاذ جديد وتحديد طريقة الدفع'}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 px-2 hover:bg-gray-200 rounded-lg text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">
          {validationError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 font-semibold">
              {validationError}
            </div>
          )}

          {/* Row 1: Name and ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">اسم الأستاذ بالكامل *</label>
              <input 
                type="text"
                placeholder="الأستاذ بوعلي محمد..."
                className="w-full text-xs font-medium bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-blue-600 outline-none transition-colors"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">معرّف الأستاذ (جديد أو تلقائي) *</label>
              <input 
                type="text"
                placeholder="T-101"
                className="w-full text-xs font-mono font-bold bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-blue-600 outline-none transition-all"
                value={id}
                onChange={e => setId(e.target.value)}
                disabled={!!editingTeacher}
                required
              />
              {editingTeacher && <span className="text-[10px] text-gray-400 block">رقم معرّف الأستاذ مسجل مسبقاً ولا يمكن تعديله.</span>}
            </div>
          </div>

          {/* Row 2: Phone and Subject Specialty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">رقم الهاتف</label>
              <input 
                type="tel"
                placeholder="0666000000"
                className="w-full text-xs font-medium bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-blue-600 outline-none"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">المادة التدريسية الموكلة إليه *</label>
              <select
                className="w-full text-xs font-bold bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-blue-600 outline-none cursor-pointer"
                value={subject}
                onChange={e => setSubject(e.target.value)}
              >
                {SUBJECTS.map((sub, idx) => (
                  <option key={idx} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Compensation Settings Section Card */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-3">
            <h4 className="text-xs font-bold text-blue-800 flex items-center gap-1">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              تحديد طبيعة المستحقات وحساب الرواتب
            </h4>

            {/* Selection of Compensation Type */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCompensationType('percentage');
                  setCompensationValue(60); // standard
                }}
                className={`py-2 px-3 text-center border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  compensationType === 'percentage' 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 bg-white hover:bg-gray-100 text-gray-600'
                }`}
              >
                نسبة مئوية (%)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCompensationType('fixed');
                  setCompensationValue(20000); // generic standard
                }}
                className={`py-2 px-3 text-center border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  compensationType === 'fixed' 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 bg-white hover:bg-gray-100 text-gray-600'
                }`}
              >
                راتب ثابت (دج)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCompensationType('hourly');
                  setCompensationValue(1500); // standard hourly fee
                }}
                className={`py-2 px-3 text-center border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  compensationType === 'hourly' 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 bg-white hover:bg-gray-100 text-gray-600'
                }`}
              >
                دفع بالساعة (دج)
              </button>
            </div>

            {/* Compensation Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">
                  {compensationType === 'percentage' && 'النسبة المئوية للأستاذ (%)'}
                  {compensationType === 'fixed' && 'قيمة الراتب الشهري الثابت (دج)'}
                  {compensationType === 'hourly' && 'سعر الساعة الدراسية الواحد (دج)'}
                </label>
                <input 
                  type="number"
                  min="0"
                  className="w-full text-xs font-bold font-mono bg-white border border-gray-300 rounded-xl px-3 py-2 text-blue-900 outline-none focus:border-blue-600"
                  value={compensationValue}
                  onChange={e => setCompensationValue(Number(e.target.value))}
                  required
                />
              </div>

              {compensationType === 'hourly' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">عدد الساعات المنجزة شهريا</label>
                  <input 
                    type="number"
                    min="0"
                    className="w-full text-xs font-bold font-mono bg-white border border-gray-300 rounded-xl px-3 py-2 text-blue-900 outline-none focus:border-blue-600"
                    value={hoursWorked}
                    onChange={e => setHoursWorked(Number(e.target.value))}
                    required
                  />
                </div>
              )}
            </div>

            {/* Explanation dynamic notice */}
            <div className="text-[10px] text-gray-500 font-medium leading-relaxed">
              {compensationType === 'percentage' && (
                <span>ℹ️ سيتم تجميع مداخيل الطلاب المسجلين والنشطين في مادة <b>{subject}</b> ثم تخصيص نسبة <b>{compensationValue}%</b> منها كقيمة راتب للأستاذ.</span>
              )}
              {compensationType === 'fixed' && (
                <span>ℹ️ سيحصل الأستاذ بصفة دورية على مبلغ ثابت قدره <b>{compensationValue.toLocaleString()} دج</b> دون الخضوع لعدد الطلاب المسجلين في مادته.</span>
              )}
              {compensationType === 'hourly' && (
                <span>ℹ️ سيحصل الأستاذ على مبلغ مستحق قدره <b>{(compensationValue * hoursWorked).toLocaleString()} دج</b> (معدل {compensationValue.toLocaleString()} دج لـ {hoursWorked} ساعة).</span>
              )}
            </div>
          </div>

          {/* Row 4: Teaching Day and Lesson Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">يوم التدريس الأسبوعي</label>
              <select
                className="w-full text-xs font-medium bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-blue-600 outline-none cursor-pointer"
                value={day}
                onChange={e => setDay(e.target.value)}
              >
                {DAYS_OF_WEEK.map((d, idx) => (
                  <option key={idx} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">توقيت الحصّة والمدة الزمنية</label>
              <input 
                type="text"
                placeholder="مثال: 08:00 - 12:00"
                className="w-full text-xs font-medium bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-blue-600 outline-none"
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button 
              type="submit"
              className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              حفظ الأستاذ والبيانات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
