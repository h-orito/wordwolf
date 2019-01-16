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
      <button
        v-if="canKick"
        class="tag is-small is-pulled-right"
        :class="isCreator(member) ? 'is-default' : 'is-danger'"
        style="cursor: pointer;"
        :disabled="isCreator(member)"
        @click="$emit('kick', { memberKey: member.key, memberName: member.name })"
      >×</button>
      <span v-if="isGameMaster(member)" class="tag reverse-success is-pulled-right">GM</span>
      <span v-if="allowOpenSkill && isVillagers(member)" class="tag reverse-info is-pulled-right">村人</span>
      <span v-if="allowOpenSkill && isWolfs(member)" class="tag reverse-danger is-pulled-right">人狼</span>
      <span v-if="displayDoneVote(member)" class="tag reverse-info is-pulled-right">投票済</span>
      <span
        v-if="isNotProgress && isCreator(member)"
        class="tag reverse-success is-pulled-right"
      >部屋主</span>
    </div>
  </div>
</template>

<script>
import * as consts from '~/store/consts'
export default {
  props: ['room', 'members', 'voteKeys', 'user'],
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
    },
    canKick: function() {
      return (
        this.room != null &&
        this.user != null &&
        (this.roomStatus === consts.STATUS_EPILOGUE ||
          this.roomStatus === consts.STATUS_COUNTER) &&
        this.room.creatorRef === this.user.uid
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
    },
    doneVote: function(member) {
      return this.voteKeys.some(v => v.uid === member.key)
    },
    displayDoneVote: function(member) {
      return (
        this.doneVote(member) &&
        this.room != null &&
        this.roomStatus !== consts.STATUS_EPILOGUE
      )
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

#room-member .reverse-success {
  border: 1px solid #23d160;
  color: #23d160;
  background-color: #ffffff;
}

#room-member .reverse-info {
  border: 1px solid #209cee;
  color: #209cee;
  background-color: #ffffff;
}

#room-member .reverse-danger {
  border: 1px solid #ff3860;
  color: #ff3860;
  background-color: #ffffff;
}
</style>
