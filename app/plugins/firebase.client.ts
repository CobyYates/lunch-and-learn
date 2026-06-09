import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/**
 * Initialise the Firebase client SDK once and expose `$firebaseAuth` and
 * `$firebaseDb` to the rest of the app. Client-only — the app runs with
 * `ssr: false`, and the Firebase web SDK is browser-only anyway.
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public;

  // Without an API key Firebase init throws and would take the whole app down.
  // Bail gracefully so non-gated pages still work before env vars are set.
  if (!config.firebaseApiKey) {
    console.warn(
      "[firebase] NUXT_PUBLIC_FIREBASE_* env vars are not set — auth disabled.",
    );
    return;
  }

  const firebaseConfig = {
    apiKey: config.firebaseApiKey,
    authDomain: config.firebaseAuthDomain,
    projectId: config.firebaseProjectId,
    storageBucket: config.firebaseStorageBucket,
    messagingSenderId: config.firebaseMessagingSenderId,
    appId: config.firebaseAppId,
  };

  // getApps() guard keeps HMR from re-initialising during dev.
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth: Auth = getAuth(app);
  const db: Firestore = getFirestore(app);

  return {
    provide: {
      firebaseAuth: auth,
      firebaseDb: db,
    },
  };
});
