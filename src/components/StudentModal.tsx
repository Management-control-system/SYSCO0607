/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { SUBJECTS, CLASSES, DAYS_OF_WEEK } from '../initialData';
import { X, Check } from 'lucide-react';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Student) => void;
  editingStudent: Student | null;
}

export default function StudentModal({ isOpen, onClose, onSave, editingStudent }: StudentModalProps) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [cls, setCls] = useState(CLASSES[0]);
  const [dob, setDob] = useState('');
  const [parent, setParent] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [amount, setAmount] = useState(3000);
  const [day, setDay] = useState(DAYS_OF_WEEK[0]);
  const [time, setTime] = useState('08:00 - 10:00');
  const [status, setStatus] = useState<'active' | 'suspended'>('active');

  const [validationError, setValidationError] = useState('');

  // Synchronize when editing changes
  useEffect(() => {
    if (editingStudent) {
      setId(editingStudent.id);
      setName(editingStudent.name);
      setCls(editingStudent.cls);
      setDob(editingStudent.dob);
      setParent(editingStudent.parent);
      setPhone(editingStudent.phone);
      setSubject(editingStudent.subject);
      setAmount(editingStudent.amount);
      setDay(editingStudent.day);
      setTime(editingStudent.time);
      setStatus(editingStudent.status);
    } else {
      // Setup random or sequence standard id if adding new
      const randNum = Math.floor(100 + Math.random() * 900);
      setId(`2026-${randNum}`);
      setName('');
      setCls(CLASSES[0]);
      setDob('');
      setParent('');
      setPhone('');
      setSubject(SUBJECTS[0]);
      setAmount(3500);
      setDay(DAYS_OF_WEEK[0]);
      setTime('08:00 - 10:00');
      setStatus('active');
    }
    setValidationError('');
  }, [editingStudent, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!name.trim()) {
      setValidationError('يرجى إدخال اسم الطالب بالكامل.');
      return;
    }
    if (!id.trim()) {
      setValidationError('رقم التسجيل أو المعرف الإداري مطلوب ولا يمكن تركه فارغاً.');
      return;
    }
    if (amount < 0 || isNaN(amount)) {
      setValidationError('قيمة المستحقات يجب أن تكون رقماً يساوى الصفر أو أكبر.');
      return;
    }

    const savedStudent: Student = {
      id: id.trim(),
      name: name.trim(),
      cls,
      dob: dob || 'غير محدد',
      parent: parent.trim() || 'غير مسجل',
      phone: phone.trim() || '—',
      subject,
      amount: Number(amount),
      day,
      time: time.trim() || 'غير محدد',
      status
    };

    onSave(savedStudent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-gray-200/90 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-gray-900">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-md font-bold text-blue-800">
            {editingStudent ? 'تعديل بيانات الطالب وتحديث الدفوعات' : 'تسجيل طالب جديد وتوثيق الدفع'}
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

          {/* Row 1: Name and Registration ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">اسم الطالب بالكامل *</label>
              <input 
                type="text"
                placeholder="أمين بن زياد..."
                className="w-full text-xs font-medium bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-blue-600 outline-none transition-colors"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">رقم التسجيل / المعرّف الفريد *</label>
              <input 
                type="text"
                placeholder="2026-001"
                className="w-full text-xs font-mono font-bold bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-blue-600 outline-none transition-all"
                value={id}
                onChange={e => setId(e.target.value)}
                disabled={!!editingStudent} // Can't change ID of existing student to prevent index mismatch
                required
              />
              {editingStudent && <span className="text-[10px] text-gray-400 block">رقم تعريف الطالب مسجل مسبقاً ولا يمكن تعديله.</span>}
            </div>
          </div>

          {/* Row 2: Class and Date of birth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">القسم / السنة التعليمية</label>
              <select
                className="w-full text-xs font-medium bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-blue-600 outline-none cursor-pointer"
                value={cls}
                onChange={e => setCls(e.target.value)}
              >
                {CLASSES.map((c, idx) => (
                  <option key={idx} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">تاريخ الميلاد</label>
              <input 
                type="date"
                className="w-full text-xs bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 focus:bg-white focus:border-blue-600 outline-none"
                value={dob}
                onChange={e => setDob(e.target.value)}
              />
            </div>
          </div>

          {/* Row 3: Parent credentials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">اسم ولي الأمر</label>
              <input 
                type="text"
                placeholder="عبد القادر بن زياد"
                className="w-full text-xs font-medium bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-blue-600 outline-none"
                value={parent}
                onChange={e => setParent(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">رقم هاتف الولي</label>
              <input 
                type="tel"
                placeholder="0555000000"
                className="w-full text-xs font-medium bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-blue-600 outline-none"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Row 4: Subject and Amount paid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">المادة المسجل فيها *</label>
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
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">دفع المستحقات الشهرية (دج) *</label>
              <input 
                type="number"
                min="0"
                className="w-full text-xs font-bold font-mono bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-emerald-700 focus:bg-white focus:border-blue-600 outline-none"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                required
              />
            </div>
          </div>

          {/* Row 5: Schedule day and Lesson time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">يوم الحضور المخصص</label>
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
              <label className="text-xs font-bold text-gray-700">التوقيت والساعة مسبقاً</label>
              <input 
                type="text"
                placeholder="مثال: 08:00 - 10:00"
                className="w-full text-xs font-medium bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-blue-600 outline-none"
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </div>
          </div>

          {/* Status option */}
          <div className="space-y-2 pt-2 border-t border-gray-100 flex justify-between items-center">
            <label className="text-xs font-bold text-gray-700">حالة ملف التسجيل الحالي</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium">
                <input 
                  type="radio" 
                  name="status" 
                  checked={status === 'active'}
                  onChange={() => setStatus('active')}
                  className="accent-blue-600"
                />
                نشط / مسدد ومثبت
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-amber-700">
                <input 
                  type="radio" 
                  name="status" 
                  checked={status === 'suspended'}
                  onChange={() => setStatus('suspended')}
                  className="accent-amber-600"
                />
                معلّق مؤقتاً
              </label>
            </div>
          </div>

          {/* Action buttons */}
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
              حفظ التلميذ والوصل
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
