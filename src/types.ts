/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Student {
  id: string; // Registration number, unique
  name: string;
  cls: string; // Class / Grade
  dob: string; // Birthdate
  parent: string; // Parent full name
  phone: string; // Parent phone number
  subject: string; // Registered subject
  amount: number; // Monthly fees in DA
  day: string; // Lecture day
  time: string; // Lecture time
  status: 'active' | 'suspended';
  paidMonths?: string[]; // Months the student has paid for (e.g. ['أكتوبر', 'نوفمبر'])
}

export type CompensationType = 'percentage' | 'fixed' | 'hourly';

export interface Teacher {
  id: string; // Unique teacher ID
  name: string;
  phone: string;
  subject: string; // Teaching subject
  compensationType: CompensationType; // 'percentage' | 'fixed' | 'hourly'
  compensationValue: number; // e.g. 60 (for 60% of students' fees), 25000 (fixed salary), or 1500 (hourly rate)
  hoursWorked: number; // Only used when compensationType is 'hourly'
  day: string; // Lecture day
  time: string; // Lecture time
}

export interface MonthlyReport {
  monthName: string;
  totalStudents: number;
  totalTeachers: number;
  totalRevenues: number;
  totalExpenditures: number;
  netProfit: number;
}

export interface SavedPin {
  id: string; // unique ID
  pin: string; // 4 to 6 digit numeric code
  label: string; // Name of person this PIN belongs to
  role: 'admin' | 'staff'; // admin can manage PINs, staff can only use the school system
  createdAt: string;
}

export interface SchoolSettings {
  id: string; // 'default'
  schoolName: string;
  logoType: 'icon' | 'image' | 'text';
  logoValue: string; // Can be a Base64 string, URL, or icon name
  phone: string;
  address: string;
  notes?: string;
  academicYear?: string;
  subscriptionStatus?: 'active' | 'trial' | 'expired';
  subscriptionPlan?: 'bronze' | 'gold' | 'ultimate';
  subscriptionExpiry?: string; // ISO date string
}

export interface UserSession {
  pinId: string;
  label: string;
  role: 'admin' | 'staff';
  loginTime: string;
  schoolId: string;
}
