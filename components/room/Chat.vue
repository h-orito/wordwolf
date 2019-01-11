<template>
  <div class="panel" id="room-chat">
    <p
      class="is-size-7 has-text-left panel-heading"
    >{{ this.room != null && this.room.isComplete ? 'ログ' : 'チャット'}}</p>
    <div v-if="this.room != null && !this.room.isComplete" class="panel-block">
      <div class="control has-icons-right" style="margin-bottom: 5px;">
        <input
          :disabled="!canChat"
          v-model="message"
          type="text"
          class="input is-small"
          @keyup.enter="say"
          @keypress.enter="setCanMessageSubmit()"
        >
        <span class="icon is-small is-right">
          <i class="fas fa-comment"></i>
        </span>
      </div>
    </div>
    <div class="panel-block chatarea">
      <div v-for="mes in messages" :key="mes.key" class="chatcontent">
        <span
          class="is-size-7 has-text-left chatmessage"
          :class="mes.color"
        >{{ createDispMessage(mes) }}</span>
        <span class="is-size-7" :class="mes.color">{{ messageDatetime(mes) }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import * as consts from '~/store/consts'
export default {
  props: ['room', 'members', 'user', 'messages', 'leftTime'],
  data: function() {
    return {
      message: '',
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
      if (this.roomStatus === consts.STATUS_PREPARE) {
        return true
      }
      if (this.roomStatus === consts.STATUS_PROGRESS) {
        return this.leftTime > 0
      }
      return this.roomStatus !== consts.STATUS_COUNTER
    }
  },
  created: function() {},
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
      if (this.message.trim() === '') {
        return
      }
      if (!this.canMessageSubmit) {
        // 日本語確定でも発火してしまうので、keypress後でない限りNGにする
        return
      }

      this.$emit('say', {
        message: this.message
      })
      this.message = ''
      this.canMessageSubmit = false
    }
  }
}

const makeDatetimeStr = createdAt => {
  const datetime = new Date(createdAt)
  // const year = datetime.getFullYear()
  // const month = rightZeroPad(datetime.getMonth() + 1)
  // const date = rightZeroPad(datetime.getDate())
  const hour = rightZeroPad(datetime.getHours())
  const minute = rightZeroPad(datetime.getMinutes())
  // const second = rightZeroPad(datetime.getSeconds())

  return hour + ':' + minute
}

const rightZeroPad = function(str) {
  return ('0' + str).slice(-2)
}
</script>

<style>
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
</style>
