<script setup lang="ts">
interface PricingTier {
  _uid: string;
  name: string;
  price: string;
  price_per?: string;
  featured?: boolean;
  tag?: string;
  features?: string; // one per line
  cta?: string;
}

defineProps<{
  blok: {
    eyebrow?: string;
    title?: string;
    tiers?: PricingTier[];
    repo_url?: string;
  };
}>();

const linesOf = (s: string | undefined) =>
  (s ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
</script>

<template>
  <div v-editable="blok" class="slide layout-pricing">
    <div class="slide-inner">
      <div v-if="blok.eyebrow" class="eyebrow">{{ blok.eyebrow }}</div>
      <h3 v-if="blok.title">{{ blok.title }}</h3>
      <div class="tiers">
        <div
          v-for="tier in blok.tiers ?? []"
          :key="tier._uid"
          class="tier"
          :class="{ featured: tier.featured }"
        >
          <span v-if="tier.featured && tier.tag" class="tag">{{ tier.tag }}</span>
          <h4>{{ tier.name }}</h4>
          <div class="price">
            <span class="big">{{ tier.price }}</span>
            <span v-if="tier.price_per" class="per">{{ tier.price_per }}</span>
          </div>
          <ul>
            <li v-for="(feat, i) in linesOf(tier.features)" :key="i">{{ feat }}</li>
          </ul>
          <v-btn
            v-if="tier.cta"
            class="cta"
            :variant="tier.featured ? 'flat' : 'tonal'"
            block
          >
            {{ tier.cta }}
          </v-btn>
        </div>
      </div>
    </div>
    <SlideMark :url="blok.repo_url" />
</div>
</template>
