/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Authentication routes.
 *
 * Design goal: the client NEVER reads or writes the `pins` collection
 * directly, and NEVER sees another school's data. All PIN verification and
 * management happens here, server-side, using the Admin SDK (which bypasses
 * Firestore Security Rules). After a successful login/registration we mint
 * a short-lived Firebase custom token carrying {schoolId, role, pinId} as
 * custom claims; the client signs in with that token, and Firestore Rules
 * enforce per-school access using those claims for everything else
 * (students, teachers, settings).
 */
import { Router } from 'express';
import { getAdminAuth, getAdminDb, getProjectMismatch } from './firebaseAdmin';
import { hashPin, verifyPin, isHashed } from './pinCrypto';
import { sanitizeSchoolId, requireAuth, requireAdmin } from './middleware';

export const authRouter = Router();

// Known legacy default so the bundled demo school ("najah") keeps working
// the first time this update is deployed, before anyone has migrated it.
// It is only ever accepted for the 'najah' schoolId and only if that school
// has no admin PIN saved in Firestore yet; the very first successful login
// immediately migrates it to a securely hashed PIN.
const LEGACY_DEFAULT_SCHOOL_ID = 'najah';
const LEGACY_DEFAULT_ADMIN_PIN = '2026';

authRouter.post('/register-school', async (req, res) => {
  const mismatch = getProjectMismatch();
  if (mismatch) {
    return res.status(400).json({ error: mismatch, needsConfig: true });
  }

  const db = getAdminDb();
  const authAdmin = getAdminAuth();
  if (!db || !authAdmin) {
    return res.status(503).json({ error: 'الخدمة السحابية غير مهيأة على الخادم. يرجى إعداد مفتاح الخدمة FIREBASE_SERVICE_ACCOUNT_KEY.', needsConfig: true });
  }

  try {
    const schoolId = sanitizeSchoolId(req.body.schoolId);
    const { schoolName, adminPin, phone, address, academicYear } = req.body;

    if (!schoolId || !schoolName || !adminPin) {
      return res.status(400).json({ error: 'يرجى تعبئة كود المدرسة واسمها ورمز المدير.' });
    }
    if (!/^\d{4,6}$/.test(String(adminPin))) {
      return res.status(400).json({ error: 'يجب أن يتكون رمز المدير من 4 إلى 6 أرقام.' });
    }

    const settingsRef = db.doc(`schools/${schoolId}/settings/school`);
    const existing = await settingsRef.get();
    if (existing.exists) {
      return res.status(409).json({ error: 'كود المدرسة هذا مستخدم بالفعل. يرجى اختيار كود آخر.' });
    }

    const settings = {
      id: 'school',
      schoolName: String(schoolName),
      logoType: 'icon',
      logoValue: 'School',
      phone: String(phone || ''),
      address: String(address || ''),
      academicYear: String(academicYear || ''),
      subscriptionStatus: 'trial',
      subscriptionPlan: 'bronze',
    };

    const pinId = 'admin_' + Date.now().toString(36);
    const pinDoc = {
      id: pinId,
      pin: hashPin(String(adminPin)),
      label: 'المدير العام',
      role: 'admin' as const,
      createdAt: new Date().toISOString(),
    };

    await settingsRef.set(settings);
    await db.doc(`schools/${schoolId}/pins/${pinId}`).set(pinDoc);

    const customToken = await authAdmin.createCustomToken(`${schoolId}__${pinId}`, {
      schoolId,
      role: 'admin',
      pinId,
      label: pinDoc.label,
    });

    return res.json({
      customToken,
      settings,
      pin: { id: pinId, label: pinDoc.label, role: 'admin' },
    });
  } catch (error: any) {
    console.error('Error registering school:', error);
    return res.status(500).json({ error: 'خطأ داخلي أثناء إنشاء مساحة العمل.' });
  }
});

authRouter.post('/login', async (req, res) => {
  const mismatch = getProjectMismatch();
  if (mismatch) {
    return res.status(400).json({ error: mismatch, needsConfig: true });
  }

  const db = getAdminDb();
  const authAdmin = getAdminAuth();
  if (!db || !authAdmin) {
    return res.status(503).json({ error: 'الخدمة السحابية غير مهيأة على الخادم. يرجى إعداد مفتاح الخدمة FIREBASE_SERVICE_ACCOUNT_KEY.', needsConfig: true });
  }

  try {
    const schoolId = sanitizeSchoolId(req.body.schoolId);
    const pin = String(req.body.pin || '').trim();

    if (!schoolId || pin.length < 4) {
      return res.status(400).json({ error: 'يرجى إدخال كود المدرسة ورمز مرور صالح.' });
    }

    const pinsSnap = await db.collection(`schools/${schoolId}/pins`).get();

    let matchedPinId: string | null = null;
    let matchedLabel = '';
    let matchedRole: 'admin' | 'staff' = 'staff';
    let migrateDocRef: FirebaseFirestore.DocumentReference | null = null;

    for (const doc of pinsSnap.docs) {
      const data = doc.data();
      const stored = String(data.pin || '');
      const isMatch = isHashed(stored) ? verifyPin(pin, stored) : stored === pin;
      if (isMatch) {
        matchedPinId = data.id || doc.id;
        matchedLabel = data.label || '';
        matchedRole = data.role === 'admin' ? 'admin' : 'staff';
        // Legacy plaintext PIN found in cloud data: migrate it to a hash now.
        if (!isHashed(stored)) {
          migrateDocRef = doc.ref;
        }
        break;
      }
    }

    // Bootstrap fallback for the bundled demo school only, only if it has
    // no admin PIN saved yet in Firestore.
    if (!matchedPinId && schoolId === LEGACY_DEFAULT_SCHOOL_ID && pin === LEGACY_DEFAULT_ADMIN_PIN) {
      const hasAdminPin = pinsSnap.docs.some(d => d.data().role === 'admin');
      if (!hasAdminPin) {
        const pinId = 'admin_bootstrap_' + Date.now().toString(36);
        const pinDoc = {
          id: pinId,
          pin: hashPin(LEGACY_DEFAULT_ADMIN_PIN),
          label: 'المدير العام (رمز افتراضي)',
          role: 'admin' as const,
          createdAt: new Date().toISOString(),
        };
        await db.doc(`schools/${schoolId}/pins/${pinId}`).set(pinDoc);
        matchedPinId = pinId;
        matchedLabel = pinDoc.label;
        matchedRole = 'admin';
      }
    }

    if (!matchedPinId) {
      return res.status(401).json({ error: 'كود المدرسة أو رمز المرور غير صحيح.' });
    }

    if (migrateDocRef) {
      await migrateDocRef.update({ pin: hashPin(pin) });
    }

    const settingsSnap = await db.doc(`schools/${schoolId}/settings/school`).get();
    const settings = settingsSnap.exists ? settingsSnap.data() : null;

    const customToken = await authAdmin.createCustomToken(`${schoolId}__${matchedPinId}`, {
      schoolId,
      role: matchedRole,
      pinId: matchedPinId,
      label: matchedLabel,
    });

    return res.json({
      customToken,
      settings,
      pin: { id: matchedPinId, label: matchedLabel, role: matchedRole },
    });
  } catch (error: any) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'خطأ داخلي أثناء تسجيل الدخول.' });
  }
});

// --- Staff PIN management (admin only, backend-mediated) ---------------

authRouter.get('/pins', requireAuth, async (req, res) => {
  const db = getAdminDb();
  if (!db) return res.status(503).json({ error: 'الخدمة السحابية غير مهيأة.' });
  if (req.authUser!.role !== 'admin') {
    return res.status(403).json({ error: 'هذا الإجراء متاح لصلاحية المدير العام فقط.' });
  }
  try {
    const snap = await db.collection(`schools/${req.authUser!.schoolId}/pins`).get();
    // Never send the PIN hash (or plaintext) back to the client.
    const list = snap.docs.map(d => {
      const data = d.data();
      return { id: data.id || d.id, label: data.label, role: data.role, createdAt: data.createdAt };
    });
    return res.json({ pins: list });
  } catch (error) {
    console.error('Error listing pins:', error);
    return res.status(500).json({ error: 'تعذر جلب قائمة رموز الدخول.' });
  }
});

authRouter.post('/pins', requireAuth, requireAdmin, async (req, res) => {
  const db = getAdminDb();
  if (!db) return res.status(503).json({ error: 'الخدمة السحابية غير مهيأة.' });

  try {
    const label = String(req.body.label || '').trim();
    const pin = String(req.body.pin || '').trim();
    const role = req.body.role === 'admin' ? 'admin' : 'staff';

    if (!label || !/^\d{4,6}$/.test(pin)) {
      return res.status(400).json({ error: 'يرجى إدخال اسم صالح ورمز مرور من 4 إلى 6 أرقام.' });
    }

    const schoolId = req.authUser!.schoolId;
    const existing = await db.collection(`schools/${schoolId}/pins`).get();
    const clashes = existing.docs.some(d => {
      const stored = String(d.data().pin || '');
      return isHashed(stored) ? verifyPin(pin, stored) : stored === pin;
    });
    if (clashes || pin === LEGACY_DEFAULT_ADMIN_PIN) {
      return res.status(409).json({ error: 'رمز المرور هذا مستخدم بالفعل. يرجى اختيار رمز آخر.' });
    }

    const pinId = 'pin_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const pinDoc = {
      id: pinId,
      pin: hashPin(pin),
      label,
      role,
      createdAt: new Date().toISOString(),
    };
    await db.doc(`schools/${schoolId}/pins/${pinId}`).set(pinDoc);

    return res.json({ pin: { id: pinId, label, role, createdAt: pinDoc.createdAt } });
  } catch (error) {
    console.error('Error creating pin:', error);
    return res.status(500).json({ error: 'تعذر إنشاء رمز الدخول الجديد.' });
  }
});

authRouter.delete('/pins/:pinId', requireAuth, requireAdmin, async (req, res) => {
  const db = getAdminDb();
  if (!db) return res.status(503).json({ error: 'الخدمة السحابية غير مهيأة.' });

  try {
    const schoolId = req.authUser!.schoolId;
    const { pinId } = req.params;
    if (pinId === req.authUser!.pinId) {
      return res.status(400).json({ error: 'لا يمكنك حذف الرمز الذي تستخدمه حالياً.' });
    }
    await db.doc(`schools/${schoolId}/pins/${pinId}`).delete();
    return res.json({ deleted: true });
  } catch (error) {
    console.error('Error deleting pin:', error);
    return res.status(500).json({ error: 'تعذر حذف رمز الدخول.' });
  }
});
