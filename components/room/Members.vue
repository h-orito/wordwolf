<template>
  <div class="panel" id="room-member">
    <p class="panel-heading is-size-7 has-text-left">参加者</p>
    <div
      class="panel-block is-size-7 has-text-left"
      v-if="members == null || members.length === 0"
    >参加者がいません</div>
    <div
      class="panel-block is-size-7 has-text-left"
      v-for="member in members"
      :key="member.key"
      style="height: 36px;"
    >
      <span
        class="membername"
        :class="(isMe(member) ? 'has-text-weight-bold' : '') + ' ' + member.color"
      >{{ member.name }}</span>
      <span v-if="isNotProgress && isCreator(member)" class="tag is-success is-pulled-right">部屋主</span>
      <span v-if="isGameMaster(member)" class="tag is-success is-pulled-right">GM</span>
      <span v-if="allowOpenSkill && isVillagers(member)" class="tag is-info is-pulled-right">村人</span>
      <span v-if="allowOpenSkill && isWolfs(member)" class="tag is-danger is-pulled-right">人狼</span>
    </div>
  </div>
</template>

<script>
import * as consts from '~/store/consts'
export default {
  props: ['room', 'members', 'user'],
  data: () => ({}),
  computed: {
    roomStatus() {
      if (this.room == null) {
        return ''
      }
      return this.room.status
    },
    isNotProgress: function() {
      return (
        this.room != null &&
        (this.roomStatus === consts.STATUS_PROLOGUE ||
          this.roomStatus === consts.STATUS_EPILOGUE)
      )
    },
    allowOpenSkill: function() {
      return (
        this.room != null &&
        (this.roomStatus === consts.STATUS_EPILOGUE ||
          this.roomStatus === consts.STATUS_COUNTER)
      )
    }
  },
  created: function() {},
  methods: {
    isMe: function(member) {
      return this.user != null && this.user.uid === member.key
    },
    isCreator: function(member) {
      return member.key === this.room.creatorRef
    },
    isGameMaster: function(member) {
      return (
        this.room != null &&
        this.room.gameMaster != null &&
        member.key === this.room.gameMaster.key
      )
    },
    isVillagers: function(member) {
      return this.room.villagers.some(v => v.key === member.key)
    },
    isWolfs: function(member) {
      return this.room.wolfs.some(w => w.key === member.key)
    }
  }
}
</script>

<style>
#room-member .membername {
  align-items: center;
  display: inline-flex;
  height: 2em;
  line-height: 1.5;
}

#room-member .tag {
  margin-left: 3px;
}
</style>
