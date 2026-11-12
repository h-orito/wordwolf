<template>
  <div id="room-chat" class="panel">
    <p class="is-size-7 has-text-left panel-heading">
      {{ room != null && room.isComplete ? 'ログ' : 'チャット' }}
    </p>
    <div v-if="room != null && !room.isComplete" class="panel-block">
      <div class="control has-icons-right" style="margin-bottom: 5px;">
        <input
          v-model="message"
          :disabled="!canChat"
          type="text"
          class="input is-small"
          @keyup.enter="say"
          @keypress.enter="setCanMessageSubmit()"
        >
        <span class="icon is-small is-right">
          <i class="fas fa-comment"/>
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
      :class="room != null && room.isComplete ? 'chatlog' : ''"
    >
      <div v-for="mes in messages" :key="mes.key" class="chatcontent">
        <span class="is-size-7 has-text-left chatmessage" :class="mes.color">
          {{ createDispMessage(mes) }}
        </span>
        <span class="is-size-7" :class="mes.color">
          {{ messageDatetime(mes) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Room, Member, Message } from '~/stores/types'

interface Props {
  room: Room | null
  members: Member[]
  user: { uid: string; displayName: string | null } | null
  messages: Message[]
  leftTime: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  say: [{ message: string }]
  kick: [{ memberKey: string; memberName: string }]
}>()

// data
const message = ref('')
const errorMessage = ref('')
const banCount = ref(0)
const beforeMessage = ref('')
const canMessageSubmit = ref(false)

// computed
const isMember = computed(() => {
  return props.user != null && props.members.some(mem => mem.key === props.user!.uid)
})

const canChat = computed(() => {
  if (props.room == null || !isMember.value) {
    return false
  }
  return true
})

// lifecycle
onMounted(() => {
  if (typeof localStorage !== 'undefined') {
    banCount.value = localStorage.banCount ? parseInt(localStorage.banCount) : 0
  }
})

// methods
function setCanMessageSubmit() {
  canMessageSubmit.value = true
}

function createDispMessage(mes: Message): string {
  if (mes.name == null || mes.name === '') {
    return mes.message
  }
  return mes.name + ': ' + mes.message
}

function messageDatetime(mes: Message): string {
  if (
    mes == null ||
    mes.name == null ||
    mes.name === '' ||
    mes.createdAt == null
  ) {
    return ''
  }
  return makeDatetimeStr(mes.createdAt)
}

function makeDatetimeStr(createdAt: number): string {
  const datetime = new Date(createdAt)
  const hour = rightZeroPad(datetime.getHours())
  const minute = rightZeroPad(datetime.getMinutes())
  return hour + ':' + minute
}

function rightZeroPad(num: number): string {
  return ('0' + num).slice(-2)
}

function say() {
  errorMessage.value = ''
  if (message.value.trim() === '') {
    return
  }
  if (message.value.indexOf('http') !== -1) {
    errorMessage.value = '禁止文字列が含まれています'
    return
  }
  if (!canMessageSubmit.value) {
    return
  }
  if (!canChat.value) {
    return
  }
  if (message.value.length >= 200) {
    banCount.value += 4
  } else if (message.value === beforeMessage.value) {
    errorMessage.value = '同じ言葉を連投しないでください'
    banCount.value += 3
  } else if (message.value.length <= 4) {
    banCount.value += 1
  } else {
    banCount.value -= 1
    if (banCount.value < 0) {
      banCount.value = 0
    }
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.banCount = banCount.value
  }
  if (banCount.value >= 10) {
    const member = props.members.find(mem => mem.key === props.user?.uid)
    if (member) {
      emit('kick', {
        memberKey: member.key,
        memberName: member.name
      })
    }
    return
  }

  emit('say', {
    message: message.value.length > 200
      ? message.value.substring(0, 200)
      : message.value
  })
  beforeMessage.value = message.value
  message.value = ''
  canMessageSubmit.value = false
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
