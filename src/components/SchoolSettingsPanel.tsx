/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SchoolSettings } from '../types';
import { 
  School, 
  GraduationCap, 
  Award, 
  BookOpen, 
  Star, 
  Compass, 
  Library, 
  Phone, 
  MapPin, 
  FileText, 
  Calendar, 
  Image as ImageIcon,
  Smile,
  Upload,
  CheckCircle2,
  Trash2
} from 'lucide-react';

interface SchoolSettingsPanelProps {
  settings: SchoolSettings;
  onSaveSettings: (settings: SchoolSettings) => void;
  isFirebaseSynced: boolean;
}

const PRESET_ICONS = {
  School: School,
  GraduationCap: GraduationCap,
  Award: Award,
  BookOpen: BookOpen,
  Star: Star,
  Compass: Compass,
  Library: Library
};

export default function SchoolSettingsPanel({
  settings,
  onSaveSettings,
  isFirebaseSynced
}: SchoolSettingsPanelProps) {
  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [academicYear, setAcademicYear] = useState(settings.academicYear || '2025/2026');
  const [logoType, setLogoType] = useState<'icon' | 'image' | 'text'>(settings.logoType);
  const [logoValue, setLogoValue] = useState(settings.logoValue);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);
  const [notes, setNotes] = useState(settings.notes || '');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 200 * 1024) {
        alert("⚠️ حجم ملف الشعار كبير جداً! يرجى اختيار صورة بحجم أقل من 200 كيلوبايت لضمان جودة الأداء وسرعة المزامنة السحابية.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoValue(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);

    const updated: SchoolSettings = {
      id: 'school',
      schoolName: schoolName.trim(),
      academicYear: academicYear.trim(),
      logoType,
      logoValue: logoValue.trim(),
      phone: phone.trim(),
      address: address.trim(),
      notes: notes.trim()
    };

    onSaveSettings(updated);
    setSuccessMsg("🎉 تم حفظ وتحديث هوية وشعار المؤسسة بنجاح! سيتم تطبيق هذه التغييرات فوراً عبر كشوف الميزانية وإيصالات الطباعة والواجهة الرئيسية.");
    
    setTimeout(() => {
      setSuccessMsg(null);
    }, 5000);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 space-y-8 text-right" dir="rtl">
      
      {/* Header info */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-gray-150 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-900 justify-start">
            <School className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-extrabold">تخصيص هوية وشعار المؤسسة الخاصة بك</h2>
          </div>
          <p className="text-xs text-gray-500">
            اضبط اسم مدرستك وهويتها البصرية وعناوينها لتظهر بشكل رسمي ومنسق في كشوف الفواتير والوصولات المطبوعة للطلاب والأساتذة.
          </p>
        </div>

        {/* Sync state tag */}
        <div className="self-start sm:self-center">
          {isFirebaseSynced ? (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 font-sans">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>مزامنة الإعدادات السحابية نشطة</span>
            </div>
          ) : (
            <div className="bg-amber-50 text-amber-800 border border-amber-100 rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 font-sans">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>حفظ محلي (قيد المزامنة)</span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Step 1: School General Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block pr-1 flex items-center gap-1 justify-start">
              <School className="w-3.5 h-3.5 text-blue-600" />
              <span>اسم المؤسسة التعليمية:</span>
            </label>
            <input
              type="text"
              required
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="مثال: مدرسة النجاح للتعليم والدعم"
              className="w-full text-right text-xs px-4 py-2.5 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-hidden transition-all font-bold text-gray-900"
              id="settings-school-name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block pr-1 flex items-center gap-1 justify-start">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>الموسم الدراسي النشط:</span>
            </label>
            <input
              type="text"
              required
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="مثال: 2025/2026"
              className="w-full text-right text-xs px-4 py-2.5 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-hidden transition-all font-semibold text-gray-800"
              id="settings-academic-year"
            />
          </div>
        </div>

        {/* Step 2: Branding & Logo selection */}
        <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-150 space-y-4">
          <div>
            <h3 className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5 justify-start">
              🎨 تخصيص شعار وأيقونة المؤسسة
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">اختر نوع الشعار المفضل لمدرستك، يمكنك استخدام أيقونة بيداغوجية، أو رمز تعبيري، أو رفع شعار مخصص بالكامل.</p>
          </div>

          {/* Logo Type selector */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => { setLogoType('icon'); setLogoValue('School'); }}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 transition-all cursor-pointer ${
                logoType === 'icon'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <School className="w-5 h-5" />
              <span>أيقونة تربوية</span>
            </button>

            <button
              type="button"
              onClick={() => { setLogoType('text'); setLogoValue('🏫'); }}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 transition-all cursor-pointer ${
                logoType === 'text'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Smile className="w-5 h-5" />
              <span>رمز تعبيري (Emoji)</span>
            </button>

            <button
              type="button"
              onClick={() => { setLogoType('image'); setLogoValue(''); }}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 transition-all cursor-pointer ${
                logoType === 'image'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <ImageIcon className="w-5 h-5" />
              <span>رفع شعار خاص (صورة)</span>
            </button>
          </div>

          {/* Logo options detail panel */}
          <div className="bg-white p-4 rounded-xl border border-gray-150">
            {logoType === 'icon' && (
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-gray-500 block">اختر أيقونة بيداغوجية لمدرستك:</span>
                <div className="flex flex-wrap gap-2.5">
                  {Object.entries(PRESET_ICONS).map(([key, IconComponent]) => {
                    const isSelected = logoValue === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setLogoValue(key)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 text-blue-700 scale-105 shadow-xs'
                            : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-600'
                        }`}
                        title={key}
                      >
                        <IconComponent className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {logoType === 'text' && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-gray-500 block">اكتب رمزاً تعبيرياً أو حروفا مخصصة (مثال: 🏫 أو 🎓 أو النجاح):</span>
                <input
                  type="text"
                  value={logoValue}
                  onChange={(e) => setLogoValue(e.target.value)}
                  placeholder="مثال: 🏫"
                  className="w-32 text-center text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-hidden font-sans font-bold"
                />
              </div>
            )}

            {logoType === 'image' && (
              <div className="space-y-4">
                <span className="text-[11px] font-bold text-gray-500 block">قم برفع صورة الشعار الرسمية لمؤسستك:</span>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold cursor-pointer transition-all">
                    <Upload className="w-4 h-4 text-gray-500" />
                    <span>اختر ملف صورة...</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  
                  {logoValue ? (
                    <div className="flex items-center gap-3 bg-blue-50/50 p-2 rounded-xl border border-blue-100/50">
                      <img
                        src={logoValue}
                        alt="Logo Preview"
                        className="h-12 w-auto max-w-24 rounded-lg object-contain bg-white p-1 shadow-xs"
                      />
                      <div className="text-right">
                        <span className="text-[10px] text-gray-500 font-bold block">معاينة الشعار المرفوع</span>
                        <button
                          type="button"
                          onClick={() => setLogoValue('')}
                          className="text-[10px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1 mt-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>حذف الشعار</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-400">لم يتم اختيار أي صورة شعار مخصصة بعد.</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Contacts info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block pr-1 flex items-center gap-1 justify-start">
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>رقم الهاتف المعتمد (يظهر في الإيصالات):</span>
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="مثال: 0555-44-33-22"
              className="w-full text-right text-xs px-4 py-2.5 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-hidden transition-all text-gray-800 font-semibold"
              style={{ direction: 'ltr' }}
              id="settings-phone"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block pr-1 flex items-center gap-1 justify-start">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>عنوان المقر الإداري للمدرسة:</span>
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="مثال: الجزائر العاصمة، رويبة"
              className="w-full text-right text-xs px-4 py-2.5 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-hidden transition-all text-gray-800 font-semibold"
              id="settings-address"
            />
          </div>
        </div>

        {/* Step 4: Receipt notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 block pr-1 flex items-center gap-1 justify-start">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>ملاحظات وبنود إيصال التسجيل (تظهر أسفل الوصل المطبوع):</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="مثال: ملاحظة: الرسوم غير قابلة للاسترجاع بعد انطلاق الحصص. يرجى مرافقة التلميذ بانتظام..."
            rows={3}
            className="w-full text-right text-xs px-4 py-3 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-hidden transition-all text-gray-800 leading-relaxed font-semibold"
            id="settings-notes"
          />
        </div>

        {/* Success alerts and Action Buttons */}
        <div className="space-y-4 pt-4 border-t border-gray-150">
          {successMsg && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-4 rounded-2xl text-xs font-bold flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-md transition-all active:scale-98"
              id="save-school-settings-btn"
            >
              <span>حفظ وتطبيق هوية المؤسسة</span>
            </button>
          </div>
        </div>

      </form>

    </div>
  );
}
