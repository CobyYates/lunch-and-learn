<template>
  <v-container fluid class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4" class="d-flex align-center">
        <v-card width="100%">
          <template v-if="isConfigured">
            <v-tabs v-model="mode" color="primary" class="hover:bg-primary hover:text-white">
              <v-tab value="signin">Sign in</v-tab>
              <v-tab value="signup">Sign up</v-tab>
            </v-tabs>

            <v-card-text class="pt-6">
              <v-form
                ref="formRef"
                v-model="formValid"
                @submit.prevent="onEmailSubmit"
              >
                <v-text-field
                  density="compact"
                  variant="outlined"
                  v-model="email"
                  label="Email"
                  type="email"
                  autocomplete="email"
                  :rules="emailRules"
                  :disabled="busy"
                  required
                />
                <v-text-field
                  density="compact"
                  variant="outlined"
                  v-model="password"
                  label="Password"
                  type="password"
                  :autocomplete="
                    mode === 'signup' ? 'new-password' : 'current-password'
                  "
                  :rules="passwordRules"
                  :disabled="busy"
                  required
                />

                <v-btn
                  block
                  type="submit"
                  color="primary"
                  size="large"
                  variant="elevated"
                  class="mt-2"
                  :loading="busy && submitting"
                  :disabled="busy"
                >
                  {{ mode === "signup" ? "Create account" : "Sign in" }}
                </v-btn>
              </v-form>

              <div class="d-flex align-center ga-3 my-6">
                <v-divider />
                <span class="text-caption text-medium-emphasis text-center!">or</span>
                <v-divider />
              </div>

              <v-btn
                block
                variant="outlined"
                size="large"
                prepend-icon="mdi-google"
                :loading="busy && googleSigningIn"
                :disabled="busy"
                @click="onGoogleSignIn"
              >
                Continue with Google
              </v-btn>

              <v-alert
                v-if="errorMessage"
                type="error"
                class="mt-4"
                variant="tonal"
                closable
                @click:close="errorMessage = null"
              >
                {{ errorMessage }}
              </v-alert>
            </v-card-text>
          </template>

          <template v-else>
            <v-card-title class="text-h5 mb-2">
              Firebase isn't configured
            </v-card-title>
            <v-card-text class="pb-4">
              This app uses Firebase Auth (Google + email/password) for login.
              To enable it, finish the Firebase setup below.
            </v-card-text>

            <v-alert type="warning" variant="tonal" class="mb-4">
              Missing env vars:
              <ul class="mt-2 ml-4">
                <li v-for="key in missingConfig" :key="key">
                  <code>NUXT_PUBLIC_FIREBASE_{{ key.toUpperCase() }}</code>
                </li>
              </ul>
            </v-alert>

            <v-list density="comfortable" class="bg-transparent">
              <v-list-item>
                <v-list-item-title class="font-weight-bold">
                  1. Create a Firebase project
                </v-list-item-title>
                <v-list-item-subtitle class="text-wrap">
                  Go to
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noopener"
                    >console.firebase.google.com</a
                  >
                  and create a project.
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <v-list-item-title class="font-weight-bold">
                  2. Enable sign-in providers
                </v-list-item-title>
                <v-list-item-subtitle class="text-wrap">
                  Authentication → Sign-in method — enable
                  <strong>Google</strong> and <strong>Email/Password</strong>.
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <v-list-item-title class="font-weight-bold">
                  3. Register a web app
                </v-list-item-title>
                <v-list-item-subtitle class="text-wrap">
                  Project settings → Your apps → click
                  <strong>&lt;/&gt;</strong> to add a web app. Copy the config
                  values shown.
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <v-list-item-title class="font-weight-bold">
                  4. Add authorized domains
                </v-list-item-title>
                <v-list-item-subtitle class="text-wrap">
                  Authentication → Settings → Authorized domains — add
                  <code>localhost</code> and your Cloudflare Pages URL (e.g.
                  <code>lunch-and-learn.pages.dev</code>).
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <v-list-item-title class="font-weight-bold">
                  5. Fill in <code>.env</code>
                </v-list-item-title>
                <v-list-item-subtitle class="text-wrap">
                  Paste each value into the matching
                  <code>NUXT_PUBLIC_FIREBASE_*</code> variable, then restart
                  <code>npm run dev</code>.
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </template>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
const {
  isConfigured,
  missingConfig,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
} = useAuth();

definePageMeta({ layout: false });

const mode = ref<"signin" | "signup">("signin");
const email = ref("");
const password = ref("");
const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(
  null,
);
const formValid = ref(false);
const submitting = ref(false);
const googleSigningIn = ref(false);
const errorMessage = ref<string | null>(null);

const busy = computed(() => submitting.value || googleSigningIn.value);

const emailRules = [
  (v: string) => !!v || "Email is required",
  (v: string) => /.+@.+\..+/.test(v) || "Enter a valid email",
];
const passwordRules = computed(() => [
  (v: string) => !!v || "Password is required",
  (v: string) =>
    mode.value === "signin" ||
    v.length >= 6 ||
    "Password must be at least 6 characters",
]);

function friendlyError(err: any): string {
  const code = err?.code as string | undefined;
  const map: Record<string, string> = {
    "auth/invalid-email": "That email address isn't valid.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Wrong password.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/email-already-in-use": "An account with that email already exists.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/popup-closed-by-user": "Sign-in was cancelled.",
    "auth/popup-blocked": "Your browser blocked the sign-in popup.",
    "auth/unauthorized-domain":
      "This domain isn't authorized in Firebase. Add it under Authentication → Settings → Authorized domains.",
    "auth/operation-not-allowed":
      "Email/password sign-in isn't enabled for this Firebase project.",
    "auth/network-request-failed":
      "Network error. Check your connection and try again.",
  };
  return code && map[code]
    ? map[code]
    : (err?.message ?? "Something went wrong.");
}

const onEmailSubmit = async () => {
  errorMessage.value = null;
  const { valid } = (await formRef.value?.validate()) ?? { valid: false };
  if (!valid) return;

  submitting.value = true;
  try {
    if (mode.value === "signup") {
      await signUpWithEmail(email.value, password.value);
    } else {
      await signInWithEmail(email.value, password.value);
    }
    await navigateTo("/");
  } catch (err) {
    errorMessage.value = friendlyError(err);
  } finally {
    submitting.value = false;
  }
};

const onGoogleSignIn = async () => {
  errorMessage.value = null;
  googleSigningIn.value = true;
  try {
    await signInWithGoogle();
    await navigateTo("/");
  } catch (err) {
    errorMessage.value = friendlyError(err);
  } finally {
    googleSigningIn.value = false;
  }
};
</script>
