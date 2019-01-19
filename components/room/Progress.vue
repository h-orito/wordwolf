<template>
  <div class="panel" v-if="isProgress">
    <p class="is-size-7 has-text-left panel-heading">ゲーム進行中</p>
    <div class="panel-block is-size-7 has-text-left" v-if="isGameMaster">
      <p>
        村人のワードは
        <span class="has-text-weight-bold is-size-6">{{ room.villagersWord }}</span> です。
        <br>人狼のワードは
        <span class="has-text-weight-bold is-size-6">{{ room.wolfWord }}</span> です。
        <br>
      </p>
    </div>
    <div class="panel-block is-size-7 has-text-left" v-if="!isGameMaster">
      <div class="content">
        <p v-if="isMember && !isGameMaster" style="margin-bottom: 10px;">
          あなたのワードは
          <span class="has-text-weight-bold is-size-6">{{ myWord }}</span> です。
          <br>ワードについて話して人狼（少数派）を探しましょう。
        </p>
      </div>
    </div>
    <div class="panel-block is-size-7 has-text-left">
      <p class="is-size-7">
        残り時間
        <span class="has-text-weight-bold is-size-6">{{ leftTime }}</span> 秒
      </p>
      <progress
        class="progress is-small"
        :class="leftTime < room.talkMinutes * 15 ? 'is-danger' : leftTime < room.talkMinutes * 30 ? 'is-warning' : 'is-primary'"
        :value="leftTime"
        :max="room.talkMinutes * 60"
        style="margin-bottom: 0.5rem;"
      ></progress>
    </div>
    <div class="panel-block is-size-7 has-text-left" v-if="isMember && !isGameMaster">
      <div v-if="doneVote">他の人が投票するまでお待ちください。</div>
      <div v-if="!doneVote">
        <p class="is-size-7" v-if="isMember && !isGameMaster && leftTime <= 0">投票の時間になりました。</p>
        <p style="margin-bottom: 5px;">人狼（少数派）だと思う人に投票してください。（変更不可）</p>
        <p class="is-size-7" v-if="isMember && !isGameMaster && leftTime > 0">議論時間終了後に投票することもできます。</p>
        <button
          v-for="mem in gameMember"
          :key="mem.key"
          class="button is-default is-small has-text-weight-bold"
          :class="mem.color"
          @click="$emit('vote', mem.key)"
        >{{ mem.name }}</button>
      </div>
    </div>
    <div
      class="panel-block is-size-7 has-text-left"
      v-if="isMember && isGameMaster && leftTime <= 0"
    >
      <p style="margin-bottom: 5px;">投票の時間になりました。
        <br>全員が投票するまでお待ちください。
      </p>
    </div>
    <div v-if="isOwner || isGameMaster" class="panel-block is-size-7 has-text-left">
      <p style="margin-bottom: 5px;">強制的に投票を打ち切って進行させることもできます。</p>
      <button class="button is-danger is-small" @click="$emit('endVote')">投票を打ち切る</button>
    </div>
  </div>
</template>

<script>
import * as consts from '~/store/consts'
export default {
  props: ['room', 'members', 'voteKeys', 'user', 'leftTime'],
  data: function() {
    return {}
  },
  computed: {
    roomStatus() {
      if (this.room == null) {
        return ''
      }
      return this.room.status
    },
    isProgress() {
      return this.roomStatus === consts.STATUS_PROGRESS
    },
    isMember() {
      return (
        this.user != null && this.members.some(mem => mem.key === this.user.uid)
      )
    },
    isOwner: function() {
      return (
        this.user != null &&
        this.room != null &&
        this.room.creatorRef === this.user.uid
      )
    },
    isGameMaster() {
      return (
        this.room != null &&
        this.user != null &&
        this.room.gameMaster.key === this.user.uid
      )
    },
    myWord() {
      if (isVillagers(this.room.villagers, this.user)) {
        return this.room.villagersWord
      } else if (this.isWolfs) {
        return this.room.wolfWord
      } else {
        return ''
      }
    },
    isWolfs() {
      return (
        this.room != null &&
        this.user != null &&
        this.room.wolfs.some(w => w.key === this.user.uid)
      )
    },
    votes() {
      if (this.voteKeys == null) {
        return []
      }
      return this.voteKeys.map(v => {
        return {
          from: this.members.filter(m => m.key === v.uid)[0],
          to: this.members.filter(m => m.key === v.target)[0]
        }
      })
    },
    doneVote() {
      return this.votes.some(
        v => v.from != null && v.from.key === this.user.uid
      )
    },
    gameMember() {
      return this.members.filter(m => {
        return m.key !== this.room.gameMaster.key && m.key !== this.user.uid
      })
    }
  },
  created: function() {},
  methods: {}
}

const isVillagers = function(villagers, user) {
  return villagers.some(vil => vil.key === user.uid)
}
</script>

<style>
</style>
