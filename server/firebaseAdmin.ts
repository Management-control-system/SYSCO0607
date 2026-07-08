/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Server-side Firebase Admin SDK bootstrap.
 *
 * This module NEVER runs in the browser. It uses a service account with
 * elevated privileges to bypass Firestore Security Rules, which is exactly
 * why all sensitive operations (verifying PINs, minting auth tokens,
 * confirming payments) must happen here and never on the client.
 *
 * Configure by setting FIREBASE_SERVICE_ACCOUNT_KEY in your environment to
 * the full JSON content of a Firebase service account key
 * (Firebase Console -> Project Settings -> Service Accounts -> Generate new
 * private key).
 */
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

let initialized = false;
let projectMismatchError: string | null = null;

export function getProjectMismatch(): string | null {
  return projectMismatchError;
}

export function getAdminApp(): admin.app.App | null {
  if (initialized) {
    return admin.apps[0] as admin.app.App;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    console.warn(
      '[firebaseAdmin] FIREBASE_SERVICE_ACCOUNT_KEY is not set. Cloud auth, ' +
      'PIN verification and payment confirmation endpoints will be disabled ' +
      'until this is configured.'
    );
    return null;
  }

  try {
    const serviceAccount = JSON.parse(raw);

    // Validate if service account project ID matches client app project ID
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const clientConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (clientConfig.projectId && serviceAccount.project_id && clientConfig.projectId !== serviceAccount.project_id) {
          projectMismatchError = `تعارض في تهيئة Firebase: كود المشروع في المتصفح هو "${clientConfig.projectId}" بينما ملف الخدمة للسر السحابي (Service Account) ينتمي لمشروع آخر وهو "${serviceAccount.project_id}". يرجى توليد مفتاح الخدمة من نفس المشروع لتفادي خطأ auth/internal-error.`;
          console.error(`[firebaseAdmin] Project ID Mismatch! Client project: "${clientConfig.projectId}", Service Account project: "${serviceAccount.project_id}". This will cause custom token sign-in to fail with "auth/internal-error" on the client side.`);
        }
      }
    } catch (e) {
      console.warn('[firebaseAdmin] Failed to run project ID mismatch check:', e);
    }

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
    return app;
  } catch (error) {
    console.error('[firebaseAdmin] Failed to initialize Firebase Admin SDK:', error);
    return null;
  }
}

export function getAdminDb(): admin.firestore.Firestore | null {
  const app = getAdminApp();
  if (!app) return null;
  return admin.firestore();
}

export function getAdminAuth(): admin.auth.Auth | null {
  const app = getAdminApp();
  if (!app) return null;
  return admin.auth();
}

export { admin };
