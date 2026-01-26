export default defineNuxtConfig({
  compatibilityDate: '2025-01-24',
  devtools: { enabled: true },
  ssr: false,

  vite: {
    define: {
      // bcryptjsのNode.js crypto使用を抑制
      'process.browser': true
    }
  },

  app: {
    head: {
      titleTemplate: '%s | ワードウルフオンライン',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'ワードウルフ、ワード人狼をオンラインで遊べるサービスです。'
        }
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
    }
  },

  css: [
    'bulma/css/bulma.css',
    '@fortawesome/fontawesome-free/css/all.css',
    '~/assets/main.scss'
  ],

  modules: ['nuxt-vuefire', '@pinia/nuxt', '@nuxt/eslint'],

  vuefire: {
    auth: {
      enabled: true
    },
    config: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.FIREBASE_DATABASEURL,
      projectId: process.env.FIREBASE_PROJECTID,
      storageBucket: process.env.FIREBASE_STORAGEBUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGINGSENDERID
    }
  },

  runtimeConfig: {
    public: {
      // 公開設定
    }
  }
})
