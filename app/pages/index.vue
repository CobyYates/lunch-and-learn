<template>
  <div>
    <!--
      App chrome (Admin / Sign out) is only shown to signed-in users so that
      anonymous visitors see the pure Storyblok-driven homepage. The Hero
      section renders its own brand bar + primary action.
    -->
    <v-toolbar v-if="isAuthenticated" density="comfortable" color="primary" flat>
      <v-spacer />
      <v-btn
        v-if="isAdmin"
        to="/admin"
        variant="text"
        prepend-icon="mdi-shield-account"
      >
        Admin
      </v-btn>
      <v-btn variant="text" prepend-icon="mdi-logout" @click="signOut">
        Sign out
      </v-btn>
    </v-toolbar>

    <!-- Homepage content is authored in Storyblok as the `home` Page story. -->
    <StoryblokComponent v-if="story" :blok="(story as any).content" />

    <v-container v-else>
      <v-alert type="info" variant="tonal" class="mt-6" max-width="640">
        <v-alert-title>No home page yet</v-alert-title>
        Run <code>npm run storyblok:stories</code> to seed the <strong>home</strong>
        page with the Hero, Feature Grid, Slideshow Grid and GitHub sections, then
        publish it in Storyblok.
      </v-alert>
    </v-container>
  </div>
</template>

<script setup lang="ts">
// `/` maps to the `home` story; renders its `page` sections via StoryblokComponent.
const story = await useStory("home");

const { isAuthenticated, isAdmin, signOut } = useAuth();
</script>
