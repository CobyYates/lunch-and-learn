import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";

export function useAuth() {
  const { $firebase } = useNuxtApp();
  const user = useState<User | null>("firebase-user", () => null);
  const authReady = useState<boolean>("firebase-auth-ready", () => false);

  const isConfigured = computed(() => $firebase?.configured === true);
  const missingConfig = computed<string[]>(() =>
    $firebase?.configured === false ? $firebase.missing : [],
  );
  const isSignedIn = computed(() => isConfigured.value && !!user.value);

  const ensureConfigured = () => {
    if (!$firebase?.configured) {
      throw new Error("Firebase is not configured");
    }
    return $firebase;
  };

  const signInWithGoogle = async () => {
    const fb = ensureConfigured();
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(fb.auth, provider);
    user.value = result.user;
    return result.user;
  };

  const signInWithEmail = async (email: string, password: string) => {
    const fb = ensureConfigured();
    const result = await signInWithEmailAndPassword(fb.auth, email, password);
    user.value = result.user;
    return result.user;
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const fb = ensureConfigured();
    const result = await createUserWithEmailAndPassword(fb.auth, email, password);
    user.value = result.user;
    return result.user;
  };

  const signOut = async () => {
    if (!$firebase?.configured) return;
    await firebaseSignOut($firebase.auth);
    user.value = null;
  };

  return {
    user,
    authReady,
    isConfigured,
    missingConfig,
    isSignedIn,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };
}
