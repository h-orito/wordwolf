<template>
  <div v-if="isNotProgress" class="panel">
    <p class="is-size-7 has-text-left panel-heading">ゲーム開始前</p>
    <div v-if="roomStatus === 'epilogue'" class="panel-block">
      <p class="is-size-7 has-text-left">
        <span class="has-text-weight-bold is-size-6">{{
          room?.winCamp === 'wolfs' ? '人狼' : '村人'
        }}</span>
        の勝利です。 <br >村人のワードは
        <span class="has-text-weight-bold is-size-6">{{
          room?.villagersWord
        }}</span>
        でした。 <br >人狼のワードは
        <span class="has-text-weight-bold is-size-6">{{ room?.wolfWord }}</span>
        でした。
      </p>
    </div>
    <div class="panel-block">
      <p
        v-if="!isOwner"
        class="is-size-7 has-text-left"
        style="margin-bottom: 10px;"
      >
        現在ゲーム開始前です。
        <br >4人以上集まり、全員が準備完了すればルームオーナーがゲームを開始することができます。
      </p>
      <div v-if="!isOwner && isMember" class="has-text-left is-size-7">
        <div class="field">
          <div class="control">
            <button
              v-if="canReady"
              class="button is-primary is-small"
              @click="ready"
            >
              準備完了状態にする
            </button>
            <button
              v-if="canCancelReady"
              class="button is-default is-small"
              @click="cancelReady"
            >
              準備中に戻す
            </button>
          </div>
        </div>
      </div>
      <div v-if="isOwner" class="has-text-left is-size-7">
        <p style="margin-bottom: 10px;">
          あなたはルームオーナーです。
          <br >4人以上集まり、ルームオーナー以外の全員が準備完了すればゲームを開始することができます。
        </p>
        <div class="field">
          <label class="label is-size-7 has-text-left">議論時間（分）</label>
          <div class="control">
            <input
              v-model="talkMinutes"
              class="input is-small"
              type="number"
              min="1"
              max="10"
              step="1"
            >
          </div>
        </div>
        <div class="field">
          <label class="label is-size-7 has-text-left">人狼の人数</label>
          <div class="control">
            <input
              v-model="wolfNum"
              class="input is-small"
              type="number"
              min="1"
              max="3"
              step="1"
            >
          </div>
        </div>
        <div class="field">
          <div class="control">
            <button
              class="button is-primary is-small"
              :disabled="!canGameStart"
              @click="gameStart"
            >
              ゲームを開始する
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="!canJoin && !isLogin" class="panel-block">
      <p class="has-text-left is-size-7">
        参加するにはログインが必要です。トップページよりログインしてください。
      </p>
    </div>
    <div v-if="!canJoin && notVerified" class="panel-block">
      <p class="has-text-left is-size-7">
        参加するにはメール認証が必要です。メールをご確認ください。
        <br >送信されていない場合は「ユーザ情報編集」から再送してください。
      </p>
    </div>
    <div v-if="canJoin" class="panel-block">
      <div class="field">
        <label class="label is-size-7 has-text-left">自分のニックネーム</label>
        <div class="control">
          <input
            v-model="playerName"
            class="input is-small"
            type="text"
            placeholder="ニックネーム"
            :class="
              !hasPlayerName
                ? ''
                : hasPlayerNameError
                ? 'is-danger'
                : 'is-success'
            "
            @keyup="validatePlayerName"
          >
        </div>
        <p v-if="hasPlayerName" class="help is-danger is-size-7 has-text-left">
          {{ playerNameError }}
        </p>
      </div>
      <div class="field">
        <div class="control">
          <button
            class="button is-primary is-small"
            :disabled="!canJoinSubmit"
            @click="joinRoom"
          >
            参加する{{ waitCount > 0 ? `（残${waitCount}秒）` : '' }}
          </button>
        </div>
      </div>
    </div>
    <div v-if="canLeave" class="panel-block">
      <div class="has-text-left">
        <button
          class="button is-danger is-small"
          :disabled="waitCount > 0"
          @click="leaveRoom"
        >
          退出する{{ waitCount > 0 ? `（残${waitCount}秒）` : '' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as consts from '~/stores/consts'
import type { Room, Member } from '~/stores/types'
import { useMasterStore } from '~/stores/master'

interface Props {
  room: Room | null
  members: Member[]
  user: { uid: string; email: string | null; emailVerified: boolean } | null
  isLogin: boolean
  master: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  joinRoom: [string]
  leaveRoom: []
  ready: []
  cancelReady: []
  gameStart: [{ talkMinutes: number; wolfNum: number }]
}>()

const masterStore = useMasterStore()

// data
const playerName = ref('')
const playerNameError = ref<string | null>(null)
const talkMinutes = ref(3)
const wolfNum = ref(1)
const waitCount = ref(30)
let timer: ReturnType<typeof setInterval> | null = null

// computed
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

const isOwner = computed(() => {
  return (
    props.user != null &&
    props.room != null &&
    props.room.creatorRef === props.user.uid
  )
})

const isMember = computed(() => {
  return props.user != null && props.members.some(mem => mem.key === props.user!.uid)
})

const notVerified = computed(() => {
  return (
    props.isLogin &&
    !isMember.value &&
    props.user?.email &&
    !props.user.emailVerified &&
    isNotProgress.value &&
    props.room != null &&
    (props.room.ban == null ||
      !props.room.ban.some(target => target === props.user!.uid))
  )
})

const isGlobalBaned = computed(() => {
  const bans = masterStore.bans
  const clientToken = typeof localStorage !== 'undefined' ? localStorage.getItem('client-token') : null
  return bans.some(b => b === clientToken)
})

const canJoin = computed(() => {
  return (
    props.isLogin &&
    !isMember.value &&
    (!props.user?.email || props.user.emailVerified) &&
    isNotProgress.value &&
    props.room != null &&
    !isGlobalBaned.value &&
    (props.room.ban == null ||
      !props.room.ban.some(target => target === props.user!.uid))
  )
})

const canLeave = computed(() => {
  return props.isLogin && isMember.value && isNotProgress.value
})

const hasPlayerName = computed(() => {
  return playerName.value != null && playerName.value !== ''
})

const hasPlayerNameError = computed(() => {
  return playerNameError.value != null
})

const canJoinSubmit = computed(() => {
  validatePlayerName()
  return (
    hasPlayerName.value &&
    !hasPlayerNameError.value &&
    props.isLogin &&
    waitCount.value <= 0
  )
})

const canReady = computed(() => {
  if (!isMember.value || !props.user) return false
  const member = props.members.find(m => m.key === props.user!.uid)
  return member && !member.ready
})

const canCancelReady = computed(() => {
  if (!isMember.value || !props.user) return false
  const member = props.members.find(m => m.key === props.user!.uid)
  return member && member.ready
})

const canGameStart = computed(() => {
  return (
    props.members.length >= 4 &&
    isNotProgress.value &&
    isOwner.value &&
    props.room != null &&
    props.members
      .filter(m => m.key !== props.room!.creatorRef)
      .every(m => m.ready)
  )
})

// lifecycle
onMounted(() => {
  timer = setInterval(() => {
    if (props.room == null) {
      return
    }
    countDown()
  }, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

// methods
function validatePlayerName() {
  if (!validPlayerName(playerName.value)) {
    playerNameError.value = '3文字以上10文字以内で入力してください'
  } else if (
    playerName.value.trim() === 'ort' &&
    props.user?.uid !== props.master
  ) {
    playerNameError.value = 'その名前は使用できません'
  } else {
    playerNameError.value = null
  }
}

function validPlayerName(name: string): boolean {
  if (name.trim().length < 1 || name.length > 10) {
    return false
  }
  return true
}

function joinRoom() {
  validatePlayerName()
  if (!canJoinSubmit.value) {
    return
  }
  emit('joinRoom', playerName.value.trim())
  waitCount.value = 30
}

function leaveRoom() {
  if (!canLeave.value) {
    return
  }
  emit('leaveRoom')
}

function ready() {
  if (!canReady.value) {
    return
  }
  emit('ready')
}

function cancelReady() {
  if (!canCancelReady.value) {
    return
  }
  emit('cancelReady')
}

function gameStart() {
  if (!canGameStart.value) {
    return
  }
  emit('gameStart', {
    talkMinutes: Math.floor(talkMinutes.value),
    wolfNum: wolfNum.value
  })
}

function countDown() {
  if (waitCount.value > 0) {
    waitCount.value--
  }
}
</script>

<style></style>
