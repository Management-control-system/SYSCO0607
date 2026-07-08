/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Thin client for our own backend endpoints (server/*.ts). Centralizing
 * these calls here means every authenticated request automatically carries
 * the current Firebase ID token — callers never have to remember to attach
 * it, and there's a single place to fix things if the auth scheme changes.
 */
import { getFirebaseIdToken } from './firebase';
import { SchoolSettings } from '../types';

export interface AuthResult {
  customToken: string;
  settings: SchoolSettings | null;
  pin: { id: string; label: string; role: 'admin' | 'staff' };
}

async function authedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const idToken = await getFirebaseIdToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }
  return fetch(url, { ...options, headers });
}

export class ApiError extends Error {
  needsConfig?: boolean;
  constructor(message: string, needsConfig?: boolean) {
    super(message);
    this.needsConfig = needsConfig;
  }
}

async function parseJsonOrThrow(response: Response): Promise<any> {
  let data: any = {};
  let text = '';
  try {
    text = await response.clone().text();
    data = JSON.parse(text);
  } catch (e) {
    // Not a JSON response
  }
  if (!response.ok) {
    const fallbackMsg = text && !text.startsWith('<!doctype') && !text.startsWith('<html')
      ? `خطأ من الخادم (رمز ${response.status}): ${text.slice(0, 150)}`
      : `حدث خطأ غير متوقع أثناء الاتصال بالخادم (رمز الحالة ${response.status}).`;
    throw new ApiError(data.error || fallbackMsg, data.needsConfig === true);
  }
  return data;
}

// --- Auth ----------------------------------------------------------------

export async function apiRegisterSchool(payload: {
  schoolId: string;
  schoolName: string;
  adminPin: string;
  phone?: string;
  address?: string;
  academicYear?: string;
}): Promise<AuthResult> {
  const response = await fetch('/api/auth/register-school', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonOrThrow(response);
}

export async function apiLogin(schoolId: string, pin: string): Promise<AuthResult> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ schoolId, pin }),
  });
  return parseJsonOrThrow(response);
}

export interface PinSummary {
  id: string;
  label: string;
  role: 'admin' | 'staff';
  createdAt: string;
}

export async function apiListPins(): Promise<PinSummary[]> {
  const response = await authedFetch('/api/auth/pins');
  const data = await parseJsonOrThrow(response);
  return data.pins as PinSummary[];
}

export async function apiAddPin(label: string, pin: string, role: 'admin' | 'staff'): Promise<PinSummary> {
  const response = await authedFetch('/api/auth/pins', {
    method: 'POST',
    body: JSON.stringify({ label, pin, role }),
  });
  const data = await parseJsonOrThrow(response);
  return data.pin as PinSummary;
}

export async function apiDeletePin(pinId: string): Promise<void> {
  const response = await authedFetch(`/api/auth/pins/${encodeURIComponent(pinId)}`, {
    method: 'DELETE',
  });
  await parseJsonOrThrow(response);
}

// --- Chargily payments -----------------------------------------------------

export async function apiCreateStudentCheckout(payload: {
  studentId: string;
  month: string;
  amount: number;
}): Promise<{ id: string; checkoutUrl: string }> {
  const response = await authedFetch('/api/chargily/create-checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseJsonOrThrow(response);
}

export async function apiCreateSubscriptionCheckout(planName: string): Promise<{ id: string; checkoutUrl: string }> {
  const response = await authedFetch('/api/chargily/create-subscription-checkout', {
    method: 'POST',
    body: JSON.stringify({ planName }),
  });
  return parseJsonOrThrow(response);
}

export async function apiVerifyPaymentStatus(kind: 'payment' | 'subscription'): Promise<any> {
  const response = await authedFetch(`/api/chargily/verify-status?kind=${kind}`);
  return parseJsonOrThrow(response);
}
