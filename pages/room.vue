<template>
  <section class="section" style="padding: 1rem 1rem;">
    <div class="container">
      <span v-if="requiredPassword" class="fas fa-key"/>
      <span v-if="isRatingRoom" class="has-text-danger">{{
        room?.roomRating
      }}</span>
      <h1 class="title is-6">{{ room?.name ?? '' }}</h1>
      <div v-if="isPasswordCollect" class="columns is-tablet">
        <!-- left tab -->
        <div
          v-if="room && !room.isComplete"
          class="column is-one-thirds-tablet"
        >
          <RoomMembers
            :room="room"
            :members="members"
            :vote-keys="votes"
            :user="user"
            @kick="confirmToKick"
          />
          <RoomProepi
            :room="room"
            :members="members"
            :user="user"
            :is-login="isLogin"
            :master="master"
            @join-room="joinRoom"
            @leave-room="leaveRoom"
            @ready="ready"
            @cancel-ready="cancelReady"
            @game-start="gameStart"
          />
          <RoomPrepare
            :room="room"
            :members="members"
            :user="user"
            @set-word="setWord"
          />
          <RoomProgress
            :room="room"
            :members="members"
            :vote-keys="votes"
            :user="user"
            :left-time="leftTime"
            @vote="vote"
            @end-vote="endVote"
          />
          <RoomCounter
            :room="room"
            :members="members"
            :user="user"
            @submit-counter-word="submitCounterWord"
          />
          <RoomReset
            :room="room"
            :user="user"
            @submit-room-reset="submitRoomReset"
          />
        </div>
        <!-- end left tab -->
        <!-- right tab -->
        <div
          class="column"
          :class="!room || !room.isComplete ? 'is-two-thirds-tablet' : ''"
        >
          <RoomChat
            :room="room"
            :members="members"
            :user="user"
            :messages="messages"
            :left-time="leftTime"
            @say="say"
            @kick="kick"
          />
        </div>
        <!-- end right tab -->
      </div>
      <div v-if="room?.isComplete">
        <NuxtLink class="button is-primary is-small" to="/room-list"
          >終了した部屋一覧に戻る</NuxtLink
        >
      </div>
      <GoogleAds />
    </div>
    <div id="password-modal" class="modal">
      <div class="modal-background is-cli"/>
      <div class="modal-card" style="width: 95vw; height: 95vh;">
        <header class="modal-card-head">
          <p class="modal-card-title is-size-5">パスワード入力</p>
        </header>
        <section class="modal-card-body is-size-7">
          <div
            v-if="requiredPassword && isRatingRoom"
            class="notification is-warning is-size-7"
            style="margin-top: 1.5rem;"
          >
            {{
              'この部屋は暴力表現' +
                (room?.roomRating === 'R18' ? '、性的表現' : '') +
                'が投稿される可能性があります。'
            }}<br >
          </div>
          <p class="has-text-left">
            この部屋に入室するにはパスワードが必要です。
          </p>
          <div v-if="requiredPassword" class="field">
            <div class="control">
              <input
                v-model="roomPassword"
                class="input is-small"
                :class="
                  !hasRoomPassword
                    ? ''
                    : hasRoomPasswordError
                    ? 'is-danger'
                    : 'is-success'
                "
                type="text"
                placeholder="パスワード"
                @keyup="validateRoomPassword"
              >
            </div>
            <p
              v-if="hasRoomPassword"
              class="help is-danger has-text-left is-size-7"
            >
              {{ roomPasswordError }}
            </p>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-small" style="margin-right: 5px;" @click="backToTop">キャンセル</button>
          <button
            class="button is-success is-small"
            style="right: 0;"
            :disabled="!canView"
            @click="submitPassword"
          >
            送信
          </button>
        </footer>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import bcrypt from 'bcryptjs'
import { onAuthStateChanged, updateProfile } from 'firebase/auth'
import { useAuthStore } from '~/stores/auth'
import { useMasterStore } from '~/stores/master'
import { useMembersStore } from '~/stores/members'
import { useMessagesStore } from '~/stores/messages'
import { useRoomsStore } from '~/stores/rooms'
import type { Member } from '~/stores/types'
import { useVotesStore } from '~/stores/votes'

useHead({
  title: 'ワードウルフオンライン'
})

const route = useRoute()
const router = useRouter()
const auth = useFirebaseAuth()!

const authStore = useAuthStore()
const roomsStore = useRoomsStore()
const membersStore = useMembersStore()
const messagesStore = useMessagesStore()
const votesStore = useVotesStore()
const masterStore = useMasterStore()

// route params
const roomKey = computed(() => route.query.id as string)
const isComplete = computed(() => route.query.complete === 'true')

// data
const leftTime = ref(0)
let timerObj: ReturnType<typeof setInterval> | null = null
const roomPassword = ref('')
const roomPasswordError = ref<string | null>(null)
const isPasswordCollect = ref(false)

// computed from stores
const user = computed(() => authStore.user)
const room = computed(() => roomsStore.room)
const members = computed(() => membersStore.members)
const master = computed(() => masterStore.master)
const votes = computed(() => votesStore.votes)
const messages = computed(() => messagesStore.messages)
const isLogin = computed(() => authStore.isLogin)

const isMember = computed(() => {
  return !!user.value && members.value.some(mem => mem.key === user.value!.uid)
})

const isOwner = computed(() => {
  return !!user.value && !!room.value && room.value.creatorRef === user.value.uid
})

const isGameMaster = computed(() => {
  return (
    !!room.value &&
    !!user.value &&
    room.value.gameMaster?.key === user.value.uid
  )
})

const hasRoomPassword = computed(() => {
  return !!roomPassword.value && roomPassword.value !== ''
})

const hasRoomPasswordError = computed(() => {
  return !!roomPasswordError.value
})

const canView = computed(() => {
  if (!!user.value && user.value.uid === master.value) {
    return true
  }
  validateRoomPassword()
  return hasRoomPassword.value && !hasRoomPasswordError.value && isLogin.value
})

const requiredPassword = computed(() => {
  return (
    !!room.value &&
    room.value.roomPassword != null &&
    room.value.roomPassword !== ''
  )
})

const isRatingRoom = computed(() => {
  return !!room.value && ['R15', 'R18'].some(r => r === room.value!.roomRating)
})

// lifecycle
onMounted(async () => {
  timerObj = setInterval(() => {
    timerCount()
  }, 1000)

  onAuthStateChanged(auth, (firebaseUser) => {
    authStore.loginout(firebaseUser)
  })

  await roomsStore.initRoom(roomKey.value, isComplete.value)
  await masterStore.initMaster()

  if (room.value?.roomPassword != null && room.value.roomPassword !== '') {
    membersStore.resetMembers()
    messagesStore.resetMessages()
    openPasswordModal()
    return
  } else {
    await initMemberAndMessage()
  }
})

onUnmounted(() => {
  if (timerObj) {
    clearInterval(timerObj)
  }
})

// methods
function joinRoom(playerName: string) {
  if (!user.value || isMember.value) return
  join(user.value.uid, playerName, room.value!.key)
}

function leaveRoom() {
  if (!window.confirm('本当に退出しますか？')) return
  if (!user.value || !isMember.value) return
  leave(
    user.value.uid,
    user.value.displayName || '',
    room.value!.key,
    room.value!.creatorRef
  )
}

function confirmToKick({ memberKey, memberName }: { memberKey: string; memberName: string }) {
  if (
    !window.confirm(
      '本当に強制退出させますか？退出させた人はこの部屋に参加できなくなります。'
    )
  ) {
    return
  }
  if (!isOwner.value) {
    return
  }
  kick({ memberKey, memberName })
}

function kick({ memberKey, memberName }: { memberKey: string; memberName: string }) {
  roomsStore.banRoomMember(room.value!.key, memberKey)
  leave(memberKey, memberName, room.value!.key, room.value!.creatorRef)
}

function submitRoomReset() {
  if (
    !window.confirm(
      '進行不可能になった場合のみ使用してください。本当に開始前の状態に戻しますか？'
    )
  ) {
    return
  }
  if (!isOwner.value) {
    return
  }
  roomsStore.resetRoom(room.value!.key, members.value)
}

async function gameStart({ talkMinutes, wolfNum }: { talkMinutes: number; wolfNum: number }) {
  const key = room.value!.key
  await roomsStore.toPrepareRoom(key, members.value, talkMinutes, wolfNum)
  await votesStore.deleteVotes(key)
  await membersStore.deleteReadies(members.value)
}

function setWord({ villagersWord, wolfWord }: { villagersWord: string; wolfWord: string }) {
  roomsStore.toProgressRoom(room.value!.key, villagersWord, wolfWord)
}

function timerCount() {
  if (!room.value || !room.value.endingTime) return
  const endTime = room.value.endingTime.toDate()
  const now = new Date()
  const left = Math.floor((endTime.getTime() - now.getTime()) / 1000)
  leftTime.value = left < 0 ? 0 : left
}

function cancelReady() {
  membersStore.deleteReady(user.value!.uid)
}

function ready() {
  membersStore.addReady(user.value!.uid)
}

async function vote(key: string) {
  await roomsStore.voteRoom(room.value!.key, user.value!.uid, key, members.value)
}

async function endVote() {
  if (!window.confirm('本当に投票を打ち切って進行させますか？')) {
    return
  }
  if (!isOwner.value && !isGameMaster.value) return
  await roomsStore.endVoteRoom(room.value!.key, members.value)
}

function submitCounterWord(counterWord: string) {
  roomsStore.counterRoom(room.value!.key, counterWord)
}

function say({ message }: { message: string }) {
  const member = members.value.find(m => m.key === user.value?.uid)
  const color = member?.color || null
  messagesStore.addMessage(
    room.value!.key,
    user.value?.displayName || '',
    color,
    message,
    user.value?.uid || null
  )
}

function openPasswordModal() {
  const modal = document.querySelector('#password-modal')
  const html = document.querySelector('html')
  modal?.classList.add('is-active')
  html?.classList.add('is-clipped')
}

function backToTop() {
  router.push('/')
}

function validateRoomPassword() {
  if (!requiredPassword.value) return
  if (!bcrypt.compareSync(roomPassword.value, room.value!.roomPassword!)) {
    roomPasswordError.value = '正しくありません'
  } else {
    roomPasswordError.value = null
  }
}

async function submitPassword() {
  validateRoomPassword()
  if (!canView.value) return
  await initMemberAndMessage()
  document.querySelector('#password-modal')?.classList.remove('is-active')
  document.querySelector('html')?.classList.remove('is-clipped')
}

async function initMemberAndMessage() {
  isPasswordCollect.value = true
  await membersStore.initMembers(roomKey.value)
  if (!isComplete.value) {
    await votesStore.initVotes(roomKey.value)
  }
  await messagesStore.initMessages(roomKey.value, isComplete.value)
}

// helper functions
async function join(userId: string, userName: string, key: string) {
  const currentUser = auth.currentUser
  if (!currentUser) return

  await updateProfile(currentUser, { displayName: userName })
  const message = userName + 'さんが参加しました。'

  await membersStore.addMember(userName, userId, key, async (newMembers: Member[]) => {
    await addSystemMessage(key, message)
    const query: {
      roomKey: string
      memberNum: number
      isChangeCreator: boolean
      newCreator?: string
    } = {
      roomKey: key,
      memberNum: newMembers.length,
      isChangeCreator: false
    }
    if (newMembers.length === 1) {
      query.isChangeCreator = true
      query.newCreator = userId
    }
    await roomsStore.changeRoomMember(query.roomKey, query.memberNum, query.isChangeCreator, query.newCreator)
  })
}

async function leave(userId: string, userName: string, key: string, creator: string) {
  const message = userName + 'さんが退出しました。'

  await membersStore.removeMember(userId, async (remainingMembers: Member[]) => {
    await addSystemMessage(key, message)
    const isChangeCreator = creator === userId
    const query: {
      roomKey: string
      memberNum: number
      isChangeCreator: boolean
      newCreator?: string | null
    } = {
      roomKey: key,
      memberNum: remainingMembers.length,
      isChangeCreator: false
    }
    if (isChangeCreator) {
      query.isChangeCreator = true
      query.newCreator = remainingMembers.length > 0 ? remainingMembers[0]!.key : null
    }
    await roomsStore.changeRoomMember(query.roomKey, query.memberNum, query.isChangeCreator, query.newCreator || undefined)
    if (remainingMembers.length <= 0) {
      await roomsStore.completeRoom(key)
    }
  })
}

async function addSystemMessage(key: string, message: string) {
  await messagesStore.addMessage(key, '', null, message, null)
}
</script>

<style>
.color01 {
  color: #cc0000;
}
.color02 {
  color: #0000cc;
}
.color03 {
  color: #007700;
}
.color04 {
  color: #770077;
}
.color05 {
  color: #555500;
}
.color06 {
  color: #770000;
}
.color07 {
  color: #0077cc;
}
.color08 {
  color: #000077;
}
.color09 {
  color: #777777;
}
.color10 {
  color: #00cc77;
}
.panel:not(:last-child) {
  margin-bottom: 0.5rem;
}
.panel-block {
  display: block;
}
.column {
  padding-top: 0;
  padding-bottom: 0;
  margin-bottom: 0.5rem;
}
</style>
