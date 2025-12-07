import { defineStore } from 'pinia'
import { ref as dbRef, push, onChildAdded, onValue, off } from 'firebase/database'
import type { Message } from './types'
import type { DatabaseReference } from 'firebase/database'

export const useMessagesStore = defineStore('messages', () => {
  const messages = ref<Message[]>([])
  let messagesRef: DatabaseReference | null = null

  function resetMessages() {
    if (messagesRef) {
      off(messagesRef)
      messagesRef = null
    }
    messages.value = []
  }

  async function initMessages(roomKey: string, isComplete: boolean) {
    if (messagesRef) {
      off(messagesRef)
      messages.value = []
    }

    const database = useDatabase()
    messagesRef = dbRef(database, `messages/${roomKey}/`)

    if (isComplete) {
      // 終了している村では全てを1回だけ取得する
      onValue(
        messagesRef,
        (snapshot) => {
          const newMessages: Message[] = []
          snapshot.forEach((child) => {
            newMessages.unshift(child.val() as Message)
          })
          messages.value = newMessages
        },
        { onlyOnce: true }
      )
    } else {
      const localMessages: Message[] = []
      onChildAdded(messagesRef, (snapshot) => {
        localMessages.unshift(snapshot.val() as Message)
        messages.value = [...localMessages]
      })
    }
  }

  async function addMessage(
    name: string,
    roomKey: string,
    color: string,
    message: string,
    memberKey: string,
    clientToken: string
  ) {
    const database = useDatabase()
    if (!messagesRef) {
      messagesRef = dbRef(database, `messages/${roomKey}/`)
    }

    const key = generateKey()
    await push(messagesRef, {
      name,
      color,
      key,
      message,
      memberKey,
      createdAt: Date.now(),
      clientToken
    })

    return key
  }

  return {
    messages,
    resetMessages,
    initMessages,
    addMessage
  }
})

function generateKey() {
  return Math.random().toString(36).slice(-8)
}
