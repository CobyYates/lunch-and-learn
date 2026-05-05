<script setup lang="ts">
interface TeamMember {
  _uid: string;
  name: string;
  role?: string;
  bio?: string;
  initials?: string;
  image?: { filename?: string; alt?: string };
}

defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    members?: TeamMember[];
    repo_url?: string;
  };
}>();
</script>

<template>
  <div v-editable="blok" class="slide layout-team">
    <div class="slide-inner">
      <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
      <h3 v-if="blok.title">{{ blok.title }}</h3>
      <div class="cards">
        <div v-for="m in blok.members ?? []" :key="m._uid" class="card">
          <v-avatar
            class="avatar"
            :image="m.image?.filename || undefined"
            rounded
          >
            <template v-if="!m.image?.filename">{{ m.initials }}</template>
          </v-avatar>
          <h4>{{ m.name }}</h4>
          <span v-if="m.role" class="role">{{ m.role }}</span>
          <p v-if="m.bio">{{ m.bio }}</p>
        </div>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
</div>
</template>
