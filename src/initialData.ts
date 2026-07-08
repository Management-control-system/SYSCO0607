/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, Teacher } from './types';

export const INITIAL_STUDENTS: Student[] = [
  {
    id: '2026-001',
    name: 'محمد أمين بوزيدي',
    cls: 'السنة الثالثة متوسط',
    dob: '2011-04-15',
    parent: 'كمال بوزيدي',
    phone: '0555123456',
    subject: 'رياضيات',
    amount: 3500,
    day: 'السبت',
    time: '08:00 - 10:00',
    status: 'active'
  },
  {
    id: '2026-002',
    name: 'سارة رحماني',
    cls: 'السنة الرابعة متوسط',
    dob: '2010-08-20',
    parent: 'عبد القادر رحماني',
    phone: '0661987654',
    subject: 'علوم طبيعية',
    amount: 4000,
    day: 'الأحد',
    time: '14:00 - 16:00',
    status: 'active'
  },
  {
    id: '2026-003',
    name: 'أحمد بن علي',
    cls: 'السنة الخامسة ابتدائي',
    dob: '2015-01-10',
    parent: 'عمار بن علي',
    phone: '0770456123',
    subject: 'لغة عربية',
    amount: 3000,
    day: 'الإثنين',
    time: '10:00 - 12:00',
    status: 'active'
  },
  {
    id: '2026-004',
    name: 'ياسمين بلحاج',
    cls: 'السنة الأولى متوسط',
    dob: '2013-11-05',
    parent: 'سفيان بلحاج',
    phone: '0550112233',
    subject: 'لغة إنجليزية',
    amount: 3200,
    day: 'الثلاثاء',
    time: '16:00 - 18:00',
    status: 'active'
  },
  {
    id: '2026-005',
    name: 'أيوب منصوري',
    cls: 'السنة الرابعة متوسط',
    dob: '2010-05-30',
    parent: 'رضوان منصوري',
    phone: '0658778899',
    subject: 'فيزياء',
    amount: 3500,
    day: 'الأربعاء',
    time: '08:00 - 10:00',
    status: 'active'
  },
  {
    id: '2026-006',
    name: 'نور الهدى بن سالم',
    cls: 'السنة الثالثة متوسط',
    dob: '2011-12-12',
    parent: 'سليم بن سالم',
    phone: '0799112233',
    subject: 'رياضيات',
    amount: 3500,
    day: 'السبت',
    time: '08:00 - 10:00',
    status: 'active'
  },
  {
    id: '2026-007',
    name: 'إلياس مزياني',
    cls: 'السنة الرابعة متوسط',
    dob: '2010-02-18',
    parent: 'مراد مزياني',
    phone: '0541223344',
    subject: 'فيزياء',
    amount: 3500,
    day: 'الأربعاء',
    time: '08:00 - 10:00',
    status: 'active'
  }
];

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'T-001',
    name: 'الأستاذ عبد الحق خالد',
    phone: '0655123456',
    subject: 'رياضيات',
    compensationType: 'percentage',
    compensationValue: 60, // 60% of students' fees enrolled in Mathematics
    hoursWorked: 0,
    day: 'السبت',
    time: '08:00 - 12:00'
  },
  {
    id: 'T-002',
    name: 'الأستاذة مريم عيساني',
    phone: '0551987654',
    subject: 'علوم طبيعية',
    compensationType: 'fixed',
    compensationValue: 12000, // Fixed monthly salary of 12000 DA
    hoursWorked: 0,
    day: 'الأحد',
    time: '14:00 - 18:00'
  },
  {
    id: 'T-003',
    name: 'الأستاذ فريد حداد',
    phone: '0772345678',
    subject: 'فيزياء',
    compensationType: 'hourly',
    compensationValue: 1500, // 1500 DA per hour
    hoursWorked: 16, // 16 hours per month => 24,000 DA
    day: 'الأربعاء',
    time: '08:00 - 12:00'
  },
  {
    id: 'T-004',
    name: 'الأستاذة عائشة بلخير',
    phone: '0663456789',
    subject: 'لغة عربية',
    compensationType: 'percentage',
    compensationValue: 50, // 50% of students' fees enrolled in Arabic
    hoursWorked: 0,
    day: 'الإثنين',
    time: '10:00 - 14:00'
  },
  {
    id: 'T-005',
    name: 'الأستاذ عادل براهيمي',
    phone: '0554112233',
    subject: 'لغة إنجليزية',
    compensationType: 'fixed',
    compensationValue: 15000,
    hoursWorked: 0,
    day: 'الثلاثاء',
    time: '16:00 - 20:00'
  }
];

export const SUBJECTS = [
  'رياضيات',
  'علوم طبيعية',
  'لغة عربية',
  'لغة فرنسية',
  'لغة إنجليزية',
  'فيزياء'
];

export const CLASSES = [
  'السنة الأولى ابتدائي',
  'السنة الثانية ابتدائي',
  'السنة الثالثة ابتدائي',
  'السنة الرابعة ابتدائي',
  'السنة الخامسة ابتدائي',
  'السنة الأولى متوسط',
  'السنة الثانية متوسط',
  'السنة الثالثة متوسط',
  'السنة الرابعة متوسط'
];

export const DAYS_OF_WEEK = [
  'السبت',
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة'
];
