<template lang="html">
  <section
    class="section" style="padding: 1rem 1rem;">
    <div class="container">
      <span v-if="room != null && (room['roomPassword'] != null && room['roomPassword'] !== '')" class="fas fa-key"></span>
      <span v-if="room != null && (room['roomRating'] === 'R15' || room['roomRating'] === 'R18')" class="has-text-danger">{{ room['roomRating'] }}</span>
      <h1 class="title is-6">{{ room != null ? room.name : '' }}</h1>
      <div class="columns is-tablet" v-if="isPasswordCollect">
        <!-- left tab -->
        <div class="column is-one-thirds-tablet" v-if="room != null && !room.isComplete">
          <Members :room="room" :members="members" :voteKeys="votes" :user="user" @kick="kick"></Members>
          <Proepi :room="room" :members="members" :user="user" :isLogin="isLogin" :master="master"
            @joinRoom="joinRoom" @leaveRoom="leaveRoom" @ready="ready" @cancelReady="cancelReady" @gameStart="gameStart"></Proepi>
          <Prepare :room="room" :members="members" :user="user" @setWord="setWord"></Prepare>
          <Progress :room="room" :members="members" :voteKeys="votes" :user="user" :leftTime="leftTime" @vote="vote" @endVote="endVote"></Progress>
          <Counter :room="room" :members="members" :user="user" @submitCounterWord="submitCounterWord"></Counter>
          <Reset :room="room" :user="user" @submitRoomReset="submitRoomReset"></Reset>
        </div>
        <!-- end left tab -->
        <!-- right tab -->
        <div class="column" :class="room == null || !room.isComplete ? 'is-two-thirds-tablet' : ''">
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
      <script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
      <!-- wordwolf-footer -->
      <ins class="adsbygoogle"
          style="display:block"
          data-ad-client="ca-pub-0917187897820609"
          data-ad-slot="1231685842"
          data-ad-format="auto"
          data-full-width-responsive="true"></ins>
      <script>
      (adsbygoogle = window.adsbygoogle || []).push({});
      </script>
    </div>
    <div class="modal" id="password-modal">
      <div class="modal-background is-cli"></div>
      <div class="modal-card" style="width: 95vw; height: 95vh;">
        <header class="modal-card-head">
          <p class="modal-card-title is-size-5">パスワード入力</p>
        </header>
        <section class="modal-card-body is-size-7">
          <div v-if="room != null && room.roomPassword != null && room.roomRating != ''" class="notification is-warning is-size-7" style="margin-top: 1.5rem;">
            {{ 'この部屋は暴力表現' + (room.roomRating == 'R18' ? '、性的表現': '') + 'が投稿される可能性があります。'}}<br>
          </div>
          <p class="has-text-left">この部屋に入室するにはパスワードが必要です。</p>
          <div class="field" v-if="room != null && room.roomPassword != null && room.roomPassword !== ''">
            <div class="control">
              <input
                class="input is-small"
                :class="!hasRoomPassword ? '' : hasRoomPasswordError ? 'is-danger': 'is-success'"
                type="text"
                v-model="roomPassword"
                placeholder="パスワード"
                @keyup="validateRoomPassword"
              >
            </div>
            <p
              class="help is-danger has-text-left is-size-7"
              v-if="hasRoomPassword"
            >{{this.roomPasswordError}}</p>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-small" @click="backToTop">キャンセル</button>
          <button class="button is-success is-small" style="right: 0;" :disabled="!canView" @click="submitPassword">送信</button>
        </footer>
      </div>
    </div>
  </section>
</template>

<script>
import {
  LOGINOUT,
  INIT_ROOM,
  INIT_MEMBER,
  RESET_MEMBER,
  INIT_MESSAGE,
  RESET_MESSAGE,
  INIT_VOTE,
  DELETE_VOTE,
  ADD_READY,
  DELETE_READY,
  DELETE_READIES,
  ADD_MEMBER,
  REMOVE_MEMBER,
  ADD_MESSAGE,
  TO_PREPARE_ROOM,
  TO_PROGRESS_ROOM,
  VOTE_ROOM,
  END_VOTE_ROOM,
  COUNTER_ROOM,
  CHANGE_ROOM_MEMBER,
  BAN_ROOM_MEMBER,
  RESET_ROOM,
  COMPLETE_ROOM,
  INIT_MASTER
} from '../store/action-types'
import firebase from '~/plugins/firebase'
import Members from '~/components/room/Members'
import Proepi from '~/components/room/Proepi'
import Prepare from '~/components/room/Prepare'
import Progress from '~/components/room/Progress'
import Counter from '~/components/room/Counter'
import Reset from '~/components/room/Reset'
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
    Reset,
    Chat,
    Footer
  },
  data() {
    return {
      roomKey: '',
      isComplete: false,
      leftTime: 0,
      timerObj: null,
      roomPassword: '',
      roomPasswordError: null,
      isPasswordCollect: false
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
    master() {
      return this.$store.getters.getMaster
    },
    votes() {
      return this.$store.getters.getVotes
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
    isGameMaster() {
      return (
        this.room != null &&
        this.user != null &&
        this.room.gameMaster.key === this.user.uid
      )
    },
    messages() {
      return this.$store.getters.getMessages
    },
    hasRoomPassword() {
      return this.roomPassword != null && this.roomPassword !== ''
    },
    hasRoomPasswordError() {
      return this.roomPasswordError != null
    },
    canView() {
      this.validateRoomPassword()
      return this.hasRoomPassword && !this.hasRoomPasswordError && this.isLogin
    }
  },
  asyncData({ query }) {
    return { roomKey: query.id, isComplete: query.complete }
  },
  async mounted() {
    const self = this
    this.timerObj = setInterval(function() {
      self.timerCount()
    }, 1000)
    firebase.auth().onAuthStateChanged(user => {
      this.$store.dispatch(LOGINOUT, {
        user: user
      })
    })

    const fetchQuery = {
      roomKey: this.roomKey,
      isComplete: this.isComplete
    }
    await this.$store.dispatch(INIT_ROOM, fetchQuery)
    if (this.room.roomPassword != null && this.room.roomPassword != '') {
      await this.$store.dispatch(RESET_MEMBER, fetchQuery)
      await this.$store.dispatch(RESET_MESSAGE, fetchQuery)
      this.openPasswordModal()
      return
    } else {
      this.initMemberAndMessage()
    }
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
      if (
        !window.confirm(
          '本当に強制退出させますか？退出させた人はこの部屋に参加できなくなります。'
        )
      ) {
        return
      }
      if (!this.isOwner) {
        return // 何もしない
      }
      this.$store.dispatch(BAN_ROOM_MEMBER, {
        roomKey: this.room.key,
        target: memberKey
      })
      leave(
        memberKey,
        memberName,
        this.room.key,
        this.$store,
        this.room.creatorRef
      )
    },
    submitRoomReset: function() {
      if (
        !window.confirm(
          '進行不可能になった場合のみ使用してください。本当に開始前の状態に戻しますか？'
        )
      ) {
        return
      }
      if (!this.isOwner) {
        return // 何もしない
      }
      this.$store.dispatch(RESET_ROOM, {
        roomKey: this.room.key,
        members: this.members
      })
    },
    gameStart: function({ talkMinutes, wolfNum }) {
      const roomKey = this.room.key
      this.$store
        .dispatch(TO_PREPARE_ROOM, {
          roomKey: roomKey,
          members: this.members,
          talkMinutes: talkMinutes,
          wolfNum: wolfNum
        })
        .then(() => {
          this.$store.dispatch(DELETE_VOTE, {
            roomKey: roomKey
          })
          this.$store.dispatch(DELETE_READIES, {
            members: this.members
          })
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
    cancelReady: function() {
      this.$store.dispatch(DELETE_READY, {
        userId: this.user.uid
      })
    },
    ready: function() {
      this.$store.dispatch(ADD_READY, {
        userId: this.user.uid
      })
    },
    vote: async function(key) {
      await this.$store.dispatch(VOTE_ROOM, {
        roomKey: this.room.key,
        uid: this.user.uid,
        targetKey: key,
        members: this.members
      })
    },
    endVote: async function() {
      if (!window.confirm('本当に投票を打ち切って進行させますか？')) {
        return
      }
      if (!this.isOwner && !this.isGameMaster) {
        return // 何もしない
      }
      await this.$store.dispatch(END_VOTE_ROOM, {
        roomKey: this.room.key,
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
        memberKey: this.user.uid,
        callback: () => {}
      })
    },
    openPasswordModal() {
      var modal = document.querySelector('#password-modal')
      var html = document.querySelector('html')
      modal.classList.add('is-active')
      html.classList.add('is-clipped')
    },
    backToTop() {
      location.href = '/'
    },
    validateRoomPassword() {
      if (
        this.room == null ||
        this.room.roomPassword == null ||
        this.room.roomPassword === ''
      ) {
        return
      }
      if (this.room.roomPassword !== this.roomPassword) {
        this.roomPasswordError = '正しくありません'
      } else {
        this.roomPasswordError = null
      }
    },
    async submitPassword() {
      this.validateRoomPassword()
      if (!this.canView) {
        return
      }
      await this.initMemberAndMessage()
      document.querySelector('#password-modal').classList.remove('is-active')
      document.querySelector('html').classList.remove('is-clipped')
    },
    async initMemberAndMessage() {
      this.isPasswordCollect = true
      const fetchQuery = {
        roomKey: this.roomKey,
        isComplete: this.isComplete
      }
      await this.$store.dispatch(INIT_MEMBER, fetchQuery)
      if (!this.isComplete) {
        await this.$store.dispatch(INIT_VOTE, fetchQuery)
      }
      await this.$store.dispatch(INIT_MASTER)
      await this.$store.dispatch(INIT_MESSAGE, fetchQuery)
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

const leave = async function(userId, userName, roomKey, store, creator) {
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
      if (members.length <= 0) {
        store.dispatch(COMPLETE_ROOM, { roomKey: roomKey })
      }
    }
  })
}

const addSystemMessage = function(roomKey, message, store) {
  store.dispatch(ADD_MESSAGE, {
    roomKey: roomKey,
    name: '',
    message: message,
    memberKey: null,
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
