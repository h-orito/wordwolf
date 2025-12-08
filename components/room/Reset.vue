<template>
  <div class="panel" v-if="isOwner">
    <p class="is-size-7 has-text-left panel-heading">強制リセット</p>
    <div class="panel-block has-text-left">
      <p class="is-size-7 has-text-left">ゲームが進行不可能になった場合に開始前の状態に戻すことができます。</p>
      <button class="button is-danger is-small" @click="emit('submitRoomReset')">リセット</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Room } from '~/stores/types'

interface Props {
  room: Room | null
  user: { uid: string } | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  submitRoomReset: []
}>()

// computed
const isOwner = computed(() => {
  return (
    props.user != null &&
    props.room != null &&
    props.room.creatorRef === props.user.uid
  )
})
</script>

<style></style>
