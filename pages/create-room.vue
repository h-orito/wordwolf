<template lang="html">
  <section class="container">
    <div>
      <h1 class="title">対戦部屋を作成</h1>
      <div class="rooms">
        部屋名
        <input
          v-model="roomName"
          type="text">
        パスワード（任意）
        <input
          v-model="password"
          type="password">
        自分の名前
        <input  
          v-model="userName"
          type="text">
        <button
          @click="addRoom">部屋を作成</button>
      </div>
    </div>
  </section>
</template>

<script>
import { ADD_ROOM, ADD_MEMBER } from '../store/action-types'
import firebase from '~/plugins/firebase'
const auth = firebase.auth()
export default {
  data() {
    return {
      roomName: '',
      password: '',
      user: null,
      isLogin: false,
      userName: ''
    }
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
    modifyUserName() {
      auth.currentUser.updateProfile({
        displayName: this.userName
      })
    }
  }
}
</script>

<style lang="css">
</style>
