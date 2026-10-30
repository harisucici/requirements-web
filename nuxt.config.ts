export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  css: ['assets/css/main.css', 'assets/css/wasteland.css'],
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    backendProxyTarget: process.env.NUXT_BACKEND_PROXY_TARGET || '',
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || ''
    }
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#191b17' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800;900&family=Barlow:wght@400;500;600;700&family=Share+Tech+Mono&display=swap'
        }
      ]
    }
  },
  typescript: {
    strict: true
  }
})
