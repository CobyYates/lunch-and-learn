<script setup lang="ts">
const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();

const mode = ref<"signin" | "signup">("signin");
const email = ref("");
const password = ref("");
const displayName = ref("");
const busy = ref(false);
const errorMsg = ref<string | null>(null);

const isSignup = computed(() => mode.value === "signup");

function toggleMode() {
  mode.value = isSignup.value ? "signin" : "signup";
  errorMsg.value = null;
}

/** Map the noisier Firebase error codes to friendly copy. */
function friendly(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "auth/invalid-email": "That email address looks invalid.",
    "auth/missing-password": "Please enter a password.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/email-already-in-use": "An account already exists for that email.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/user-not-found": "No account found for that email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/popup-closed-by-user": "Sign-in popup was closed before finishing.",
  };
  return map[code] || (err as Error)?.message || "Something went wrong.";
}

async function run(fn: () => Promise<void>) {
  busy.value = true;
  errorMsg.value = null;
  try {
    await fn();
  } catch (err) {
    errorMsg.value = friendly(err);
  } finally {
    busy.value = false;
  }
}

const submit = () =>
  run(() =>
    isSignup.value
      ? signUpWithEmail(email.value, password.value, displayName.value)
      : signInWithEmail(email.value, password.value),
  );

const google = () => run(() => signInWithGoogle());
</script>

<template>
  <v-card max-width="420" class="mx-auto pa-2" elevation="4">
    <v-card-title class="text-h6">
      {{ isSignup ? "Create an account" : "Sign in" }}
    </v-card-title>
    <v-card-subtitle>
      {{
        isSignup
          ? "Sign up to request access to this slideshow."
          : "Sign in to continue."
      }}
    </v-card-subtitle>

    <v-card-text>
      <v-btn
        block
        variant="outlined"
        prepend-icon="mdi-google"
        :loading="busy"
        class="mb-4"
        @click="google"
      >
        Continue with Google
      </v-btn>

      <div class="d-flex align-center my-2 text-medium-emphasis">
        <v-divider />
        <span class="px-3 text-caption">or</span>
        <v-divider />
      </div>

      <v-form @submit.prevent="submit">
        <v-text-field
          v-if="isSignup"
          v-model="displayName"
          label="Name"
          autocomplete="name"
          variant="outlined"
          density="comfortable"
          class="mb-2"
        />
        <v-text-field
          v-model="email"
          label="Email"
          type="email"
          autocomplete="email"
          variant="outlined"
          density="comfortable"
          class="mb-2"
        />
        <v-text-field
          v-model="password"
          label="Password"
          type="password"
          :autocomplete="isSignup ? 'new-password' : 'current-password'"
          variant="outlined"
          density="comfortable"
        />

        <v-alert
          v-if="errorMsg"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          {{ errorMsg }}
        </v-alert>

        <v-btn
          block
          color="primary"
          type="submit"
          :loading="busy"
          class="mt-1"
        >
          {{ isSignup ? "Create account" : "Sign in" }}
        </v-btn>
      </v-form>
    </v-card-text>

    <v-card-actions class="justify-center">
      <span class="text-caption text-medium-emphasis">
        {{ isSignup ? "Already have an account?" : "Need an account?" }}
      </span>
      <v-btn variant="text" size="small" color="primary" @click="toggleMode">
        {{ isSignup ? "Sign in" : "Sign up" }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
