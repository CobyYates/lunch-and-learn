import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import type { AccessStatus, UserProfile, UserRole } from "~/composables/useAuth";

/**
 * Live list of every `users/{uid}` profile plus mutations the admin page needs.
 * Reads/writes are additionally guarded by Firestore security rules (see
 * `firestore.rules`) so a non-admin can't call these successfully.
 */
export function useUserAdmin() {
  const users = ref<UserProfile[]>([]);
  const loading = ref(true);
  const error = ref<string | null>(null);
  let unsub: Unsubscribe | null = null;

  function startListening() {
    if (!import.meta.client) return;
    const { $firebaseDb } = useNuxtApp();
    if (!$firebaseDb) {
      error.value = "Firebase is not configured.";
      loading.value = false;
      return;
    }
    const q = query(
      collection($firebaseDb as any, "users"),
      orderBy("createdAt", "desc"),
    );
    unsub = onSnapshot(
      q,
      (snap) => {
        users.value = snap.docs.map((d) => d.data() as UserProfile);
        loading.value = false;
      },
      (err) => {
        error.value = err.message;
        loading.value = false;
      },
    );
  }

  function setStatus(uid: string, status: AccessStatus) {
    const { $firebaseDb } = useNuxtApp();
    return updateDoc(doc($firebaseDb as any, "users", uid), {
      status,
      updatedAt: serverTimestamp(),
    });
  }

  function setRole(uid: string, role: UserRole) {
    const { $firebaseDb } = useNuxtApp();
    return updateDoc(doc($firebaseDb as any, "users", uid), {
      role,
      updatedAt: serverTimestamp(),
    });
  }

  const approve = (uid: string) => setStatus(uid, "approved");
  const reject = (uid: string) => setStatus(uid, "rejected");

  onMounted(startListening);
  onBeforeUnmount(() => unsub?.());

  return { users, loading, error, approve, reject, setStatus, setRole };
}
