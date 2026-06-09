<script setup lang="ts">
const props = defineProps<{ required?: boolean }>();

const { loading, isAuthenticated, isApproved, status, user, signOut } =
  useAuth();

// Gate only matters when the slideshow opts in AND we're in the browser.
const gated = computed(() => !!props.required);
</script>

<template>
  <!-- open slideshow, or approved viewer: render it -->
  <slot v-if="!gated || (isAuthenticated && isApproved)" />

  <!-- still resolving auth state -->
  <div v-else-if="loading" class="gate-wrap">
    <v-progress-circular indeterminate color="primary" size="40" />
  </div>

  <!-- not signed in: show the login / sign-up form -->
  <div v-else-if="!isAuthenticated" class="gate-wrap">
    <div class="gate-inner">
      <div class="text-center mb-4">
        <v-icon size="40" color="primary">mdi-lock-outline</v-icon>
        <h2 class="text-h6 mt-2">This slideshow is private</h2>
        <p class="text-body-2 text-medium-emphasis">
          Sign in to request access.
        </p>
      </div>
      <AuthForm />
    </div>
  </div>

  <!-- signed in but not approved -->
  <div v-else class="gate-wrap">
    <v-card max-width="460" class="mx-auto pa-4 text-center" elevation="4">
      <template v-if="status === 'rejected'">
        <v-icon size="44" color="error">mdi-account-cancel-outline</v-icon>
        <h2 class="text-h6 mt-3">Access denied</h2>
        <p class="text-body-2 text-medium-emphasis mt-1">
          Your request to view this slideshow was not approved. Contact an
          administrator if you think this is a mistake.
        </p>
      </template>
      <template v-else>
        <v-icon size="44" color="warning">mdi-clock-outline</v-icon>
        <h2 class="text-h6 mt-3">Awaiting approval</h2>
        <p class="text-body-2 text-medium-emphasis mt-1">
          Thanks{{ user?.displayName ? `, ${user.displayName}` : "" }}! Your
          request is pending. An administrator needs to approve
          <strong>{{ user?.email }}</strong> before you can view this
          slideshow. This page updates automatically once you're approved.
        </p>
      </template>
      <v-btn
        variant="text"
        size="small"
        class="mt-3"
        prepend-icon="mdi-logout"
        @click="signOut"
      >
        Sign out
      </v-btn>
    </v-card>
  </div>
</template>

<style scoped>
.gate-wrap {
  display: grid;
  place-items: center;
  min-height: 70vh;
  padding: 2rem 1rem;
}
.gate-inner {
  width: 100%;
  max-width: 420px;
}
</style>
