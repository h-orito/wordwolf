<template>
  <div id="room-member" class="panel">
    <p class="panel-heading is-size-7 has-text-left">参加者</p>
    <div
      v-if="members == null || members.length === 0"
      class="panel-block is-size-7 has-text-left"
    >
      参加者がいません
    </div>
    <div
      v-for="member in members"
      :key="member.key"
      class="panel-block is-size-7 has-text-left"
      style="height: 36px;"
    >
      <span
        class="membername"
        :class="(isMe(member) ? 'has-text-weight-bold' : '') + ' ' + safeColor(member.color)"
      >{{ member.name }}</span>
      <span v-if="member.winNum != null" :class="safeColor(member.color)">
        {{ `（${member.winNum}勝）` }}
      </span>
      <button
        v-if="canKick"
        class="tag is-small is-pulled-right"
        :class="isCreator(member) ? 'is-default' : 'is-danger'"
        style="cursor: pointer;"
        :disabled="isCreator(member)"
        @click="emit('kick', { memberKey: member.key, memberName: member.name })"
      >
        ×
      </button>
      <span
        v-if="isGameMaster(member)"
        class="tag reverse-success is-pulled-right"
      >GM</span>
      <span
        v-if="allowOpenSkill && isVillagers(member)"
        class="tag reverse-info is-pulled-right"
      >村人</span>
      <span
        v-if="allowOpenSkill && isWolfs(member)"
        class="tag reverse-danger is-pulled-right"
      >人狼</span>
      <span
        v-if="displayDoneVote(member)"
        class="tag reverse-info is-pulled-right"
      >投票済</span>
      <span
        v-if="displayDoneReady(member)"
        class="tag reverse-info is-pulled-right"
      >準備完了</span>
      <span
        v-if="isNotProgress && isCreator(member)"
        class="tag reverse-success is-pulled-right"
      >部屋主</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as consts from '~/stores/consts'
import { safeColor } from '~/stores/members'
import type { Room, Member, Vote } from '~/stores/types'

interface Props {
  room: Room | null
  members: Member[]
  voteKeys: Vote[]
  user: { uid: string } | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  kick: [{ memberKey: string; memberName: string }]
}>()

const roomStatus = computed(() => {
  if (props.room == null) {
    return ''
  }
  return props.room.status
})

const isNotProgress = computed(() => {
  return (
    props.room != null &&
    (roomStatus.value === consts.STATUS_PROLOGUE ||
      roomStatus.value === consts.STATUS_EPILOGUE)
  )
})

const allowOpenSkill = computed(() => {
  return (
    props.room != null &&
    (roomStatus.value === consts.STATUS_EPILOGUE ||
      roomStatus.value === consts.STATUS_COUNTER)
  )
})

const canKick = computed(() => {
  return (
    props.room != null &&
    props.user != null &&
    (roomStatus.value === consts.STATUS_EPILOGUE ||
      roomStatus.value === consts.STATUS_PROLOGUE) &&
    props.room.creatorRef === props.user.uid
  )
})

function isMe(member: Member): boolean {
  return props.user != null && props.user.uid === member.key
}

function isCreator(member: Member): boolean {
  return props.room != null && member.key === props.room.creatorRef
}

function isGameMaster(member: Member): boolean {
  return (
    props.room != null &&
    props.room.gameMaster != null &&
    member.key === props.room.gameMaster.key
  )
}

function isVillagers(member: Member): boolean {
  return props.room != null && props.room.villagers.some(v => v.key === member.key)
}

function isWolfs(member: Member): boolean {
  return props.room != null && props.room.wolfs.some(w => w.key === member.key)
}

function doneVote(member: Member): boolean {
  return props.voteKeys.some(v => v.uid === member.key)
}

function displayDoneVote(member: Member): boolean {
  return (
    doneVote(member) &&
    props.room != null &&
    roomStatus.value !== consts.STATUS_EPILOGUE
  )
}

function displayDoneReady(member: Member): boolean {
  return (
    props.room != null &&
    (roomStatus.value === consts.STATUS_EPILOGUE ||
      roomStatus.value === consts.STATUS_PROLOGUE) &&
    member.ready
  )
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
