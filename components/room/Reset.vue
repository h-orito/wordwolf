<template>
  <div class="panel" v-if="isOwner">
    <p class="is-size-7 has-text-left panel-heading">強制リセット</p>
    <div class="panel-block has-text-left">
      <p class="is-size-7 has-text-left">ゲームが進行不可能になった場合に開始前の状態に戻すことができます。</p>
      <button class="button is-danger is-small" @click="$emit('submitRoomReset')">リセット</button>
    </div>
  </div>
</template>

<script>
export default {
  props: ['room', 'user'],
  data: function() {
    return {}
  },
  computed: {
    isOwner: function() {
      return (
        this.user != null &&
        this.room != null &&
        this.room.creatorRef === this.user.uid
      )
    }
  },
  created: function() {},
  methods: {}
}
</script>

<style>
</style>
