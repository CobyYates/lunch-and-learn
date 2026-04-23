import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, onAuthStateChanged, type Auth, type User } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

type FirebaseProvides =
  | {
      configured: true;
      app: FirebaseApp;
      auth: Auth;
      firestore: Firestore;
    }
  | {
      configured: false;
      missing: string[];
    };

function configuredKeys(config: Record<string, string | undefined>) {
  const required = [
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId",
  ] as const;
  return required.filter((k) => !config[k]);
}

export default defineNuxtPlugin(async () => {
  const { firebase: config } = useRuntimeConfig().public;
  const user = useState<User | null>("firebase-user", () => null);
  const authReady = useState<boolean>("firebase-auth-ready", () => false);

  const missing = configuredKeys(config as Record<string, string | undefined>);

  if (missing.length > 0) {
    authReady.value = true;
    return {
      provide: {
        firebase: { configured: false, missing } as FirebaseProvides,
      },
    };
  }

  const app = getApps().length ? getApp() : initializeApp(config);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  await new Promise<void>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      user.value = u;
      if (!authReady.value) {
        authReady.value = true;
        resolve();
      }
    });
    // Keep the listener active for the life of the app — do not unsubscribe.
    void unsubscribe;
  });

  return {
    provide: {
      firebase: {
        configured: true,
        app,
        auth,
        firestore,
      } as FirebaseProvides,
    },
  };
});
