export default defineNuxtConfig({
  extends: ['./layers/cellar', './layers/auth'],
  modules: ['@nuxt/ui', '@nuxtjs/supabase'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  compatibilityDate: '2025-04-01',
  runtimeConfig: {
    databaseUrl: '',
  },
  supabase: {
    url: 'https://setup-required.supabase.co',
    key: 'setup-required',
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
    },
  },
  colorMode: {
    preference: 'light',
    fallback: 'light',
    storageKey: 'ma-cave-a-vin-color-mode',
  },
})
