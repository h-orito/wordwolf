<template lang="html">
  <section class="container">
    <div>
      <h1 class="title">Nuxtapp</h1>
      <div class="games">
        <ul>
          <li 
            v-for="game in games" 
            :key="game['key']">
            {{ game['name'] }}
            <button @click="removeGame(game['key'])">X</button>
          </li>
        </ul>
      </div>
      <input 
        v-model="gameName" 
        type="text" 
        @keyup.enter="addGame">
    </div>
  </section>
</template>

<script>
import { INIT_GAME, ADD_GAME, REMOVE_GAME } from '../store/action-types'
export default {
  data() {
    return {
      gameName: ''
    }
  },
  computed: {
    games() {
      return this.$store.getters.getGames
    }
  },
  async fetch({ store }) {
    return await store.dispatch(INIT_GAME)
  },
  methods: {
    addGame() {
      this.$store.dispatch(ADD_GAME, this.gameName)
      this.gameName = ''
    },
    removeGame(key) {
      this.$store.dispatch(REMOVE_GAME, key)
    }
  }
}
</script>

<style lang="css">
</style>
