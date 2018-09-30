<template>
  <div class="site">
    <nav-bar/>
    <div class="siteContent">
      <nuxt class="has-text-centered"/>
    </div>
    <footer-bar/>
  </div>
</template>

<script>
import NavBar from '~/components/NavBar.vue'
import FooterBar from '~/components/FooterBar.vue'

export default {
  components: {
    NavBar,
    FooterBar
  }
}
</script>
