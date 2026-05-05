<template>
  <v-main class="bg-grey-lighten-5">
    <v-container class="py-12">
      <div class="d-flex flex-column align-center text-center mb-10">
        <v-chip color="primary" variant="tonal" size="small" class="mb-4">
          Starter
        </v-chip>
        <h1 class="text-h3 font-weight-bold mb-3">Lunch &amp; Learn</h1>
        <p class="text-body-1 text-medium-emphasis" style="max-width: 640px">
          A minimal Nuxt 4 starter, pre-wired for
          <strong>Cloudflare Pages</strong> with
          <strong>Vuetify</strong> components and
          <strong>Tailwind</strong> utilities ready to go.
          Branch from <code>main</code> to add your own features.
        </p>
      </div>

      <v-row>
        <v-col cols="12" md="4">
          <v-card height="100%" variant="outlined" class="pa-2">
            <v-card-item>
              <template #prepend>
                <v-icon color="primary" size="32">mdi-nuxt</v-icon>
              </template>
              <v-card-title>Nuxt 4</v-card-title>
              <v-card-subtitle>SPA mode</v-card-subtitle>
            </v-card-item>
            <v-card-text>
              Configured with <code>ssr: false</code> so pages render in the
              browser. Add routes under <code>app/pages/</code>.
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card height="100%" variant="outlined" class="pa-2">
            <v-card-item>
              <template #prepend>
                <v-icon color="primary" size="32">mdi-cloud</v-icon>
              </template>
              <v-card-title>Cloudflare Pages</v-card-title>
              <v-card-subtitle>Edge-deployed</v-card-subtitle>
            </v-card-item>
            <v-card-text>
              <code>nitro.preset = "cloudflare-pages"</code> and
              <code>wrangler.toml</code> are wired up. Run
              <code>npm run build</code> to produce <code>dist/</code>.
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card height="100%" variant="outlined" class="pa-2">
            <v-card-item>
              <template #prepend>
                <v-icon color="primary" size="32">mdi-palette</v-icon>
              </template>
              <v-card-title>Vuetify + Tailwind</v-card-title>
              <v-card-subtitle>Components &amp; utilities</v-card-subtitle>
            </v-card-item>
            <v-card-text>
              Vuetify handles components and theming; Tailwind's utility
              classes are layered underneath so the two don't fight.
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-divider class="my-10" />

      <v-card variant="tonal" color="primary" class="pa-6">
        <h2 class="text-h5 font-weight-bold mb-2">Get started</h2>
        <p class="mb-4 text-body-2">
          Edit <code>app/pages/index.vue</code> to replace this page, or add
          a new route under <code>app/pages/</code>.
        </p>
        <div class="d-flex flex-wrap ga-2">
          <v-btn
            href="https://nuxt.com/docs"
            target="_blank"
            rel="noopener"
            color="primary"
            append-icon="mdi-open-in-new"
          >
            Nuxt docs
          </v-btn>
          <v-btn
            href="https://vuetifyjs.com/en/components/all/"
            target="_blank"
            rel="noopener"
            variant="outlined"
            color="primary"
            append-icon="mdi-open-in-new"
          >
            Vuetify components
          </v-btn>
          <v-btn
            href="https://tailwindcss.com/docs"
            target="_blank"
            rel="noopener"
            variant="outlined"
            color="primary"
            append-icon="mdi-open-in-new"
          >
            Tailwind docs
          </v-btn>
          <v-btn
            href="https://developers.cloudflare.com/pages/"
            target="_blank"
            rel="noopener"
            variant="outlined"
            color="primary"
            append-icon="mdi-open-in-new"
          >
            Cloudflare Pages
          </v-btn>
        </div>
      </v-card>
    </v-container>
  </v-main>
</template>
