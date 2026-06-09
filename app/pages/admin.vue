<script setup lang="ts">
const { loading, isAuthenticated, isAdmin, user, signOut } = useAuth();
const {
  users,
  loading: usersLoading,
  error,
  approve,
  reject,
  setStatus,
  setRole,
} = useUserAdmin();

useHead({ title: "Admin · Slideshow access" });

const statusColor: Record<string, string> = {
  approved: "success",
  pending: "warning",
  rejected: "error",
};

// Light optimistic guard so double-clicks don't fire duplicate writes.
const busyUid = ref<string | null>(null);
async function act(uid: string, fn: () => Promise<void>) {
  busyUid.value = uid;
  try {
    await fn();
  } catch (err) {
    console.error("[admin] action failed:", err);
  } finally {
    busyUid.value = null;
  }
}
</script>

<template>
  <div>
    <v-toolbar color="primary" density="comfortable" flat>
      <v-btn icon="mdi-arrow-left" to="/" />
      <v-toolbar-title>Slideshow access</v-toolbar-title>
      <v-spacer />
      <template v-if="isAuthenticated">
        <span class="text-caption mr-3 d-none d-sm-inline">
          {{ user?.email }}
        </span>
        <v-btn variant="text" prepend-icon="mdi-logout" @click="signOut">
          Sign out
        </v-btn>
      </template>
    </v-toolbar>

    <!-- resolving auth -->
    <div v-if="loading" class="pa-12 text-center">
      <v-progress-circular indeterminate color="primary" size="40" />
    </div>

    <!-- not signed in -->
    <div v-else-if="!isAuthenticated" class="pa-8">
      <AuthForm />
    </div>

    <!-- signed in but not an admin -->
    <v-container v-else-if="!isAdmin">
      <v-alert type="error" variant="tonal" class="mt-6" max-width="600">
        <v-alert-title>Not authorized</v-alert-title>
        You’re signed in as <strong>{{ user?.email }}</strong> but you don’t
        have admin access. Ask an existing admin to grant your account the
        <code>admin</code> role.
      </v-alert>
    </v-container>

    <!-- admin view -->
    <v-container v-else fluid>
      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        class="mb-4"
      >
        Could not load users: {{ error }}. Check your Firestore security rules.
      </v-alert>

      <v-progress-linear v-if="usersLoading" indeterminate color="primary" />

      <v-card v-else elevation="2">
        <v-card-title class="d-flex align-center">
          Users
          <v-chip class="ml-3" size="small" variant="tonal">
            {{ users.length }}
          </v-chip>
          <v-spacer />
          <v-chip size="small" color="warning" variant="tonal" class="mr-2">
            {{ users.filter((u) => u.status === "pending").length }} pending
          </v-chip>
        </v-card-title>
        <v-divider />

        <v-table>
          <thead>
            <tr>
              <th>User</th>
              <th>Status</th>
              <th>Role</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.uid">
              <td>
                <div class="d-flex align-center py-2">
                  <v-avatar size="36" class="mr-3" color="grey-lighten-2">
                    <v-img v-if="u.photoURL" :src="u.photoURL" />
                    <span v-else class="text-caption">
                      {{ (u.displayName || u.email || "?").charAt(0).toUpperCase() }}
                    </span>
                  </v-avatar>
                  <div>
                    <div class="font-weight-medium">
                      {{ u.displayName || "—" }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ u.email }}
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <v-chip
                  size="small"
                  :color="statusColor[u.status] || 'default'"
                  variant="tonal"
                >
                  {{ u.status }}
                </v-chip>
              </td>
              <td>
                <v-chip
                  size="small"
                  :color="u.role === 'admin' ? 'primary' : 'default'"
                  variant="tonal"
                >
                  {{ u.role }}
                </v-chip>
              </td>
              <td class="text-right">
                <v-btn
                  size="small"
                  color="success"
                  variant="text"
                  :disabled="u.status === 'approved' || busyUid === u.uid"
                  @click="act(u.uid, () => approve(u.uid))"
                >
                  Approve
                </v-btn>
                <v-btn
                  size="small"
                  color="error"
                  variant="text"
                  :disabled="u.status === 'rejected' || busyUid === u.uid"
                  @click="act(u.uid, () => reject(u.uid))"
                >
                  Reject
                </v-btn>
                <v-btn
                  v-if="u.status !== 'pending'"
                  size="small"
                  variant="text"
                  :disabled="busyUid === u.uid"
                  @click="act(u.uid, () => setStatus(u.uid, 'pending'))"
                >
                  Reset
                </v-btn>
                <v-menu>
                  <template #activator="{ props }">
                    <v-btn
                      icon="mdi-dots-vertical"
                      size="small"
                      variant="text"
                      v-bind="props"
                    />
                  </template>
                  <v-list density="compact">
                    <v-list-item
                      v-if="u.role !== 'admin'"
                      prepend-icon="mdi-shield-account"
                      :disabled="u.uid === user?.uid"
                      title="Make admin"
                      @click="act(u.uid, () => setRole(u.uid, 'admin'))"
                    />
                    <v-list-item
                      v-else
                      prepend-icon="mdi-shield-off"
                      :disabled="u.uid === user?.uid"
                      title="Remove admin"
                      @click="act(u.uid, () => setRole(u.uid, 'user'))"
                    />
                  </v-list>
                </v-menu>
              </td>
            </tr>
            <tr v-if="!users.length">
              <td colspan="4" class="text-center text-medium-emphasis py-8">
                No users yet. Accounts appear here after someone signs in.
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
    </v-container>
  </div>
</template>
