<template>
  <div>
    <v-app-bar color="primary" density="comfortable" flat>
      <v-app-bar-title>Slideshows</v-app-bar-title>
      <v-spacer />
      <template v-if="user">
        <v-avatar v-if="user.photoURL" size="32" class="mr-2">
          <v-img :src="user.photoURL" :alt="user.displayName ?? 'User'" />
        </v-avatar>
        <span class="text-body-2 mr-3">{{
          user.displayName || user.email
        }}</span>
        <v-btn variant="text" prepend-icon="mdi-logout" @click="onSignOut">
          Sign out
        </v-btn>
      </template>
    </v-app-bar>

    <v-container class="py-8">
      <v-progress-linear v-if="pending" indeterminate color="primary" />

      <v-alert v-if="error" type="error" variant="tonal" class="my-4">
        Failed to load slideshows from Storyblok. Check the browser console for
        details.
      </v-alert>

      <v-alert
        v-else-if="!pending && stories.length === 0"
        type="info"
        variant="tonal"
        class="my-4"
      >
        No slideshows found. In Storyblok, create a folder named
        <strong>slide-shows</strong> and add stories of content-type
        <strong>slideshow</strong>.
      </v-alert>

      <v-row v-else>
        <v-col
          v-for="story in stories"
          :key="story.uuid"
          cols="12"
          sm="6"
          md="4"
        >
          <v-card height="100%" hover>
            <v-img
              v-if="slideshowOf(story).image?.filename"
              :src="slideshowOf(story).image!.filename"
              :alt="slideshowOf(story).image?.alt ?? slideshowOf(story).title"
              height="200"
              cover
            />
            <div
              v-else
              class="d-flex align-center justify-center bg-grey-lighten-2"
              style="height: 200px"
            >
              <v-icon size="48" color="grey">mdi-image-outline</v-icon>
            </div>

            <v-card-title class="text-truncate">
              {{ slideshowOf(story).title || story.name }}
            </v-card-title>

            <v-card-subtitle>
              {{ (slideshowOf(story).Slides ?? []).length }} slides
            </v-card-subtitle>

            <v-card-text>
              <div class="d-flex align-center mb-1">
                <v-icon size="16" class="mr-2">mdi-calendar-plus</v-icon>
                <span class="text-caption">
                  Created
                  <time
                    :title="
                      formatFull(story.first_published_at ?? story.created_at)
                    "
                  >
                    {{
                      formatRelative(
                        story.first_published_at ?? story.created_at,
                      )
                    }}
                  </time>
                </span>
              </div>
              <div class="d-flex align-center">
                <v-icon size="16" class="mr-2">mdi-calendar-edit</v-icon>
                <span class="text-caption">
                  Edited
                  <time
                    :title="formatFull(story.published_at ?? story.updated_at)"
                  >
                    {{ formatRelative(story.published_at ?? story.updated_at) }}
                  </time>
                </span>
              </div>
            </v-card-text>

            <v-card-actions>
              <v-btn
                :to="`/${story.full_slug}`"
                variant="text"
                color="primary"
                append-icon="mdi-arrow-right"
              >
                Open
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
const { user, signOut } = useAuth();
const { stories, pending, error } = await useStories({
  starts_with: "slide-shows/",
  content_type: "Slideshow",
});

interface SlideshowContent {
  title?: string;
  image?: { filename?: string; alt?: string };
  Slides?: unknown[];
}

const slideshowOf = (story: { content: Record<string, unknown> }) =>
  story.content as SlideshowContent;

const onSignOut = async () => {
  await signOut();
  await navigateTo("/login");
};
</script>
