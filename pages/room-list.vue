<template lang="html">
  <section class="section">
    <div class="container">
      <h1 class="title is-5">終了した部屋一覧</h1>
      <p class="content" v-if="rooms.length == 0">現在部屋がありません。</p><br>
      <table v-if="rooms.length > 0" class="table is-striped is-fullwidth is-size-7">
        <thead>
          <tr>
            <th>部屋名</th>
            <th>作成者</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="room in rooms" 
            :key="room['key']">
            <td>
              <span v-if="room['roomPassword'] != null && room['roomPassword'] !== ''" class="fas fa-key"></span>
              <span v-if="room['roomRating'] === 'R15' || room['roomRating'] === 'R18'" class="tag reverse-danger">{{ room['roomRating'] }}</span>
              <nuxt-link :to="{ path: 'room', query: { id: room.key, complete: true }}">{{ room.name }}</nuxt-link>
            </td>
            <td>{{ room['creatorName'] }}</td>
          </tr>
        </tbody>
      </table>
      <button v-if="!isDispAllRoom" class="button is-primary" @click="fetchAllRoom">全ての部屋を表示する</button>
    </div>
  </section>
</template>

<script>
import { INIT_OLD_ROOMS, INIT_ALL_OLD_ROOMS } from '../store/action-types'
export default {
  head() {
    return { title: '終了した部屋' }
  },
  data() {
    return {
      isDispAllRoom: false
    }
  },
  computed: {
    rooms() {
      return this.$store.getters.getOldRooms
    }
  },
  async fetch({ store }) {
    return await store.dispatch(INIT_OLD_ROOMS)
  },
  methods: {
    fetchAllRoom() {
      this.$store.dispatch(INIT_ALL_OLD_ROOMS)
      this.isDispAllRoom = true
    }
  }
}
</script>

<style lang="css">
.reverse-danger {
  border: 1px solid #ff3860;
  color: #ff3860 !important;
  background-color: #ffffff !important;
  padding: 5px !important;
}
</style>
