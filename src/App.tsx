/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Student, Teacher, SavedPin, UserSession, SchoolSettings } from './types';
import { INITIAL_STUDENTS, INITIAL_TEACHERS } from './initialData';
import { getSavedState, saveState, formatCurrency, hashPinLocal } from './utils';

import StudentList from './components/StudentList';
import TeacherList from './components/TeacherList';
import DashboardStats from './components/DashboardStats';
import StudentModal from './components/StudentModal';
import TeacherModal from './components/TeacherModal';
import PinLogin from './components/PinLogin';
import SecuritySettings from './components/SecuritySettings';
import ReceiptModal from './components/ReceiptModal';
import SchoolSettingsPanel from './components/SchoolSettingsPanel';
import ChargilyPaymentModal from './components/ChargilyPaymentModal';
import SaaSSubscriptionPanel from './components/SaaSSubscriptionPanel';
import CertificatesPanel from './components/CertificatesPanel';
import CertificateModal from './components/CertificateModal';

import { motion } from 'motion/react';
import { 
  Users, 
  GraduationCap, 
  Briefcase, 
  BarChart3, 
  Calendar, 
  Wallet,
  Settings,
  HelpCircle,
  TrendingUp,
  School,
  LogOut,
  Fingerprint,
  Award,
  BookOpen,
  Star,
  Compass,
  Library
} from 'lucide-react';

import {
  initFirebaseService,
  subscribeToStudents,
  subscribeToTeachers,
  subscribeToSchoolSettings,
  dbSaveStudent,
  dbDeleteStudent,
  dbSaveTeacher,
  dbDeleteTeacher,
  dbSaveSchoolSettings,
  uploadLocalDataToFirebase,
  signOutFirebase
} from './services/firebase';
import { apiListPins, apiAddPin, apiDeletePin, apiVerifyPaymentStatus } from './services/api';

const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  id: 'school',
  schoolName: 'مدرسة النجاح الخاصة للتعليم والدعم',
  logoType: 'icon',
  logoValue: 'School',
  phone: '0555-44-33-22',
  address: 'ولاية الجزائر، الجزائر',
  notes: 'ملاحظة: الرسوم المدفوعة غير قابلة للاسترجاع بعد انطلاق الحصص. يرجى مرافقة التلميذ بانتظام.',
  academicYear: '2025/2026'
};

export default function App() {
  // Active user session
  const [userSession, setUserSession] = useState<UserSession | null>(() => 
    getSavedState<UserSession | null>('nj_school_session', null)
  );

  // States loaded dynamically based on active session's schoolId
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [pins, setPins] = useState<SavedPin[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL_SETTINGS);

  // Firebase status
  const [isFirebaseActive, setIsFirebaseActive] = useState(false);

  // Dynamically load partition-specific data on school session change
  useEffect(() => {
    if (userSession?.schoolId) {
      const { schoolId } = userSession;
      setStudents(getSavedState<Student[]>(`nj_school_students_${schoolId}`, schoolId === 'najah' ? INITIAL_STUDENTS : []));
      setTeachers(getSavedState<Teacher[]>(`nj_school_teachers_${schoolId}`, schoolId === 'najah' ? INITIAL_TEACHERS : []));
      // PINs are only ever loaded from localStorage in fully-offline mode.
      // In cloud mode they're fetched on demand via apiListPins() (see the
      // dedicated effect below), never stored client-side otherwise.
      setPins(getSavedState<SavedPin[]>(`nj_school_pins_${schoolId}`, []));
      setSchoolSettings(getSavedState<SchoolSettings>(`nj_school_settings_${schoolId}`, DEFAULT_SCHOOL_SETTINGS));
    } else {
      setStudents([]);
      setTeachers([]);
      setPins([]);
      setSchoolSettings(DEFAULT_SCHOOL_SETTINGS);
    }
  }, [userSession?.schoolId]);

  // Synchronize with LocalStorage on updates (fallback or offline storage per school)
  useEffect(() => {
    if (userSession?.schoolId) {
      saveState(`nj_school_students_${userSession.schoolId}`, students);
    }
  }, [students, userSession?.schoolId]);

  useEffect(() => {
    if (userSession?.schoolId) {
      saveState(`nj_school_teachers_${userSession.schoolId}`, teachers);
    }
  }, [teachers, userSession?.schoolId]);

  useEffect(() => {
    if (userSession?.schoolId) {
      saveState(`nj_school_pins_${userSession.schoolId}`, pins);
    }
  }, [pins, userSession?.schoolId]);

  useEffect(() => {
    if (userSession?.schoolId) {
      saveState(`nj_school_settings_${userSession.schoolId}`, schoolSettings);
    }
  }, [schoolSettings, userSession?.schoolId]);

  useEffect(() => {
    saveState('nj_school_session', userSession);
  }, [userSession]);

  // After returning from Chargily's checkout page, we only get cosmetic
  // `payment_return=success|failed` + `kind` flags back — nothing sensitive,
  // and nothing that by itself changes any data (see server/chargilyRoutes.ts
  // for why). The actual confirmation already happened, or will shortly
  // happen, via Chargily's signed webhook hitting our backend directly;
  // here we just poll our own read-only status endpoint a few times so we
  // can show a friendly "confirmed" toast, while the real-time Firestore
  // listeners above will reflect the new data regardless.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentReturn = params.get('payment_return');
    const kind = params.get('kind') === 'subscription' ? 'subscription' : 'payment';

    if (!paymentReturn) return;
    window.history.replaceState({}, document.title, window.location.pathname);

    if (paymentReturn === 'failed') {
      displayAlert(
        kind === 'subscription'
          ? '❌ تم إلغاء ترقية اشتراك مساحة العمل أو فشلت معالجة الفاتورة عبر بوابة Chargily.'
          : '❌ تم إلغاء عملية الدفع عبر بوابة Chargily أو انتهت مهلتها.'
      );
      return;
    }

    if (paymentReturn !== 'success' || !isFirebaseActive) return;

    displayAlert('⏳ جاري التحقق من تأكيد عملية الدفع مع خادم Chargily بأمان...');

    let attempts = 0;
    const maxAttempts = 6;
    const interval = setInterval(async () => {
      attempts += 1;
      try {
        const status = await apiVerifyPaymentStatus(kind);
        if (status.status === 'paid') {
          clearInterval(interval);
          displayAlert(
            kind === 'subscription'
              ? '🎉 [ترقية مؤكدة] تم تفعيل اشتراك مساحتك التعليمية بنجاح!'
              : `🎉 [دفع مؤكد] تم تأكيد استلام الدفعة الإلكترونية بنجاح لشهر (${status.month || ''}).`
          );
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
        }
      } catch {
        if (attempts >= maxAttempts) clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isFirebaseActive]);

  // Initialize Firebase connection status
  useEffect(() => {
    initFirebaseService((active) => {
      setIsFirebaseActive(active);
    });
  }, []);

  // Listen for Cloud updates in real-time if Firebase is active for the current schoolId
  useEffect(() => {
    if (!isFirebaseActive || !userSession?.schoolId) return;

    const { schoolId } = userSession;

    const unsubStudents = subscribeToStudents(schoolId, (list) => {
      setStudents(list);
    });

    const unsubTeachers = subscribeToTeachers(schoolId, (list) => {
      setTeachers(list);
    });

    const unsubSettings = subscribeToSchoolSettings(schoolId, (settings) => {
      if (settings && settings.schoolName) {
        setSchoolSettings(settings);
      }
    });

    return () => {
      if (unsubStudents) unsubStudents();
      if (unsubTeachers) unsubTeachers();
      if (unsubSettings) unsubSettings();
    };
  }, [isFirebaseActive, userSession?.schoolId]);

  // Fetch the staff PIN list from the backend (admin-only). PINs are never
  // synced via a live Firestore listener — they're not readable by the
  // client at all; this is a plain on-demand fetch through our own API.
  const refreshCloudPins = async () => {
    if (!isFirebaseActive || !userSession || userSession.role !== 'admin') return;
    try {
      const list = await apiListPins();
      setPins(list.map(p => ({ id: p.id, pin: '', label: p.label, role: p.role, createdAt: p.createdAt })));
    } catch (error) {
      console.error('Error fetching PIN list:', error);
    }
  };

  useEffect(() => {
    if (isFirebaseActive && userSession?.role === 'admin') {
      refreshCloudPins();
    }
  }, [isFirebaseActive, userSession?.schoolId, userSession?.role]);

  // Sync / Migrate Local Data to Firebase once on activation
  useEffect(() => {
    if (isFirebaseActive && userSession?.schoolId) {
      const { schoolId } = userSession;
      const migrationKey = `nj_school_migrated_${schoolId}`;
      const isSchoolMigrated = getSavedState<boolean>(migrationKey, false);

      if (!isSchoolMigrated && (students.length > 0 || teachers.length > 0)) {
        const runMigration = async () => {
          try {
            await uploadLocalDataToFirebase(schoolId, students, teachers);
            saveState(migrationKey, true);
            console.log(`Firebase migration completed for school workspace: ${schoolId}`);
          } catch (error) {
            console.error('Error during automatic data migration:', error);
          }
        };
        runMigration();
      }
    }
  }, [isFirebaseActive, userSession?.schoolId, students.length, teachers.length]);

  // Log in session handler
  const handleLoginSuccess = (pin: SavedPin, schoolId: string, customSettings?: SchoolSettings) => {
    const session: UserSession = {
      pinId: pin.id,
      label: pin.label,
      role: pin.role,
      schoolId: schoolId,
      loginTime: new Date().toISOString()
    };
    setUserSession(session);
    if (customSettings) {
      setSchoolSettings(customSettings);
    }
    displayAlert(`مرحباً بك في ${customSettings?.schoolName || 'مساحة العمل'}! تم تسجيل الدخول الآمن بنجاح.`);
  };

  const handleLogout = () => {
    if (window.confirm('🔒 هل تريد قفل لوحة التحكم وتسجيل الخروج؟')) {
      signOutFirebase();
      setUserSession(null);
      setActiveTab('students');
    }
  };

  // Current active navigation tab: 'students' | 'teachers' | 'stats' | 'certificates' | 'security' | 'settings' | 'subscription'
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'stats' | 'certificates' | 'security' | 'settings' | 'subscription'>('students');

  const handleUpdateSubscription = async (plan: 'bronze' | 'gold' | 'ultimate', expiryDays: number) => {
    if (!userSession) return;
    const { schoolId } = userSession;
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    const updatedSettings: SchoolSettings = {
      ...schoolSettings,
      subscriptionStatus: 'active',
      subscriptionPlan: plan,
      subscriptionExpiry: expiryDate.toISOString()
    };

    setSchoolSettings(updatedSettings);
    saveState(`nj_school_settings_${schoolId}`, updatedSettings);

    if (isFirebaseActive) {
      await dbSaveSchoolSettings(schoolId, updatedSettings);
    }

    displayAlert(`🎉 [ترقية مؤكدة] تهانينا! تم تجديد وتفعيل خطتك السنوية (${plan === 'gold' ? 'الذهبية المتكاملة' : plan === 'bronze' ? 'البرونزية' : 'الاحترافية المطلقة'}) لمساحتك التعليمية بنجاح!`);
  };

  const handleSaveSchoolSettings = async (settings: SchoolSettings) => {
    if (!userSession) return;
    const { schoolId } = userSession;
    setSchoolSettings(settings);
    if (isFirebaseActive) {
      await dbSaveSchoolSettings(schoolId, settings);
    }
  };

  // Modals state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Printable receipt state
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [activeReceiptStudent, setActiveReceiptStudent] = useState<Student | null>(null);
  const [activeReceiptTeacher, setActiveReceiptTeacher] = useState<Teacher | null>(null);

  // Printable success certificate state
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [certStudent, setCertStudent] = useState<Student | null>(null);

  // Chargily Pay State
  const [isChargilyModalOpen, setIsChargilyModalOpen] = useState(false);
  const [chargilyStudent, setChargilyStudent] = useState<Student | null>(null);

  const handleOpenChargilyPay = (student: Student) => {
    setChargilyStudent(student);
    setIsChargilyModalOpen(true);
  };

  const handlePaymentRecorded = async (studentId: string, month: string, amount: number) => {
    if (!userSession) return;
    const { schoolId } = userSession;
    
    const updated = students.map(s => {
      if (s.id === studentId) {
        const currentPaid = s.paidMonths || [];
        if (!currentPaid.includes(month)) {
          return { ...s, paidMonths: [...currentPaid, month] };
        }
      }
      return s;
    });

    setStudents(updated);
    
    const student = updated.find(s => s.id === studentId);
    if (student) {
      if (isFirebaseActive) {
        await dbSaveStudent(schoolId, student);
      }
      displayAlert(`🎉 [دفع مؤكد] تم تسجيل دفع (${formatCurrency(amount)}) لشهر (${month}) للتلميذ (${student.name}) بنجاح.`);
    }
  };

  // Toast / Status Alerts
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const displayAlert = (msg: string) => {
    setAlertMessage(msg);
    setTimeout(() => {
      setAlertMessage(null);
    }, 4500);
  };

  // Student CRUD operations
  const handleSaveStudent = async (student: Student) => {
    if (!userSession) return;
    const { schoolId } = userSession;
    if (isFirebaseActive) {
      await dbSaveStudent(schoolId, student);
      displayAlert(`[سحابي] تم حفظ بيانات المتمدرس (${student.name}) بنجاح!`);
    } else {
      // Local Database Fallback
      if (editingStudent) {
        setStudents(prev => prev.map(s => s.id === student.id ? student : s));
        displayAlert(`تم تحديث بيانات التلميذ (${student.name}) والدفوعات بنجاح!`);
      } else {
        if (students.some(s => s.id === student.id)) {
          alert('رقم التسجيل هذا مستخدم بالفعل من قبل طالب آخر!');
          return;
        }
        setStudents(prev => [...prev, student]);
        displayAlert(`تم تسجيل التلميذ (${student.name}) وتوثيق الدفع بنجاح!`);
      }
    }
    setIsStudentModalOpen(false);
    setEditingStudent(null);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsStudentModalOpen(true);
  };

  const handleDeleteStudent = async (id: string) => {
    if (!userSession) return;
    const { schoolId } = userSession;
    const student = students.find(s => s.id === id);
    if (!student) return;
    
    if (window.confirm(`⚠️ تنبيه إداري حاسم: هل أنت متأكد من رغبتك في حذف ملف الطالب (${student.name}) نهائياً؟`)) {
      if (isFirebaseActive) {
        await dbDeleteStudent(schoolId, id);
        displayAlert(`[سحابي] تم إزالة التلميذ (${student.name}) بنجاح.`);
      } else {
        setStudents(prev => prev.filter(s => s.id !== id));
        displayAlert(`تم حذف ملف الطالب (${student.name}) بنجاح من السجلات المحلية.`);
      }
    }
  };

  // Teacher CRUD operations
  const handleSaveTeacher = async (teacher: Teacher) => {
    if (!userSession) return;
    const { schoolId } = userSession;
    if (isFirebaseActive) {
      await dbSaveTeacher(schoolId, teacher);
      displayAlert(`[سحابي] تم حفظ بيانات الأستاذ (${teacher.name}) بنجاح!`);
    } else {
      // Local Database Fallback
      if (editingTeacher) {
        setTeachers(prev => prev.map(t => t.id === teacher.id ? teacher : t));
        displayAlert(`تم تحديث بيانات الأستاذ (${teacher.name}) والتعويضات الدورية بنجاح!`);
      } else {
        if (teachers.some(t => t.id === teacher.id)) {
          alert('معرف الأستاذ هذا مستخدم مسبقاً! يرجى اختيار رمز تعريف آخر.');
          return;
        }
        setTeachers(prev => [...prev, teacher]);
        displayAlert(`تم تسجيل الأستاذ (${teacher.name}) وتوطين شروط مستحقاته المادية بنجاح!`);
      }
    }
    setIsTeacherModalOpen(false);
    setEditingTeacher(null);
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsTeacherModalOpen(true);
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!userSession) return;
    const { schoolId } = userSession;
    const teacher = teachers.find(t => t.id === id);
    if (!teacher) return;

    if (window.confirm(`⚠️ تحذير: هل أنت متأكد من شطب ملف الأستاذ (${teacher.name}) وإلغاء حصصه ومستحقاته المالية؟`)) {
      if (isFirebaseActive) {
        await dbDeleteTeacher(schoolId, id);
        displayAlert(`[سحابي] تم حذف ملف الأستاذ (${teacher.name}) من السحابة.`);
      } else {
        setTeachers(prev => prev.filter(t => t.id !== id));
        displayAlert(`تم إزالة الأستاذ (${teacher.name}) من كشوف الطاقم بنجاح.`);
      }
    }
  };

  // PIN code management
  const handleAddPin = async (label: string, pinCode: string, role: 'admin' | 'staff') => {
    if (!userSession) return;
    if (isFirebaseActive) {
      await apiAddPin(label, pinCode, role);
      await refreshCloudPins();
    } else {
      const newPin: SavedPin = {
        id: 'pin_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        pin: await hashPinLocal(pinCode),
        label,
        role,
        createdAt: new Date().toISOString()
      };
      setPins(prev => [...prev, newPin]);
    }
  };

  const handleDeletePin = async (id: string) => {
    if (!userSession) return;
    if (isFirebaseActive) {
      await apiDeletePin(id);
      await refreshCloudPins();
    } else {
      setPins(prev => prev.filter(p => p.id !== id));
    }
  };

  // Header quick statistics counters
  const studentRevenues = students.filter(s => s.status === 'active').reduce((sum, s) => sum + s.amount, 0);
  const formattedRevenues = formatCurrency(studentRevenues);

  // SaaS subscription variables
  const expiryDateStr = schoolSettings.subscriptionExpiry;
  const rawSubStatus = schoolSettings.subscriptionStatus || 'expired';
  const subStatus = rawSubStatus === 'trial' ? 'expired' : rawSubStatus;
  let subscriptionDaysRemaining = 0;
  if (subStatus === 'active' && expiryDateStr) {
    const diffTime = new Date(expiryDateStr).getTime() - Date.now();
    subscriptionDaysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  // If there is no active logged-in user session, enforce PinLogin first!
  if (!userSession) {
    return (
      <PinLogin 
        isFirebaseActive={isFirebaseActive}
        onLoginSuccess={handleLoginSuccess}
        fallbackAdminPin="2026"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-16">
      
      {/* 1. Header Banner & Logo */}
      <header className="bg-white border-b border-gray-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Logo Brand Frame */}
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              {schoolSettings.logoType === 'icon' ? (
                (() => {
                  const PRESET_ICONS = { School, GraduationCap, Award, BookOpen, Star, Compass, Library };
                  const IconComponent = PRESET_ICONS[schoolSettings.logoValue as keyof typeof PRESET_ICONS] || School;
                  return <IconComponent className="w-7 h-7 text-blue-700" />;
                })()
              ) : schoolSettings.logoType === 'text' ? (
                <span className="text-2xl p-1 font-sans">{schoolSettings.logoValue || '🏫'}</span>
              ) : schoolSettings.logoType === 'image' && schoolSettings.logoValue ? (
                <img 
                  src={schoolSettings.logoValue}
                  alt="شعار المدرسة"
                  className="h-10 w-auto rounded-lg object-contain max-w-28"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <img 
                  src="https://scontent.faae1-1.fna.fbcdn.net/v/t1.15752-9/535575380_766411842414847_6734401257965136101_n.jpg?stp=dst-jpg_s480x480_tt6&_nc_cat=107&ccb=1-7&_nc_sid=0024fc&_nc_eui2=AeEOU6Ah_ShYNqWyg70a-m-XTWJeV1xOtJBNYl5XXE60kK9pzidq2nYoHNe59CTeMaC5ADUjKi1YMn1naQc-jyrG&_nc_ohc=gO4f5WugaHgQ7kNvwFiph8X&_nc_oc=AdqedIlBrImqdluOuzVWFBwqZjslramrgpQgMGi9ckmauOvKGnb77CYSquMpiWDg6Pg&_nc_ad=z-m&_nc_cid=1060&_nc_zt=23&_nc_ht=scontent.faae1-1.fna&_nc_ss=7a22e&oh=03_Q7cD5gEsD3mzaaLaVZ7Q8adtjvWhFo_jJqvdXOexiwnPJMy3hA&oe=6A456A68"
                  alt="شعار مدرسة النجاح"
                  className="h-10 w-auto rounded-lg object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              )}
            </div>
            <div className="space-y-0.5 justify-start text-right">
              <div className="flex items-center gap-1.5 justify-start">
                <School className="w-5 h-5 text-blue-700" />
                <h1 className="text-md sm:text-lg font-extrabold text-blue-900 tracking-tight">{schoolSettings.schoolName}</h1>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium">
                لوحة التحكم والتنظيم المالي والإداري • إدارة المتعهدين والطلاب والأساتذة
              </p>
            </div>
          </div>

          {/* Quick Realtime header counters */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
            <div className="bg-emerald-50 text-emerald-900 px-3.5 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-2 text-xs font-bold">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>مداخيل المدرسة النشطة: {formattedRevenues}</span>
            </div>
            
            <div className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 font-sans">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>الموسم الدراسي: {schoolSettings.academicYear || '2025/2026'}</span>
            </div>
          </div>

        </div>
      </header>

      {/* 2. Main Container: left sidebar navigation + content column */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start" dir="ltr">

          {/* Left Sidebar Navigation */}
          <aside dir="rtl" className="w-full lg:w-72 shrink-0 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-3 space-y-1">

              <button
                onClick={() => setActiveTab('students')}
                className={`w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer justify-start ${
                  activeTab === 'students'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                id="tab-students"
              >
                <Users className="w-4 h-4 shrink-0" />
                <span className="truncate">قائمة التلاميذ والمسجلين ({students.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('teachers')}
                className={`w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer justify-start ${
                  activeTab === 'teachers'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                id="tab-teachers"
              >
                <GraduationCap className="w-4 h-4 shrink-0" />
                <span className="truncate">قائمة الأساتذة والمستحقات ({teachers.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('stats')}
                className={`w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer justify-start ${
                  activeTab === 'stats'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                id="tab-stats"
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span className="truncate">الإحصائيات المالية والتقارير الشهرية</span>
              </button>

              <button
                onClick={() => setActiveTab('certificates')}
                className={`w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer justify-start ${
                  activeTab === 'certificates'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-700 hover:bg-amber-50'
                }`}
                id="tab-certificates"
              >
                <Award className="w-4 h-4 shrink-0" />
                <span className="truncate">شهادات النجاح (قابلة للطباعة)</span>
              </button>

              {/* Admin-only section */}
              {userSession.role === 'admin' && (
                <>
                  <div className="pt-3 mt-2 border-t border-gray-100">
                    <p className="px-4 pb-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">إدارة المؤسسة</p>
                  </div>

                  <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer justify-start ${
                      activeTab === 'security'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-indigo-600 hover:bg-indigo-50'
                    }`}
                    id="tab-security"
                  >
                    <Fingerprint className="w-4 h-4 shrink-0" />
                    <span className="truncate">إعدادات الأمان والتراخيص ({pins.length + 1})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer justify-start ${
                      activeTab === 'settings'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                    id="tab-settings"
                  >
                    <School className="w-4 h-4 shrink-0" />
                    <span className="truncate">هوية المؤسسة والشعار</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('subscription')}
                    className={`w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer justify-start ${
                      activeTab === 'subscription'
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'text-purple-700 hover:bg-purple-50'
                    }`}
                    id="tab-subscription"
                  >
                    <Wallet className="w-4 h-4 shrink-0" />
                    <span className="truncate">اشتراك المنصة والدفع ({schoolSettings.subscriptionStatus === 'active' ? 'نشط' : 'تحتاج تجديد'})</span>
                  </button>
                </>
              )}

            </div>

            {/* Logout button, moved into sidebar footer for a cleaner header */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-900 rounded-2xl text-xs font-bold border border-red-100/50 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>قفل الخروج</span>
            </button>
          </aside>

          {/* Content column */}
          <div dir="rtl" className="flex-1 min-w-0 space-y-6">

            {/* SaaS Subscription Status Alerts for School Directors */}
            {userSession.role === 'admin' && subStatus === 'expired' && activeTab === 'subscription' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-3xl border text-right shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-red-50 border-red-200 text-red-950"
                dir="rtl"
              >
                <div className="flex items-start gap-3 justify-start">
                  <span className="text-2xl mt-0.5">🛑</span>
                  <div className="space-y-1">
                    <h3 className="text-xs font-black">
                      مساحة العمل غير نشطة - بانتظار تفعيل الاشتراك السنوي
                    </h3>
                    <p className="text-[11px] text-gray-600 leading-relaxed font-semibold">
                      يرجى تسديد رسوم التنشيط السنوية لتفعيل نظام إدارة التلاميذ والأساتذة ومزامنة الأجهزة السحابية. اشتراكك محمي بالكامل بـ <strong>ضمان استرداد الأموال بنسبة 100% خلال 7 أيام (أسبوع كامل)</strong> إذا لم تجد الخدمة مناسبة لمؤسستك.
                    </p>
                  </div>
                </div>

                <div className="self-end md:self-center shrink-0">
                  <button
                    onClick={() => {
                      window.scrollTo({ top: document.getElementById('tab-subscription')?.offsetTop || 300, behavior: 'smooth' });
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <span>تفعيل الاشتراك السنوي بالبطاقة الذهبية 💳</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Active user status bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-blue-50/45 px-5 py-2.5 rounded-2xl border border-blue-100/40 text-[11px] font-bold text-blue-950 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">👤</span>
                <span>المستخدم الحالي: <span className="underline">{userSession.label}</span> ({userSession.role === 'admin' ? 'مدير عام كامل الصلاحيات' : 'موظف مأذون له'})</span>
              </div>
              {isFirebaseActive ? (
                <div className="text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>موصول بالشبكة السحابية المشتركة (الهاتف والكمبيوتر متطابقان فورياً)</span>
                </div>
              ) : (
                <div className="text-gray-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                  <span>قاعدة بيانات محلية نشطة (سيتم المزامنة تلقائياً عند الاتصال)</span>
                </div>
              )}
            </div>

            {/* Alerts / Banner Notifications */}
            {alertMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-blue-950 text-white rounded-2xl border border-blue-900 shadow-lg text-xs font-bold flex items-center gap-2"
              >
                <span className="text-base">🔔</span>
                <span>{alertMessage}</span>
              </motion.div>
            )}
        {/* 3. Panel Views rendering */}
        <div className="transition-all duration-300">
          {subStatus !== 'active' && activeTab !== 'subscription' ? (
            <div className="bg-white rounded-3xl border border-red-100 p-8 text-center space-y-6 max-w-2xl mx-auto shadow-md" dir="rtl">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto">
                🔒
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-black text-red-950">مساحة عمل مؤسستك غير نشطة حالياً</h3>
                <p className="text-xs text-gray-600 leading-relaxed max-w-md mx-auto">
                  لقد تم تسجيل مدرستك بنجاح! للبدء في إضافة التلاميذ، إسناد الأساتذة، استلام المدفوعات وإصدار الوصولات، يرجى تفعيل أحد الاشتراكات السنوية للمنصة.
                </p>
              </div>

              {/* Guarantee alert inside the lock card */}
              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 text-amber-950 text-right max-w-md mx-auto space-y-2">
                <h4 className="text-xs font-black flex items-center gap-1.5 justify-start">
                  🛡️ <span>ضمان استرداد الأموال بنسبة 100% خلال 7 أيام</span>
                </h4>
                <p className="text-[11px] text-gray-600 leading-relaxed font-semibold">
                  اشترك اليوم باطمئنان تام؛ إن لم تحز الخدمة على رضاك الكامل أو لم تتوافق مع مدرستك خلال الأسبوع الأول من التفعيل، يحق لك استرجاع كامل أموالك فورياً وبشكل مؤكد.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('subscription')}
                  className="px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer active:scale-98"
                >
                  💳 تصفح خطط الترقية والدفع لتفعيل حساب المدرسة
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'students' && (
                <StudentList
                  students={students}
                  onAddClick={() => {
                    setEditingStudent(null);
                    setIsStudentModalOpen(true);
                  }}
                  onEditClick={handleEditStudent}
                  onDeleteClick={handleDeleteStudent}
                  onChargilyPayClick={handleOpenChargilyPay}
                  onPrintClick={(s) => {
                    setActiveReceiptTeacher(null);
                    setActiveReceiptStudent(s);
                    setIsReceiptModalOpen(true);
                  }}
                />
              )}

              {activeTab === 'teachers' && (
                <TeacherList
                  teachers={teachers}
                  students={students}
                  onAddClick={() => {
                    setEditingTeacher(null);
                    setIsTeacherModalOpen(true);
                  }}
                  onEditClick={handleEditTeacher}
                  onDeleteClick={handleDeleteTeacher}
                  onPrintClick={(t) => {
                    setActiveReceiptStudent(null);
                    setActiveReceiptTeacher(t);
                    setIsReceiptModalOpen(true);
                  }}
                />
              )}

              {activeTab === 'stats' && (
                <DashboardStats
                  students={students}
                  teachers={teachers}
                  onUpdateStudent={handleSaveStudent}
                  onPrintStudent={(s) => {
                    setActiveReceiptTeacher(null);
                    setActiveReceiptStudent(s);
                    setIsReceiptModalOpen(true);
                  }}
                />
              )}

              {activeTab === 'certificates' && (
                <CertificatesPanel
                  students={students}
                  onPrintClick={(s) => {
                    setCertStudent(s);
                    setIsCertModalOpen(true);
                  }}
                />
              )}

              {activeTab === 'security' && userSession.role === 'admin' && (
                <SecuritySettings
                  pins={pins}
                  onAddPin={handleAddPin}
                  onDeletePin={handleDeletePin}
                  isFirebaseSynced={isFirebaseActive}
                  currentUserPin={pins.find(p => p.id === userSession.pinId) || {
                    id: 'default_admin',
                    pin: '2026',
                    label: 'المدير العام',
                    role: 'admin',
                    createdAt: ''
                  }}
                />
              )}

              {activeTab === 'settings' && userSession.role === 'admin' && (
                <SchoolSettingsPanel
                  settings={schoolSettings}
                  onSaveSettings={handleSaveSchoolSettings}
                  isFirebaseSynced={isFirebaseActive}
                />
              )}

              {activeTab === 'subscription' && userSession.role === 'admin' && (
                <SaaSSubscriptionPanel
                  settings={schoolSettings}
                  schoolId={userSession.schoolId}
                  onUpdateSubscription={handleUpdateSubscription}
                  isFirebaseSynced={isFirebaseActive}
                />
              )}
            </>
          )}
        </div>

          </div>
          {/* end content column */}
        </div>
        {/* end ltr flex wrapper */}

      </main>

      {/* 4. Modular Modals */}
      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => {
          setIsStudentModalOpen(false);
          setEditingStudent(null);
        }}
        onSave={handleSaveStudent}
        editingStudent={editingStudent}
      />

      <TeacherModal
        isOpen={isTeacherModalOpen}
        onClose={() => {
          setIsTeacherModalOpen(false);
          setEditingTeacher(null);
        }}
        onSave={handleSaveTeacher}
        editingTeacher={editingTeacher}
      />

      <ChargilyPaymentModal
        isOpen={isChargilyModalOpen}
        onClose={() => {
          setIsChargilyModalOpen(false);
          setChargilyStudent(null);
        }}
        student={chargilyStudent}
        schoolId={userSession?.schoolId || 'najah'}
        onPaymentRecorded={handlePaymentRecorded}
      />

      {/* 5. Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setActiveReceiptStudent(null);
          setActiveReceiptTeacher(null);
        }}
        student={activeReceiptStudent}
        teacher={activeReceiptTeacher}
        schoolSettings={schoolSettings}
      />

      {/* 6. Printable Success Certificate Modal */}
      <CertificateModal
        isOpen={isCertModalOpen}
        onClose={() => {
          setIsCertModalOpen(false);
          setCertStudent(null);
        }}
        student={certStudent}
        schoolSettings={schoolSettings}
      />

      {/* Footer Branding info */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-gray-400 mt-12 space-y-1 py-4 border-t border-gray-150">
        <p>© 2026 {schoolSettings.schoolName}. جميع الحقوق محفوظة.</p>
        <p className="font-mono">نظام مشفر ومؤمن سحابياً لحفظ وتدقيق رواتب المعلمين والمعاملات الدراسية تلقائياً.</p>
      </footer>

    </div>
  );
}
