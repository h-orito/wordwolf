<template lang="html">
  <section class="container">
    <div>
      <h1 class="title">Nuxtapp</h1>
      <div class="rooms">
        <ul>
          <li 
            v-for="room in rooms" 
            :key="room['key']">
            {{ room['name'] }}
            <button @click="removeRoom(room['key'])">X</button>
          </li>
        </ul>
      </div>
      <input 
        v-model="roomName" 
        type="text" 
        @keyup.enter="addRoom">
    </div>
  </section>
</template>

<script>
import { INIT_ROOM, ADD_ROOM, REMOVE_ROOM } from '../store/action-types'
export default {
  data() {
    return {
      roomName: ''
    }
  },
  computed: {
    rooms() {
      return this.$store.getters.getRooms
    }
  },
  async fetch({ store }) {
    return await store.dispatch(INIT_ROOM)
  },
  methods: {
    addRoom() {
      this.$store.dispatch(ADD_ROOM, this.roomName)
      this.roomName = ''
    },
    removeRoom(key) {
      this.$store.dispatch(REMOVE_ROOM, key)
    }
  }
}
</script>

<style lang="css">
</style>
