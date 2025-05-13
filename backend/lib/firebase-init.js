// backend/lib/firebase-init.js
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import fs from 'fs'; // Keep for local fallback

let firebaseAdminAppInitialized = false; // Renamed to avoid conflict if this script were ever in client scope

export async function ensureFirebaseInitialized() {
  // Check if an app is already initialized OR if our flag is set
  if (getApps().length === 0 && !firebaseAdminAppInitialized) {
    console.log("[Firebase Admin Init] Attempting to initialize Firebase Admin SDK...");
    try {
      let serviceAccount;
      // Prioritize environment variable for production/deployment
      if (process.env.FIREBASE_ADMIN_SDK_JSON_BASE64) {
        console.log("[Firebase Admin Init] Using FIREBASE_ADMIN_SDK_JSON_BASE64 environment variable.");
        const decodedJson = Buffer.from(process.env.FIREBASE_ADMIN_SDK_JSON_BASE64, 'base64').toString('utf-8');
        serviceAccount = JSON.parse(decodedJson);
      } else if (fs.existsSync('./firebase-adminsdk.json')) { 
        // Fallback to local file for development (ensure this path is relative to project root where server runs)
        console.log("[Firebase Admin Init] Using local firebase-adminsdk.json file.");
        const raw = fs.readFileSync('./firebase-adminsdk.json', 'utf8'); // Path relative to project root
        serviceAccount = JSON.parse(raw);
      } else {
        throw new Error("Firebase Admin SDK JSON configuration not found. Set FIREBASE_ADMIN_SDK_JSON_BASE64 env var or place firebase-adminsdk.json in the backend project root.");
      }

      if (!serviceAccount || !serviceAccount.project_id) { // Basic validation
         throw new Error("Service account JSON is invalid or missing project_id.");
      }

      initializeApp({ credential: cert(serviceAccount) });
      firebaseAdminAppInitialized = true; // Set flag after successful initialization
      console.log("[Firebase Admin Init] Firebase Admin SDK Initialized Successfully.");

    } catch (e) {
      console.error("[Firebase Admin Init Failed]:", e.message);
      // Depending on how critical Firebase Admin is at startup, you might:
      // 1. Re-throw the error to halt server startup (if Admin SDK is essential for all operations)
      // throw e; 
      // 2. Or just log and let app continue (API calls needing Admin SDK will then fail individually)
      // For now, just logging.
    }
  } else if (firebaseAdminAppInitialized) {
    // console.log("[Firebase Admin Init] Firebase Admin SDK already initialized (flag was set).");
  } else if (getApps().length > 0) {
    // This case means Firebase was initialized by some other means or another call to getApps()
    // console.log("[Firebase Admin Init] Firebase Admin SDK already initialized (getApps().length > 0).");
    firebaseAdminAppInitialized = true; // Set our flag to be consistent
  }
}
