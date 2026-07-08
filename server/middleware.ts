/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Request, Response, NextFunction } from 'express';
import { getAdminAuth } from './firebaseAdmin';

export function sanitizeSchoolId(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 60);
}

export interface AuthClaims {
  uid: string;
  schoolId: string;
  role: 'admin' | 'staff';
  pinId: string;
  label: string;
}

// Augment Express's Request type with our decoded claims.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authUser?: AuthClaims;
    }
  }
}

/**
 * Verifies the Firebase ID token sent by the client in the
 * `Authorization: Bearer <idToken>` header, and attaches the decoded
 * custom claims (schoolId, role, pinId) to req.authUser.
 *
 * This is the ONLY source of truth for "who is this request coming from".
 * Nothing in the request body (schoolId, role, etc.) is ever trusted for
 * authorization decisions.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authAdmin = getAdminAuth();
  if (!authAdmin) {
    return res.status(503).json({
      error: 'الخدمة السحابية غير مهيأة على الخادم (FIREBASE_SERVICE_ACCOUNT_KEY مفقود).',
    });
  }

  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer (.+)$/);
  if (!match) {
    return res.status(401).json({ error: 'يلزم تسجيل الدخول لإجراء هذا الطلب.' });
  }

  try {
    const decoded = await authAdmin.verifyIdToken(match[1]);
    const schoolId = typeof decoded.schoolId === 'string' ? decoded.schoolId : '';
    const role = decoded.role === 'admin' ? 'admin' : 'staff';
    const pinId = typeof decoded.pinId === 'string' ? decoded.pinId : '';
    const label = typeof decoded.label === 'string' ? decoded.label : '';

    if (!schoolId) {
      return res.status(403).json({ error: 'رمز الدخول لا يحتوي على مساحة عمل صالحة.' });
    }

    req.authUser = { uid: decoded.uid, schoolId, role, pinId, label };
    next();
  } catch (error) {
    console.error('[auth] Invalid ID token:', error);
    return res.status(401).json({ error: 'جلسة الدخول غير صالحة أو منتهية الصلاحية. يرجى تسجيل الدخول مجدداً.' });
  }
}

/** Use after requireAuth to restrict a route to admin-role users only. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.authUser || req.authUser.role !== 'admin') {
    return res.status(403).json({ error: 'هذا الإجراء متاح لصلاحية المدير العام فقط.' });
  }
  next();
}
