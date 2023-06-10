<template>
  <div class="panel" id="room-chat">
    <p class="is-size-7 has-text-left panel-heading">
      {{ this.room != null && this.room.isComplete ? 'ログ' : 'チャット' }}
    </p>
    <div v-if="this.room != null && !this.room.isComplete" class="panel-block">
      <div class="control has-icons-right" style="margin-bottom: 5px;">
        <input
          :disabled="!canChat"
          v-model="message"
          type="text"
          class="input is-small"
          @keyup.enter="say"
          @keypress.enter="setCanMessageSubmit()"
        />
        <span class="icon is-small is-right">
          <i class="fas fa-comment"></i>
        </span>
      </div>
      <div v-if="errorMessage">
        <p class="has-text-left error-message is-size-7">
          {{ errorMessage }}
        </p>
      </div>
    </div>
    <div
      class="panel-block chatarea"
      :class="this.room != null && this.room.isComplete ? 'chatlog' : ''"
    >
      <div v-for="mes in messages" :key="mes.key" class="chatcontent">
        <span class="is-size-7 has-text-left chatmessage" :class="mes.color">{{
          createDispMessage(mes)
        }}</span>
        <span class="is-size-7" :class="mes.color">{{
          messageDatetime(mes)
        }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['room', 'members', 'user', 'messages', 'leftTime'],
  data: function() {
    return {
      message: '',
      errorMessage: '',
      banCount: 0,
      beforeMessage: '',
      canMessageSubmit: false
    }
  },
  computed: {
    roomStatus() {
      if (this.room == null) {
        return ''
      }
      return this.room.status
    },
    isMember() {
      return (
        this.user != null && this.members.some(mem => mem.key === this.user.uid)
      )
    },
    canChat() {
      if (this.room == null || !this.isMember) {
        return false
      }
      return true
    }
  },
  created: function() {
    this.banCount = localStorage.banCount ? parseInt(localStorage.banCount) : 0
  },
  methods: {
    setCanMessageSubmit() {
      // 日本語確定でもkeyup.enterが発火するので、keypressしたら立てておく
      this.canMessageSubmit = true
    },
    createDispMessage: function(mes) {
      if (mes.name == null || mes.name === '') {
        return mes.message
      }
      return mes.name + ': ' + mes.message
    },
    messageDatetime: function(mes) {
      if (
        mes == null ||
        mes.name == null ||
        mes.name === '' ||
        mes.createdAt == null
      ) {
        return ''
      }
      return makeDatetimeStr(mes.createdAt)
    },
    say() {
      this.errorMessage = ''
      if (this.message.trim() === '') {
        return
      }
      if (this.message.indexOf('http') != -1) {
        this.errorMessage = '禁止文字列が含まれています'
        return
      }
      if (!this.canMessageSubmit) {
        // 日本語確定でも発火してしまうので、keypress後でない限りNGにする
        return
      }
      if (!this.canChat) {
        return
      }
      if (this.message.length >= 200) {
        this.banCount += 4
      } else if (this.message === this.beforeMessage) {
        this.errorMessage = '同じ言葉を連投しないでください'
        this.banCount += 3
      } else if (this.message.length <= 4) {
        this.banCount += 1
      } else {
        this.banCount -= 1
        if (this.banCount < 0) {
          this.banCount = 0
        }
      }
      localStorage.banCount = this.banCount
      if (this.banCount >= 10) {
        const member = this.members.find(mem => mem.key === this.user.uid)
        this.$emit('kick', {
          memberKey: member.key,
          memberName: member.name
        })
        return
      }

      this.$emit('say', {
        message:
          this.message.length > 200
            ? this.message.substring(0, 200)
            : this.message
      })
      this.beforeMessage = this.message
      this.message = ''
      this.canMessageSubmit = false
    }
  }
}

const makeDatetimeStr = createdAt => {
  const datetime = new Date(createdAt)
  const hour = rightZeroPad(datetime.getHours())
  const minute = rightZeroPad(datetime.getMinutes())

  return hour + ':' + minute
}

const rightZeroPad = function(str) {
  return ('0' + str).slice(-2)
}
</script>

<style>
#room-chat .error-message {
  color: #ff0000;
}

#room-chat .chatmessage {
  flex: 1;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-all;
}

#room-chat .chatcontent {
  display: flex;
  font-family: sans-serif;
  color: #777777;
  line-height: 1.5;
}

#room-chat .chatarea {
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;
}

@media screen and (max-width: 767px) {
  #room-chat .chatarea {
    max-height: 50vh;
  }
}

@media screen and (min-width: 768px) {
  #room-chat .chatarea {
    max-height: 80vh;
  }
}

#room-chat .chatlog {
  max-height: 80vh !important;
}
</style>
