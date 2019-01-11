<template lang="html">
  <section class="section">
    <div class="container">
      <h1 class="title is-5">終了した部屋一覧</h1>
      <p class="content" v-if="rooms.length == 0">現在部屋がありません。</p><br>
      <table v-if="rooms.length > 0" class="table is-striped is-fullwidth is-size-7">
        <thead>
          <tr>
            <th>部屋名</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="room in rooms" 
            :key="room['key']">
            <td>
              <nuxt-link :to="{ path: 'room', query: { id: room.key, isComplete: true }}">{{ room.name }}</nuxt-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script>
import { INIT_OLD_ROOMS } from '../store/action-types'
export default {
  head() {
    return { title: '終了した部屋' }
  },
  data() {
    return {}
  },
  computed: {
    rooms() {
      return this.$store.getters.getOldRooms
    }
  },
  async fetch({ store }) {
    return await store.dispatch(INIT_OLD_ROOMS)
  },
  methods: {}
}
</script>

<style lang="css">
</style>
