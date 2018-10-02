<template lang="html">
  <section class="container">
    <div>
      <h1 class="title">Nuxtapp</h1>
      <div class="rooms">
        <ul>
          <li 
            v-for="room in rooms" 
            :key="room['key']">
            {{ room['name'] }}
            <button
              v-if="isCreator(room['creatorRef'])"
              @click="removeRoom(room['key'])">X</button>
          </li>
        </ul>
      </div>
      <nuxt-link
        v-if="isLogin" 
        to="/create-room">部屋を作成</nuxt-link>
    </div>
    <div id="google-login">
      <input
        v-if="isLogin" 
        v-model="userName"
        type="text"
        @keyup.enter="modifyUserName">
      <span v-if="user != null">{{ user.displayName }}</span>
      <button
        v-if="!isLogin" 
        @click="googleLogin">Googleアカウントでログイン</button>
      <button
        v-if="isLogin" 
        @click="googleLogout">ログアウト</button>
    </div>

  </section>
</template>

<script>
import {
  INIT_ROOM,
  ADD_ROOM,
  REMOVE_ROOM,
  ADD_MEMBER
} from '../store/action-types'
import firebase from '~/plugins/firebase'
const auth = firebase.auth()
export default {
  data() {
    return {
      roomName: '',
      user: null,
      isLogin: false,
      userName: ''
    }
  },
  computed: {
    rooms() {
      return this.$store.getters.getRooms
    }
  },
  async fetch({ store }) {
    return await store.dispatch(INIT_ROOM)
  },
  created: function() {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.isLogin = true
        this.user = user
        this.userName = user.displayName
      } else {
        this.isLogin = false
        this.user = null
        this.userName = ''
      }
    })
  },
  methods: {
    addRoom() {
      this.$store.dispatch(ADD_MEMBER, {
        userName: this.userName,
        userId: this.user.uid
      })
      this.$store.dispatch(ADD_ROOM, {
        roomName: this.roomName,
        userId: this.user.uid
      })
      this.roomName = ''
    },
    removeRoom(key) {
      this.$store.dispatch(REMOVE_ROOM, key)
    },
    googleLogin() {
      auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider())
    },
    googleLogout() {
      auth.signOut()
    },
    modifyUserName() {
      auth.currentUser.updateProfile({
        displayName: this.userName
      })
    },
    isCreator(roomCreator) {
      return this.user != null && this.user.uid === roomCreator
    }
  }
}
</script>

<style lang="css">
</style>
