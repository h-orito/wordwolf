<template lang="html">
    <section class="section">
    <div class="container">
      <h1 class="title is-5">部屋を作成</h1>
      <div class="columns">
        <div class="column">
          <div class="notification is-size-7">
            <ul class="has-text-left" style="list-style: inside;">
              <li>部屋パスワードなしの部屋を作成するとTwitter<a href="https://twitter.com/ort_dev" target="_blank">@ort_dev</a>にて通知されます。</li>
              <li>R15、R18の話題を取り扱う場合は必ず部屋パスワードとレーティングを設定してください。</li>
              <li>管理人はパスワードを設定しているものも含め全ての部屋を閲覧できます。</li>
            </ul>
          </div>
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
            <p class="help is-danger" v-if="hasRoomName">{{this.roomNameError}}</p>
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
            <p class="help is-danger" v-if="hasPlayerName">{{this.playerNameError}}</p>
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
            <p class="help is-danger" v-if="hasRoomPassword">{{this.roomPasswordError}}</p>
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
            <p class="help is-danger" v-if="hasRoomPassword">{{this.roomPasswordError}}</p>
          </div>
          <div class="field" style="margin-top: 40px;">
            <div class="control has-text-centered">
              <button class="button is-primary" :disabled="!canSubmit || submitting" @click="createRoom">部屋を作成</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import {
  ADD_ROOM,
  ADD_MEMBER,
  ADD_MESSAGE,
  INIT_MASTER,
  LOGINOUT
} from '../store/action-types'
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
      playerNameError: null,
      roomRating: '',
      submitting: false
    }
  },
  computed: {
    master() {
      return this.$store.getters.getMaster
    },
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
        this.validRoomRating &&
        this.isLogin
      )
    }
  },
  created() {
    this.$store.dispatch(INIT_MASTER)
    firebase.auth().onAuthStateChanged(user => {
      this.$store.dispatch(LOGINOUT, {
        user: user
      })
    })
  },
  methods: {
    validateRoomName() {
      if (!this.validRoomName(this.roomName)) {
        this.roomNameError = '4文字以上20文字以内で入力してください'
      } else {
        this.roomNameError = null
      }
    },
    validRoomName(roomName) {
      if (
        roomName == null ||
        roomName.trim().length < 4 ||
        roomName.length > 20
      ) {
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
      if (!this.validPlayerName(this.playerName)) {
        this.playerNameError = '3文字以上10文字以内で入力してください'
      } else if (
        this.playerName.trim() === 'ort' &&
        this.user.uid !== this.master
      ) {
        this.playerNameError = 'その名前は使用できません'
      } else {
        this.playerNameError = null
      }
    },
    validPlayerName(playerName) {
      if (
        playerName == null ||
        playerName.trim().length < 1 ||
        playerName.length > 10
      ) {
        return false
      }
      return true
    },
    validRoomRating(rating) {
      return rating === '' || rating === 'R15' || rating === 'R18'
    },
    createRoom() {
      this.validateRoomName()
      this.validateRoomPassword()
      this.validatePlayerName()
      if (!this.canSubmit) {
        return
      }
      this.submitting = true
      createRoomAndJoin(
        this.roomName.trim(),
        this.roomPassword,
        this.hasRoomPassword ? this.roomRating : '',
        this.user.uid,
        this.playerName.trim(),
        this.$store
      )
    }
  }
}

const createRoomAndJoin = function(
  roomName,
  roomPassword,
  roomRating,
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
        roomRating: roomRating,
        userId: userId,
        userName: userName,
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
    memberKey: null,
    color: null,
    callback: () => {
      location.href = '/room?id=' + roomKey
    }
  })
}
</script>

<style lang="css">
</style>
