<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8cea095f-4a9f-474c-80ac-7fee580e4539

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Security setup (required for cloud/multi-school mode)

This app uses Firebase Authentication + Firestore Security Rules + a small
Express backend to keep each school's data private and to verify payments
safely. To enable cloud mode you must configure two secrets in your `.env`
(see `.env.example`):

1. **`FIREBASE_SERVICE_ACCOUNT_KEY`** — a Firebase service account key
   (Firebase Console → Project Settings → Service Accounts → *Generate new
   private key*). Paste the entire downloaded JSON as one line. This powers:
   - PIN verification and hashing (`server/authRoutes.ts`)
   - Minting the Firebase custom tokens the browser signs in with
   - Confirming payments from the Chargily webhook

2. **`CHARGILY_SECRET_KEY`** — from your Chargily Pay dashboard
   (https://dashboard.chargily.com/). Used both to call the Chargily API and
   to verify the HMAC signature of incoming webhook requests.

3. Deploy the updated `firestore.rules` to your Firebase project
   (`firebase deploy --only firestore:rules`, or paste them into the
   Firebase Console's Rules editor). **This is required** — without it the
   app will fall back to Firestore's default "deny all", not the old
   insecure "allow all".

4. In the Chargily dashboard, nothing extra is required — this app sets a
   per-checkout `webhook_endpoint` automatically
   (`${APP_URL}/api/chargily/webhook`) when creating each checkout.

Without `FIREBASE_SERVICE_ACCOUNT_KEY` configured, the app still works fully
offline/local (single device, PINs hashed client-side with Web Crypto) —
cloud sync, cross-device login and real Chargily payments simply stay
disabled until it's set.
