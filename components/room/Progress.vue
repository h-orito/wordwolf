<template>
  <div v-if="isProgress" class="panel">
    <p class="is-size-7 has-text-left panel-heading">ゲーム進行中</p>
    <div v-if="isGameMaster" class="panel-block is-size-7 has-text-left">
      <p>
        村人のワードは
        <span class="has-text-weight-bold is-size-6">{{ room?.villagersWord }}</span> です。
        <br>人狼のワードは
        <span class="has-text-weight-bold is-size-6">{{ room?.wolfWord }}</span> です。
        <br>
      </p>
    </div>
    <div v-if="!isGameMaster" class="panel-block is-size-7 has-text-left sp-fixed-second-bottom">
      <div class="content">
        <p v-if="isMember && !isGameMaster" style="margin-bottom: 10px;">
          あなたのワードは
          <span class="has-text-weight-bold is-size-6">{{ myWord }}</span>
          です。
        </p>
      </div>
    </div>
    <div class="panel-block is-size-7 has-text-left sp-fixed-bottom">
      <p class="is-size-7">
        残り時間
        <span class="has-text-weight-bold is-size-6">{{ leftTime }}</span> 秒
      </p>
      <progress
        class="progress is-small"
        :class="leftTime < (room?.talkMinutes || 2) * 15 ? 'is-danger' : leftTime < (room?.talkMinutes || 2) * 30 ? 'is-warning' : 'is-primary'"
        :value="leftTime"
        :max="(room?.talkMinutes || 2) * 60"
        style="margin-bottom: 0.5rem;"
      />
    </div>
    <div v-if="isMember && !isGameMaster" class="panel-block is-size-7 has-text-left">
      <div v-if="doneVote">他の人が投票するまでお待ちください。</div>
      <div v-if="!doneVote">
        <p v-if="leftTime > 0" class="is-size-7">ワードについて話して人狼（少数派）を探し、</p>
        <p v-if="leftTime <= 0" class="is-size-7">投票の時間になりました。</p>
        <p style="margin-bottom: 5px;">人狼（少数派）だと思う人に投票してください。（変更不可）</p>
        <p v-if="isMember && !isGameMaster && leftTime > 0" class="is-size-7">議論時間終了後に投票することもできます。</p>
        <button
          v-for="mem in gameMember"
          :key="mem.key"
          class="button is-default is-small has-text-weight-bold"
          :class="mem.color"
          @click="emit('vote', mem.key)"
        >{{ mem.name }}</button>
      </div>
    </div>
    <div
      v-if="isMember && isGameMaster && leftTime <= 0"
      class="panel-block is-size-7 has-text-left"
    >
      <p style="margin-bottom: 5px;">投票の時間になりました。
        <br>全員が投票するまでお待ちください。
      </p>
    </div>
    <div v-if="isOwner || isGameMaster" class="panel-block is-size-7 has-text-left">
      <p style="margin-bottom: 5px;">強制的に投票を打ち切って進行させることもできます。</p>
      <button class="button is-danger is-small" @click="emit('end-vote')">投票を打ち切る</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as consts from '~/stores/consts'
import type { Room, Member, Vote } from '~/stores/types'

interface Props {
  room: Room | null
  members: Member[]
  voteKeys: Vote[]
  user: { uid: string } | null
  leftTime: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  vote: [string]
  'end-vote': []
}>()

// computed
const roomStatus = computed(() => {
  if (props.room == null) {
    return ''
  }
  return props.room.status
})

const isProgress = computed(() => {
  return roomStatus.value === consts.STATUS_PROGRESS
})

const isMember = computed(() => {
  return props.user != null && props.members.some(mem => mem.key === props.user!.uid)
})

const isOwner = computed(() => {
  return (
    props.user != null &&
    props.room != null &&
    props.room.creatorRef === props.user.uid
  )
})

const isGameMaster = computed(() => {
  return (
    props.room != null &&
    props.user != null &&
    props.room.gameMaster != null &&
    props.room.gameMaster.key === props.user.uid
  )
})

const myWord = computed(() => {
  if (!props.room || !props.user) return ''
  if (props.room.villagers.some(vil => vil.key === props.user!.uid)) {
    return props.room.villagersWord
  } else if (isWolfs.value) {
    return props.room.wolfWord
  } else {
    return ''
  }
})

const isWolfs = computed(() => {
  return (
    props.room != null &&
    props.user != null &&
    props.room.wolfs.some(w => w.key === props.user!.uid)
  )
})

const votes = computed(() => {
  if (props.voteKeys == null) {
    return []
  }
  return props.voteKeys.map(v => {
    return {
      from: props.members.find(m => m.key === v.uid),
      to: props.members.find(m => m.key === v.target)
    }
  })
})

const doneVote = computed(() => {
  return votes.value.some(
    v => v.from != null && v.from.key === props.user?.uid
  )
})

const gameMember = computed(() => {
  if (!props.room || !props.room.gameMaster || !props.user) return []
  return props.members.filter(m => {
    return m.key !== props.room!.gameMaster!.key && m.key !== props.user!.uid
  })
})
</script>

<style>
@media screen and (max-width: 767px) {
  .sp-fixed-bottom {
    position: fixed;
    width: 100vw;
    height: 50px;
    background-color: #ffffff;
    bottom: 0px;
    left: 0px;
    padding: 5px;
    margin-bottom: 0px;
    z-index: 100;
    border-top: 1px solid #dbdbdb;
    border-left: 0;
    border-right: 0;
  }

  .sp-fixed-second-bottom {
    position: fixed;
    width: 100vw;
    background-color: #ffffff;
    bottom: 40px;
    left: 0px;
    padding: 5px;
    margin-bottom: 0px;
    z-index: 100;
    border-top: 1px solid #dbdbdb;
    border-left: 0;
    border-right: 0;
  }
}
</style>
