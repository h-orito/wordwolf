<template>
  <section class="section">
    <div class="container">
      <h1 class="title is-5">部屋を作成</h1>
      <div class="columns">
        <div class="column">
          <div class="notification is-size-7">
            <ul class="has-text-left" style="list-style: inside;">
              <li>
                R15、R18の話題を取り扱う場合は必ず部屋パスワードとレーティングを設定してください。
              </li>
              <li>
                管理人はパスワードを設定しているものも含め全ての部屋を閲覧できます。
              </li>
            </ul>
          </div>
          <div class="field">
            <label class="label">部屋名</label>
            <div class="control has-icons-left has-icons-right">
              <input
                v-model="roomName"
                class="input"
                :class="
                  !hasRoomName
                    ? ''
                    : hasRoomNameError
                    ? 'is-danger'
                    : 'is-success'
                "
                type="text"
                placeholder="部屋名"
                @keyup="validateRoomName"
              >
              <span class="icon is-small is-left">
                <i class="fas fa-comments"/>
              </span>
              <span v-if="hasRoomName" class="icon is-small is-right">
                <i
                  v-if="hasRoomNameError"
                  class="fas fa-exclamation-triangle"
                />
                <i v-if="!hasRoomNameError" class="fas fa-check"/>
              </span>
            </div>
            <p v-if="hasRoomName" class="help is-danger">
              {{ roomNameError }}
            </p>
          </div>
          <div class="field">
            <label class="label">自分のニックネーム</label>
            <div class="control has-icons-left has-icons-right">
              <input
                v-model="playerName"
                class="input"
                :class="
                  !hasPlayerName
                    ? ''
                    : hasPlayerNameError
                    ? 'is-danger'
                    : 'is-success'
                "
                type="text"
                placeholder="ニックネーム"
                @keyup="validatePlayerName"
              >
              <span class="icon is-small is-left">
                <i class="fas fa-user-circle"/>
              </span>
              <span v-if="hasPlayerName" class="icon is-small is-right">
                <i
                  v-if="hasPlayerNameError"
                  class="fas fa-exclamation-triangle"
                />
                <i v-if="!hasPlayerNameError" class="fas fa-check"/>
              </span>
            </div>
            <p v-if="hasPlayerName" class="help is-danger">
              {{ playerNameError }}
            </p>
          </div>
          <div class="field">
            <label class="label">部屋パスワード（任意）</label>
            <div class="control has-icons-left has-icons-right">
              <input
                v-model="roomPassword"
                class="input"
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
              <span class="icon is-small is-left">
                <i class="fas fa-key"/>
              </span>
              <span v-if="hasRoomPassword" class="icon is-small is-right">
                <i
                  v-if="hasRoomPasswordError"
                  class="fas fa-exclamation-triangle"
                />
                <i v-if="!hasRoomPasswordError" class="fas fa-check"/>
              </span>
            </div>
            <p v-if="hasRoomPassword" class="help is-danger">
              {{ roomPasswordError }}
            </p>
          </div>
          <div class="field">
            <label class="label">レーティング</label>
            <div class="control has-text-centered">
              <div class="select">
                <select v-model="roomRating" :disabled="!hasRoomPassword">
                  <option value="">全年齢</option>
                  <option value="R15">R15</option>
                  <option value="R18">R18</option>
                </select>
              </div>
            </div>
          </div>
          <div class="field" style="margin-top: 40px;">
            <div class="control has-text-centered">
              <button
                class="button is-primary"
                :disabled="!canSubmit || submitting"
                @click="createRoom"
              >
                部屋を作成
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import bcrypt from 'bcryptjs'
import { updateProfile, onAuthStateChanged } from 'firebase/auth'
import { useAuthStore } from '~/stores/auth'
import { useMasterStore } from '~/stores/master'
import { useRoomsStore } from '~/stores/rooms'
import { useMembersStore } from '~/stores/members'
import { useMessagesStore } from '~/stores/messages'

useHead({
  title: '部屋を作成'
})

const auth = useFirebaseAuth()!
const authStore = useAuthStore()
const masterStore = useMasterStore()
const roomsStore = useRoomsStore()
const membersStore = useMembersStore()
const messagesStore = useMessagesStore()

// data
const roomName = ref<string | null>(null)
const roomNameError = ref<string | null>(null)
const roomPassword = ref<string | null>(null)
const roomPasswordError = ref<string | null>(null)
const playerName = ref<string | null>(null)
const playerNameError = ref<string | null>(null)
const roomRating = ref('')
const submitting = ref(false)

// computed
const master = computed(() => masterStore.master)
const user = computed(() => authStore.user)
const isLogin = computed(() => authStore.isLogin)
const bans = computed(() => masterStore.bans)

const hasRoomName = computed(() => roomName.value != null && roomName.value !== '')
const hasRoomNameError = computed(() => roomNameError.value != null)
const hasRoomPassword = computed(() => roomPassword.value != null && roomPassword.value !== '')
const hasRoomPasswordError = computed(() => roomPasswordError.value != null)
const hasPlayerName = computed(() => playerName.value != null && playerName.value !== '')
const hasPlayerNameError = computed(() => playerNameError.value != null)

const isGlobalBaned = computed(() => {
  // client-token の代わりに localStorage を使用
  const clientToken = typeof window !== 'undefined' ? localStorage.getItem('client-token') : null
  return bans.value.some(b => b === clientToken)
})

const canSubmit = computed(() => {
  return (
    hasRoomName.value &&
    hasPlayerName.value &&
    !hasRoomNameError.value &&
    !hasRoomPasswordError.value &&
    !hasPlayerNameError.value &&
    validRoomRating(roomRating.value) &&
    isLogin.value &&
    !isGlobalBaned.value
  )
})

// init master
await masterStore.initMaster()

// watch auth state
onMounted(() => {
  onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      authStore.login(firebaseUser)
    } else {
      authStore.logout()
    }
  })
})

// methods
function validateRoomName() {
  if (!validRoomName(roomName.value)) {
    roomNameError.value = '4文字以上20文字以内で入力してください'
  } else {
    roomNameError.value = null
  }
}

function validRoomName(name: string | null): boolean {
  if (name == null || name.trim().length < 4 || name.length > 20) {
    return false
  }
  return true
}

function validateRoomPassword() {
  if (roomPassword.value == null || roomPassword.value === '') {
    return
  }
  if (!validPassword(roomPassword.value)) {
    roomPasswordError.value = '10文字以内で入力してください'
  } else {
    roomPasswordError.value = null
  }
}

function validPassword(password: string): boolean {
  if (password.length > 10) {
    return false
  }
  return true
}

function validatePlayerName() {
  if (!validPlayerName(playerName.value)) {
    playerNameError.value = '3文字以上10文字以内で入力してください'
  } else if (
    playerName.value?.trim() === 'ort' &&
    user.value?.uid !== master.value
  ) {
    playerNameError.value = 'その名前は使用できません'
  } else {
    playerNameError.value = null
  }
}

function validPlayerName(name: string | null): boolean {
  if (name == null || name.trim().length < 1 || name.length > 10) {
    return false
  }
  return true
}

function validRoomRating(rating: string): boolean {
  return rating === '' || rating === 'R15' || rating === 'R18'
}

function hashed(str: string | null): string {
  if (!str || str === '') return str || ''
  return bcrypt.hashSync(str, 10)
}

async function createRoom() {
  validateRoomName()
  validateRoomPassword()
  validatePlayerName()
  if (!canSubmit.value) {
    return
  }
  submitting.value = true

  const currentUser = auth.currentUser
  if (!currentUser || !user.value || !roomName.value || !playerName.value) return

  const trimmedRoomName = roomName.value.trim()
  const trimmedPlayerName = playerName.value.trim()
  const finalRating = hasRoomPassword.value ? roomRating.value : ''

  try {
    // Update profile
    await updateProfile(currentUser, { displayName: trimmedPlayerName })

    // Create room
    const roomKey = await roomsStore.addRoom(
      trimmedRoomName,
      user.value.uid,
      trimmedPlayerName,
      hashed(roomPassword.value),
      finalRating
    )

    // Join room
    await membersStore.addMember(
      trimmedPlayerName,
      user.value.uid,
      roomKey
    )

    // Add message
    await messagesStore.addMessage(
      roomKey,
      '',
      null,
      trimmedPlayerName + 'さんが入室しました',
      null
    )

    // Navigate to room
    navigateTo('/room?id=' + roomKey)
  } catch (error) {
    console.error('Failed to create room:', error)
    submitting.value = false
  }
}
</script>

<style lang="css"></style>
