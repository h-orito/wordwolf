<template lang="html">
    <section class="section">
    <div class="container">
      <h1 class="title is-5">部屋を作成</h1>
      <div class="columns">
        <div class="column">
          <div class="field">
            <label class="label">部屋名</label>
            <div class="control has-icons-left has-icons-right">
              <input class="input" :class="!hasRoomName ? '' : hasRoomNameError ? 'is-danger': 'is-success'"
                type="text" placeholder="部屋名" v-model="roomName" @keyup="validateRoomName">
              <span class="icon is-small is-left">
                  <i class="fas fa-comments"></i>
              </span>
              <span v-if="hasRoomName" class="icon is-small is-right">
                <i v-if="hasRoomNameError" class="fas fa-exclamation-triangle"></i>
                <i v-if="!hasRoomNameError" class="fas fa-check"></i>
              </span>
            </div>
            <p class="help is-danger">{{this.roomNameError}}</p>
          </div>
          <div class="field">
            <label class="label">部屋パスワード（任意）</label>
            <div class="control has-icons-left has-icons-right">
              <input class="input" :class="!hasRoomPassword ? '' : hasRoomPasswordError ? 'is-danger': 'is-success'"
                type="text" placeholder="パスワード" v-model="roomPassword" @keyup="validateRoomPassword">
              <span class="icon is-small is-left">
                <i class="fas fa-key"></i>
              </span>
              <span v-if="hasRoomPassword" class="icon is-small is-right">
                <i v-if="hasRoomPasswordError" class="fas fa-exclamation-triangle"></i>
                <i v-if="!hasRoomPasswordError" class="fas fa-check"></i>
              </span>
            </div>
            <p class="help is-danger">{{this.roomPasswordError}}</p>
          </div>
          <div class="field">
            <label class="label">自分のニックネーム</label>
            <div class="control has-icons-left has-icons-right">
              <input class="input" :class="!hasPlayerName ? '' : hasPlayerNameError ? 'is-danger': 'is-success'"
                type="text" placeholder="ニックネーム" v-model="playerName" @keyup="validatePlayerName">
              <span class="icon is-small is-left">
                  <i class="fas fa-user-circle"></i>
              </span>
              <span v-if="hasPlayerName" class="icon is-small is-right">
                <i v-if="hasPlayerNameError" class="fas fa-exclamation-triangle"></i>
                <i v-if="!hasPlayerNameError" class="fas fa-check"></i>
              </span>
            </div>
            <p class="help is-danger">{{this.playerNameError}}</p>
          </div>
          <div class="field">
            <div class="control has-text-centered">
              <button class="button is-primary" :disabled="!canSubmit" @click="createRoom">部屋を作成</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { ADD_ROOM, ADD_MEMBER, ADD_MESSAGE } from '../store/action-types'
import firebase from '~/plugins/firebase'
const auth = firebase.auth()
export default {
  data() {
    return {
      roomName: null,
      roomNameError: null,
      roomPassword: null,
      roomPasswordError: null,
      playerName: null,
      playerNameError: null
    }
  },
  computed: {
    hasRoomName() {
      return this.roomName != null && this.roomName !== ''
    },
    hasRoomNameError() {
      return this.roomNameError != null
    },
    hasRoomPassword() {
      return this.roomPassword != null && this.roomPassword !== ''
    },
    hasRoomPasswordError() {
      return this.roomPasswordError != null
    },
    hasPlayerName() {
      return this.playerName != null && this.playerName !== ''
    },
    hasPlayerNameError() {
      return this.playerNameError != null
    },
    user() {
      return this.$store.getters.getUser
    },
    isLogin() {
      return this.$store.getters.isLogin
    },
    canSubmit() {
      return (
        this.hasRoomName &&
        this.hasPlayerName &&
        !this.hasRoomNameError &&
        !this.hasPasswordError &&
        !this.hasPlayerNameError &&
        this.isLogin
      )
    }
  },
  methods: {
    validateRoomName() {
      if (this.roomName == null || this.roomName === '') {
        return
      }
      if (!this.validRoomName(this.roomName)) {
        this.roomNameError = '4文字以上20文字以内で入力してください'
      } else {
        this.roomNameError = null
      }
    },
    validRoomName(roomName) {
      if (roomName.length < 4 || roomName.length > 20) {
        return false
      }
      return true
    },
    validateRoomPassword() {
      if (this.roomPassword == null || this.roomPassword === '') {
        return
      }
      if (!this.validPassword(this.roomPassword)) {
        this.roomPasswordError = '10文字以内で入力してください'
      } else {
        this.roomPasswordError = null
      }
    },
    validPassword(password) {
      if (password.length > 10) {
        return false
      }
      return true
    },
    validatePlayerName() {
      if (this.playerName == null || this.playerName === '') {
        return
      }
      if (!this.validPlayerName(this.playerName)) {
        this.playerNameError = '3文字以上10文字以内で入力してください'
      } else {
        this.playerNameError = null
      }
    },
    validPlayerName(playerName) {
      if (playerName.length < 3 || playerName.length > 10) {
        return false
      }
      return true
    },
    createRoom() {
      createRoomAndJoin(
        this.roomName,
        this.roomPassword,
        this.user.uid,
        this.playerName,
        this.$store
      )
    }
  }
}

const createRoomAndJoin = function(
  roomName,
  roomPassword,
  userId,
  userName,
  store
) {
  auth.currentUser
    .updateProfile({
      displayName: userName
    })
    .then(function() {
      store.dispatch(ADD_ROOM, {
        roomName: roomName,
        roomPassword: roomPassword,
        userId: userId,
        callback: key => joinRoom(userId, userName, key, store)
      })
    })
}

const joinRoom = function(userId, userName, roomKey, store) {
  store.dispatch(ADD_MEMBER, {
    userName: userName,
    userId: userId,
    roomKey: roomKey,
    callback: () => addMessage(roomKey, userName, store)
  })
}

const addMessage = function(roomKey, userName, store) {
  store.dispatch(ADD_MESSAGE, {
    roomKey: roomKey,
    name: '',
    message: userName + 'さんが入室しました',
    color: null,
    callback: () => {
      location.href = '/room?id=' + roomKey
    }
  })
}
</script>

<style lang="css">
</style>
