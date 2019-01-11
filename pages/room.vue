<template lang="html">
  <section
    class="section" style="padding: 1rem 1rem;">
    <div class="container">
      <h1 class="title is-6">{{ room != null ? room.name : '' }}</h1>
      <div class="columns is-tablet">
        <!-- left tab -->
        <div class="column is-one-thirds-tablet" v-if="this.room != null && !this.room.isComplete">
          <Members :room="room" :members="members" :user="user" @kick="kick"></Members>
          <Proepi :room="room" :members="members" :user="user" :isLogin="isLogin"
            @joinRoom="joinRoom" @leaveRoom="leaveRoom" @gameStart="gameStart"></Proepi>
          <Prepare :room="room" :members="members" :user="user" @setWord="setWord"></Prepare>
          <Progress :room="room" :members="members" :user="user" :leftTime="leftTime" @vote="vote"></Progress>
          <Counter :room="room" :members="members" :user="user" @submitCounterWord="submitCounterWord"></Counter>
        </div>
        <!-- end left tab -->
        <!-- right tab -->
        <div class="column" :class="this.room == null || !this.room.isComplete ? 'is-two-thirds-tablet' : ''">
          <Chat :room="room" :members="members" :user="user" :messages="messages" :leftTime="leftTime" @say="say"></Chat>
        </div>
        <!-- end right tab -->
      </div>
      <div v-if="this.room != null && this.room.isComplete">
        <nuxt-link
          class="button is-primary is-small"
          to="/room-list">終了した部屋一覧に戻る</nuxt-link>
      </div>
      <!-- <Footer/> -->
    </div>
  </section>
</template>

<script>
import {
  LOGINOUT,
  INIT_ROOM,
  INIT_MEMBER,
  INIT_MESSAGE,
  ADD_MEMBER,
  REMOVE_MEMBER,
  ADD_MESSAGE,
  TO_PREPARE_ROOM,
  TO_PROGRESS_ROOM,
  VOTE_ROOM,
  COUNTER_ROOM,
  CHANGE_ROOM_MEMBER
} from '../store/action-types'
import firebase from '~/plugins/firebase'
import Members from '~/components/room/Members'
import Proepi from '~/components/room/Proepi'
import Prepare from '~/components/room/Prepare'
import Progress from '~/components/room/Progress'
import Counter from '~/components/room/Counter'
import Chat from '~/components/room/Chat'
import Footer from '~/components/Footer'
const auth = firebase.auth()
export default {
  head() {
    return { title: 'ワードウルフオンライン', titleTemplate: '' }
  },
  components: {
    Members,
    Proepi,
    Prepare,
    Progress,
    Counter,
    Chat,
    Footer
  },
  data() {
    return {
      leftTime: 0,
      timerObj: null
    }
  },
  computed: {
    user() {
      return this.$store.getters.getUser
    },
    room() {
      return this.$store.getters.getRoom
    },
    members() {
      return this.$store.getters.getMembers
    },
    isLogin() {
      return this.$store.getters.isLogin
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
    messages() {
      return this.$store.getters.getMessages
    }
  },
  async fetch({ store, query }) {
    const fetchQuery = {
      roomKey: query.id,
      isComplete: query.complete === 'true'
    }
    await store.dispatch(INIT_ROOM, fetchQuery)
    await store.dispatch(INIT_MEMBER, fetchQuery)
    return await store.dispatch(INIT_MESSAGE, fetchQuery)
  },
  created() {
    const self = this
    this.timerObj = setInterval(function() {
      self.timerCount()
    }, 1000)
    firebase.auth().onAuthStateChanged(user => {
      this.$store.dispatch(LOGINOUT, {
        user: user
      })
    })
  },
  methods: {
    joinRoom: function(playerName) {
      if (this.user == null || this.isMember) {
        return // 何もしない
      }
      join(this.user.uid, playerName, this.room.key, this.$store)
    },
    leaveRoom: function() {
      if (!window.confirm('本当に退出しますか？')) {
        return
      }
      if (this.user == null || !this.isMember) {
        return // 何もしない
      }
      leave(
        this.user.uid,
        this.user.displayName,
        this.room.key,
        this.$store,
        this.room.creatorRef
      )
    },
    kick: function({ memberKey, memberName }) {
      if (!window.confirm('本当に強制退出させますか？')) {
        return
      }
      if (!this.isOwner) {
        return // 何もしない
      }
      leave(
        memberKey,
        memberName,
        this.room.key,
        this.$store,
        this.room.creatorRef
      )
    },
    gameStart: function(talkMinutes) {
      this.$store.dispatch(TO_PREPARE_ROOM, {
        roomKey: this.room.key,
        members: this.members,
        talkMinutes: talkMinutes
      })
    },
    setWord: function({ villagersWord, wolfWord }) {
      const self = this
      this.$store.dispatch(TO_PROGRESS_ROOM, {
        roomKey: this.room.key,
        villagersWord: villagersWord,
        wolfWord: wolfWord,
        callback: () => {
          self.villagersWord = ''
          self.wolfWord = ''
        }
      })
    },
    timerCount: function() {
      if (this.room == null || this.room.endingTime == null) {
        return
      }
      const endTime = this.room.endingTime.toDate()
      const now = new Date()
      const leftTime = Math.floor((endTime.getTime() - now.getTime()) / 1000)
      this.leftTime = leftTime < 0 ? 0 : leftTime
    },
    vote: function(key) {
      this.$store.dispatch(VOTE_ROOM, {
        roomKey: this.room.key,
        uid: this.user.uid,
        targetKey: key,
        members: this.members
      })
    },
    submitCounterWord: function(counterWord) {
      this.$store.dispatch(COUNTER_ROOM, {
        roomKey: this.room.key,
        counterWord: counterWord
      })
    },
    say: function({ message }) {
      const member = this.members.find(m => m.key === this.user.uid)
      const color = member == null ? null : member.color
      return this.$store.dispatch(ADD_MESSAGE, {
        roomKey: this.room.key,
        name: this.user.displayName,
        color: color,
        message: message,
        callback: () => {}
      })
    }
  }
}

const join = function(userId, userName, roomKey, store) {
  var user = auth.currentUser

  user
    .updateProfile({
      displayName: userName
    })
    .then(function() {
      const message = userName + 'さんが参加しました。'
      store.dispatch(ADD_MEMBER, {
        userName: userName,
        userId: userId,
        roomKey: roomKey,
        callback: members => {
          addSystemMessage(roomKey, message, store)
          const query = {
            roomKey: roomKey,
            memberNum: members.length,
            isChangeCreator: false
          }
          if (members.length === 1) {
            query['isChangeCreator'] = true
            query['newCreator'] = userId
          }
          store.dispatch(CHANGE_ROOM_MEMBER, query)
        }
      })
    })
    .catch(function() {})
}

const leave = function(userId, userName, roomKey, store, creator) {
  const message = userName + 'さんが退出しました。'
  store.dispatch(REMOVE_MEMBER, {
    key: userId,
    callback: members => {
      addSystemMessage(roomKey, message, store)
      const isChangeCreator = creator == userId
      const query = {
        roomKey: roomKey,
        memberNum: members.length,
        isChangeCreator: false
      }
      if (isChangeCreator) {
        query['isChangeCreator'] = true
        query['newCreator'] = members.length > 0 ? members[0].key : null
      }
      store.dispatch(CHANGE_ROOM_MEMBER, query)
    }
  })
}

const addSystemMessage = function(roomKey, message, store) {
  store.dispatch(ADD_MESSAGE, {
    roomKey: roomKey,
    name: '',
    message: message,
    color: null,
    callback: () => {}
  })
}
</script>

<style lang="css">
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
