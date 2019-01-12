<template>
  <div class="site">
    <GoogleAds/>
    <nav-bar/>
    <div class="siteContent">
      <nuxt class="has-text-centered"/>
    </div>
    <!-- <Footer/> -->
  </div>
</template>

<script>
import NavBar from '~/components/NavBar.vue'
import Footer from '~/components/Footer.vue'
import GoogleAds from '~/components/GoogleAds.vue'

export default {
  components: {
    NavBar,
    Footer,
    GoogleAds
  }
}
</script>
