/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Student } from '../types';
import { getInitials } from '../utils';
import { Award, Search, Printer, GraduationCap } from 'lucide-react';

interface CertificatesPanelProps {
  students: Student[];
  onPrintClick: (student: Student) => void;
}

export default function CertificatesPanel({ students, onPrintClick }: CertificatesPanelProps) {
  const [query, setQuery] = useState('');

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(query.trim().toLowerCase()) ||
    s.cls.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 space-y-6 text-right" dir="rtl">

      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-gray-150 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-800 justify-start">
            <Award className="w-6 h-6 text-amber-600" />
            <h2 className="text-lg font-extrabold">شهادات النجاح والتفوق القابلة للطباعة</h2>
          </div>
          <p className="text-xs text-gray-500">
            اختر التلميذ(ة) من القائمة أدناه لتوليد شهادة نجاح رسمية جاهزة للطباعة الفورية، مع إمكانية تخصيص نص الاستحقاق والتاريخ.
          </p>
        </div>
      </div>

      {/* Search box */}
      <div className="relative">
        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن تلميذ بالاسم أو القسم..."
          className="w-full text-right text-xs pr-10 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-amber-500 focus:bg-white outline-hidden transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-xs font-bold">
          لا يوجد تلاميذ مطابقون لبحثك حالياً. جرب كلمة أخرى أو تحقق من قائمة التلاميذ أولاً.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((student) => (
            <div
              key={student.id}
              className="p-4 bg-amber-50/40 border border-amber-100 rounded-2xl flex items-center justify-between gap-3 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs shrink-0">
                  {getInitials(student.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{student.name}</p>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    <span className="truncate">{student.cls} • {student.subject}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => onPrintClick(student)}
                title="توليد وطباعة شهادة النجاح"
                className="p-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shrink-0 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
