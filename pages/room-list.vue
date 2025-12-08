<template>
  <section class="section">
    <div class="container">
      <h1 class="title is-5">最近終了した部屋</h1>
      <p class="content" v-if="rooms.length === 0">現在部屋がありません。</p>
      <br />
      <table v-if="rooms.length > 0" class="table is-striped is-fullwidth is-size-7">
        <thead>
          <tr>
            <th class="has-text-left">部屋名</th>
            <th>作成者</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="room in rooms" :key="room.key">
            <td class="has-text-left">
              <span
                v-if="room.roomPassword != null && room.roomPassword !== ''"
                class="fas fa-key"
              ></span>
              <span
                v-if="room.roomRating === 'R15' || room.roomRating === 'R18'"
                class="tag reverse-danger"
              >{{ room.roomRating }}</span>
              <NuxtLink :to="{ path: '/room', query: { id: room.key, complete: 'true' } }">
                {{ room.name }}
              </NuxtLink>
            </td>
            <td>{{ room.creatorName }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRoomsStore } from '~/stores/rooms'

useHead({
  title: '終了した部屋'
})

const roomsStore = useRoomsStore()

// computed
const rooms = computed(() => roomsStore.oldRooms)

// fetch old rooms
await roomsStore.initOldRooms()
</script>

<style lang="css">
.reverse-danger {
  border: 1px solid #ff3860;
  color: #ff3860 !important;
  background-color: #ffffff !important;
  padding: 5px !important;
}
</style>
