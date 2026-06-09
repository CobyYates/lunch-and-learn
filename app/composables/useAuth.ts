import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";

export type AccessStatus = "pending" | "approved" | "rejected";
export type UserRole = "user" | "admin";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  status: AccessStatus;
  role: UserRole;
}

// ---- module-level singleton state (ssr:false → one client instance) -------
const user = ref<User | null>(null);
const profile = ref<UserProfile | null>(null);
const loading = ref(true);
let started = false;
let profileUnsub: Unsubscribe | null = null;

function adminAllowlist(): string[] {
  const raw = useRuntimeConfig().public.adminEmails || "";
  return String(raw)
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Make sure a `users/{uid}` profile doc exists for the signed-in account, then
 * subscribe to it so `status`/`role` changes (e.g. an admin approving them)
 * propagate live. New accounts start as `pending` unless their email is in the
 * admin allowlist, which bootstraps them as an approved admin.
 */
async function syncProfile(fbUser: User) {
  const { $firebaseDb } = useNuxtApp();
  const ref_ = doc($firebaseDb as any, "users", fbUser.uid);

  try {
    const snap = await getDoc(ref_);
    if (!snap.exists()) {
      const isAllowlistedAdmin = adminAllowlist().includes(
        (fbUser.email || "").toLowerCase(),
      );
      await setDoc(ref_, {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        photoURL: fbUser.photoURL,
        status: isAllowlistedAdmin ? "approved" : "pending",
        role: isAllowlistedAdmin ? "admin" : "user",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    // Rules may reject the write before bootstrap; don't break the app.
    console.error("[useAuth] failed to ensure user profile doc:", err);
  }

  profileUnsub?.();
  profileUnsub = onSnapshot(ref_, (snap) => {
    profile.value = snap.exists() ? (snap.data() as UserProfile) : null;
  });
}

/** Start listening to auth state. Idempotent + client-only. */
function start() {
  if (started || !import.meta.client) return;

  const { $firebaseAuth } = useNuxtApp();
  if (!$firebaseAuth) {
    // Firebase not configured — leave loading false so gates don't hang.
    loading.value = false;
    return;
  }
  started = true;

  onAuthStateChanged($firebaseAuth as any, async (fbUser) => {
    user.value = fbUser;
    if (fbUser) {
      await syncProfile(fbUser);
    } else {
      profileUnsub?.();
      profileUnsub = null;
      profile.value = null;
    }
    loading.value = false;
  });
}

export function useAuth() {
  start();

  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => {
    if (profile.value?.role === "admin") return true;
    const email = (user.value?.email || "").toLowerCase();
    return !!email && adminAllowlist().includes(email);
  });
  // Admins are implicitly approved; everyone else needs explicit approval.
  const isApproved = computed(
    () => isAdmin.value || profile.value?.status === "approved",
  );
  const status = computed<AccessStatus>(
    () => profile.value?.status ?? "pending",
  );

  // ---- actions ------------------------------------------------------------
  async function signInWithGoogle() {
    const { $firebaseAuth } = useNuxtApp();
    await signInWithPopup($firebaseAuth as any, new GoogleAuthProvider());
  }

  async function signInWithEmail(email: string, password: string) {
    const { $firebaseAuth } = useNuxtApp();
    await signInWithEmailAndPassword($firebaseAuth as any, email, password);
  }

  async function signUpWithEmail(
    email: string,
    password: string,
    displayName?: string,
  ) {
    const { $firebaseAuth } = useNuxtApp();
    const cred = await createUserWithEmailAndPassword(
      $firebaseAuth as any,
      email,
      password,
    );
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    await syncProfile(cred.user);
  }

  async function signOut() {
    const { $firebaseAuth } = useNuxtApp();
    await fbSignOut($firebaseAuth as any);
  }

  return {
    user,
    profile,
    loading,
    isAuthenticated,
    isApproved,
    isAdmin,
    status,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };
}
