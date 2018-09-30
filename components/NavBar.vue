<template>
  <nav class="navbar has-background-light">
    <div class="navbar-brand">
      <nuxt-link 
        class="navbar-item" 
        to="/">
        <img 
          src="https://bulma.io/images/bulma-logo.png" 
          alt="Bulma" 
          width="112" 
          height="28">
      </nuxt-link>
      <div 
        :class="{'is-active': showNav}" 
        class="navbar-burger burger" 
        data-target="navbarMenu" 
        @click="showNav = !showNav">
        <span/>
        <span/>
        <span/>
      </div>
    </div>
    <div 
      id="navbarExampleTransparentExample" 
      :class="{'is-active':showNav}" 
      class="navbar-menu">
      <div class="navbar-end">
        <nuxt-link 
          class="navbar-item" 
          to="/">
          Home
        </nuxt-link>
        <div class="navbar-item has-dropdown is-hoverable">
          <div class="navbar-dropdown is-boxed">
            <nuxt-link 
              v-for="item in items" 
              :key="item.title" 
              :to="item.url" 
              class="navbar-item">
              {{ item.title }}
            </nuxt-link>
          </div>
        </div>
        <div class="navbar-item">
          <p class="control">
            <a 
              class="button is-primary" 
              href="https://github.com/jgthms/bulma/releases/download/0.7.0/bulma-0.7.0.zip">
              <span class="icon">
                <i class="fa fa-download"/>
              </span>
              <span>Download</span>
            </a>
          </p>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  data: () => ({
    showNav: false,
    items: [{ title: 'Home', icon: 'home', url: '/' }]
  })
}
</script>

<style>
.navbar {
  margin-bottom: 20px;
}
</style>
