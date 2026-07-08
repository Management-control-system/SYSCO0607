/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Chargily Pay integration — secure version.
 *
 * Key design change from the original implementation:
 *   The old code trusted `?payment_status=success&amount=...` query
 *   parameters straight from the browser URL to decide whether a payment or
 *   subscription had been paid. Anyone could type that URL by hand and grant
 *   themselves a free subscription or mark any invoice as paid.
 *
 * The fix:
 *   1. When a checkout is created, we record a "pending" record in Firestore
 *      (via the Admin SDK, so the client cannot see or edit it directly).
 *   2. Chargily's success_url/failure_url now only carry a `checkout_id` —
 *      nothing else — so there's nothing sensitive left to forge.
 *   3. The ONLY thing allowed to mark a payment as "paid" is our webhook
 *      endpoint, and only after verifying the HMAC-SHA256 `signature` header
 *      Chargily sends, computed with our secret key over the raw request
 *      body. See https://dev.chargily.com/pay-v2/webhooks
 *   4. The client, after being redirected back, calls a read-only
 *      `/verify-status` endpoint that simply reports what the webhook has
 *      already (or not yet) confirmed in Firestore. It cannot cause any
 *      state change itself.
 */
import { Router, raw } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { getAdminDb } from './firebaseAdmin';
import { requireAuth, requireAdmin } from './middleware';

export const chargilyRouter = Router();

const CHARGILY_API_BASE = 'https://pay.chargily.net/api/v2';

const SUBSCRIPTION_PRICES: Record<string, number> = {
  BRONZE: 15000,
  GOLD: 28000,
  ULTIMATE: 49000,
};

function getAppUrl(port: number): string {
  return process.env.APP_URL || `http://localhost:${port}`;
}

// --- 1. Create a student-payment checkout (requires login) -------------

export function createChargilyCheckoutHandler(port: number) {
  return async (req: any, res: any) => {
    const db = getAdminDb();
    if (!db) return res.status(503).json({ error: 'الخدمة السحابية غير مهيأة على الخادم.' });

    try {
      const { schoolId } = req.authUser;
      const { studentId, month, amount } = req.body;

      if (!studentId || !month || !amount || Number(amount) <= 0) {
        return res.status(400).json({ error: 'بيانات الطلب غير مكتملة. يرجى توفير المعرف والشهر والمبلغ.' });
      }

      // Verify the student actually belongs to the caller's own school —
      // never trust a schoolId supplied by the client for this.
      const studentSnap = await db.doc(`schools/${schoolId}/students/${studentId}`).get();
      if (!studentSnap.exists) {
        return res.status(404).json({ error: 'لم يتم العثور على هذا التلميذ ضمن مدرستك.' });
      }
      const student = studentSnap.data()!;

      const secretKey = process.env.CHARGILY_SECRET_KEY;
      if (!secretKey) {
        return res.status(400).json({
          error: 'لم يتم العثور على مفتاح CHARGILY_SECRET_KEY في إعدادات البيئة.',
          needsConfig: true,
        });
      }

      const appUrl = getAppUrl(port);
      // NOTE: Chargily's success_url/failure_url are plain static URLs — the
      // API does not support embedding the checkout id in them. They are
      // purely cosmetic (which "thank you" copy to show). The ACTUAL data
      // update never depends on these query params — only the signed
      // webhook below is trusted for that.
      const payload = {
        amount: Number(amount),
        currency: 'dzd',
        success_url: `${appUrl}/?payment_return=success&kind=payment`,
        failure_url: `${appUrl}/?payment_return=failed&kind=payment`,
        webhook_endpoint: `${appUrl}/api/chargily/webhook`,
        metadata: { schoolId, studentId, month, kind: 'payment' },
      };

      const response = await fetch(`${CHARGILY_API_BASE}/checkouts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Chargily API error:', errText);
        return res.status(response.status).json({ error: 'فشل إنشاء دفعة في بوابة Chargily.' });
      }

      const data: any = await response.json();
      const checkoutUrl: string = data.checkout_url || data.checkoutUrl;

      await db.doc(`schools/${schoolId}/pendingPayments/${data.id}`).set({
        schoolId,
        studentId,
        studentName: student.name || '',
        month,
        amount: Number(amount),
        status: 'pending',
        kind: 'payment',
        createdAt: new Date().toISOString(),
      });

      return res.json({ id: data.id, checkoutUrl });
    } catch (error: any) {
      console.error('Error creating Chargily checkout:', error);
      return res.status(500).json({ error: 'حدث خطأ داخلي أثناء معالجة الدفع.' });
    }
  };
}

// --- 2. Create a subscription checkout (admin only) ---------------------

export function createSubscriptionCheckoutHandler(port: number) {
  return async (req: any, res: any) => {
    const db = getAdminDb();
    if (!db) return res.status(503).json({ error: 'الخدمة السحابية غير مهيأة على الخادم.' });

    try {
      const { schoolId } = req.authUser;
      const planName = String(req.body.planName || '').toUpperCase();
      const expectedAmount = SUBSCRIPTION_PRICES[planName];

      if (!expectedAmount) {
        return res.status(400).json({ error: 'خطة اشتراك غير معروفة.' });
      }

      const secretKey = process.env.CHARGILY_SECRET_KEY;
      if (!secretKey) {
        return res.status(400).json({
          error: 'لم يتم العثور على مفتاح CHARGILY_SECRET_KEY في إعدادات البيئة.',
          needsConfig: true,
        });
      }

      const appUrl = getAppUrl(port);
      const payload = {
        amount: expectedAmount, // Price is looked up server-side, never trusted from the client.
        currency: 'dzd',
        success_url: `${appUrl}/?payment_return=success&kind=subscription`,
        failure_url: `${appUrl}/?payment_return=failed&kind=subscription`,
        webhook_endpoint: `${appUrl}/api/chargily/webhook`,
        metadata: { schoolId, planName, kind: 'subscription' },
      };

      const response = await fetch(`${CHARGILY_API_BASE}/checkouts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Chargily subscription API error:', errText);
        return res.status(response.status).json({ error: 'فشل توليد رابط دفع الاشتراك.' });
      }

      const data: any = await response.json();
      const checkoutUrl: string = data.checkout_url || data.checkoutUrl;

      await db.doc(`schools/${schoolId}/pendingSubscriptions/${data.id}`).set({
        schoolId,
        planName,
        amount: expectedAmount,
        status: 'pending',
        kind: 'subscription',
        createdAt: new Date().toISOString(),
      });

      return res.json({ id: data.id, checkoutUrl });
    } catch (error) {
      console.error('Error creating subscription checkout:', error);
      return res.status(500).json({ error: 'خطأ داخلي أثناء توليد فاتورة الاشتراك.' });
    }
  };
}

chargilyRouter.post('/create-checkout', requireAuth, (req, res) =>
  createChargilyCheckoutHandler(3000)(req, res)
);
chargilyRouter.post('/create-subscription-checkout', requireAuth, requireAdmin, (req, res) =>
  createSubscriptionCheckoutHandler(3000)(req, res)
);

// --- 3. Read-only status check (client polls this after redirect) ------
//
// The client does NOT receive a checkout id back from Chargily's redirect
// (the API doesn't support templating it into success_url), so this simply
// reports the most recent pending/paid record for the caller's own school.
// It is informational only — the authoritative state change already
// happened (or will happen) via the signed webhook below, and the app's
// live Firestore listeners will reflect it automatically regardless of
// whether this endpoint is ever called.

chargilyRouter.get('/verify-status', requireAuth, async (req, res) => {
  const db = getAdminDb();
  if (!db) return res.status(503).json({ error: 'الخدمة السحابية غير مهيأة.' });

  try {
    const { schoolId } = req.authUser!;
    const kind = req.query.kind === 'subscription' ? 'subscription' : 'payment';
    const collection = kind === 'subscription' ? 'pendingSubscriptions' : 'pendingPayments';

    const snap = await db
      .collection(`schools/${schoolId}/${collection}`)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (snap.empty) return res.json({ status: 'unknown' });
    const data = snap.docs[0].data();
    return res.json({ status: data.status, ...data });
  } catch (error) {
    console.error('Error verifying status:', error);
    return res.status(500).json({ error: 'تعذر التحقق من حالة العملية.' });
  }
});

// --- 4. Webhook: the ONLY place that ever marks something as paid ------
//
// Registered as a *raw* body parser (not JSON) because HMAC verification
// must run over the exact bytes Chargily sent, before any parsing.

export const chargilyWebhookRawParser = raw({ type: '*/*' });

export async function chargilyWebhookHandler(req: any, res: any) {
  const secretKey = process.env.CHARGILY_SECRET_KEY;
  const db = getAdminDb();

  if (!secretKey || !db) {
    console.error('[chargily webhook] Missing secret key or Firestore Admin SDK.');
    return res.status(503).end();
  }

  const signature = req.get('signature') || req.get('Signature') || '';
  const rawBody: Buffer = req.body;

  if (!signature || !rawBody) {
    return res.status(400).end();
  }

  const computed = createHmac('sha256', secretKey).update(rawBody).digest('hex');
  const sigBuf = Buffer.from(signature);
  const computedBuf = Buffer.from(computed);

  if (sigBuf.length !== computedBuf.length || !timingSafeEqual(sigBuf, computedBuf)) {
    console.warn('[chargily webhook] Invalid signature — request rejected.');
    return res.status(403).end();
  }

  let event: any;
  try {
    event = JSON.parse(rawBody.toString('utf-8'));
  } catch {
    return res.status(400).end();
  }

  try {
    if (event.type === 'checkout.paid') {
      const checkout = event.data;
      const metadata = checkout.metadata || {};
      const schoolId = metadata.schoolId;
      const kind = metadata.kind;

      if (!schoolId || !kind) {
        console.warn('[chargily webhook] Missing metadata on paid checkout', checkout.id);
        return res.status(200).end();
      }

      if (kind === 'payment') {
        const pendingRef = db.doc(`schools/${schoolId}/pendingPayments/${checkout.id}`);
        const pendingSnap = await pendingRef.get();
        if (!pendingSnap.exists) return res.status(200).end();
        const pending = pendingSnap.data()!;
        if (pending.status === 'paid') return res.status(200).end(); // idempotent replay

        // Cross-check the amount actually paid against what we requested.
        if (Number(checkout.amount) !== Number(pending.amount)) {
          console.error('[chargily webhook] Amount mismatch — refusing to credit', checkout.id);
          return res.status(200).end();
        }

        await db.runTransaction(async (tx) => {
          const studentRef = db.doc(`schools/${schoolId}/students/${pending.studentId}`);
          const studentSnap = await tx.get(studentRef);
          if (studentSnap.exists) {
            const student = studentSnap.data()!;
            const paidMonths: string[] = student.paidMonths || [];
            if (!paidMonths.includes(pending.month)) {
              tx.update(studentRef, { paidMonths: [...paidMonths, pending.month] });
            }
          }
          tx.update(pendingRef, { status: 'paid', paidAt: new Date().toISOString() });
        });
      } else if (kind === 'subscription') {
        const pendingRef = db.doc(`schools/${schoolId}/pendingSubscriptions/${checkout.id}`);
        const pendingSnap = await pendingRef.get();
        if (!pendingSnap.exists) return res.status(200).end();
        const pending = pendingSnap.data()!;
        if (pending.status === 'paid') return res.status(200).end();

        if (Number(checkout.amount) !== Number(pending.amount)) {
          console.error('[chargily webhook] Subscription amount mismatch — refusing to credit', checkout.id);
          return res.status(200).end();
        }

        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

        await db.runTransaction(async (tx) => {
          const settingsRef = db.doc(`schools/${schoolId}/settings/school`);
          tx.set(
            settingsRef,
            {
              subscriptionStatus: 'active',
              subscriptionPlan: String(pending.planName).toLowerCase(),
              subscriptionExpiry: oneYearFromNow.toISOString(),
            },
            { merge: true }
          );
          tx.update(pendingRef, { status: 'paid', paidAt: new Date().toISOString() });
        });
      }
    }

    return res.status(200).end();
  } catch (error) {
    console.error('[chargily webhook] Error handling event:', error);
    // Still return 200 so Chargily doesn't hammer us with retries for a bug
    // on our side that a retry won't fix; the pending record stays
    // 'pending' and can be reconciled manually if needed.
    return res.status(200).end();
  }
}
