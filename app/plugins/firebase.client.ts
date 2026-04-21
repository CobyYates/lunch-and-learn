import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export default defineNuxtPlugin(() => {
  const { firebase } = useRuntimeConfig().public;

  const app = getApps().length ? getApp() : initializeApp(firebase);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  return {
    provide: {
      firebase: { app, auth, firestore },
    },
  };
});
