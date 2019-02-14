import { INIT_MESSAGE, ADD_MESSAGE } from '~/store/action-types'
import firebase from '~/plugins/firebase'

const database = firebase.database()
let messagesRef = null

const state = {
  messages: []
}

const mutations = {
  initMessage(state, messages) {
    state.messages = messages
  }
}

const actions = {
  async [INIT_MESSAGE]({ commit }, { roomKey, isComplete }) {
    const messages = []
    if (messagesRef != null) {
      messagesRef.off()
      commit('initMessage', [])
    }
    messagesRef = dbMessagesRef(database, roomKey)
    // 終了している村では全てを1回だけ取得する
    if (isComplete) {
      await messagesRef
        .orderByChild('createdAt')
        .once('value')
        .then(function(snapshots) {
          snapshots.forEach(snapshot => {
            messages.unshift(snapshot.val())
          })
        })
      commit('initMessage', messages)
    } else {
      await messagesRef
        .orderByChild('createdAt')
        .limitToLast(100)
        .once('value')
        .then(function(snapshots) {
          snapshots.forEach(snapshot => {
            messages.unshift(snapshot.val())
          })
        })
      await messagesRef
        .orderByChild('createdAt')
        .limitToLast(5)
        .on('value', function(snapshots) {
          snapshots.forEach(snapshot => {
            const newMessage = snapshot.val()
            const latestMessages = messages.slice(0, 10)
            if (latestMessages.some(l => l.key === newMessage.key)) {
              return
            }
            messages.unshift(newMessage)
          })
        })
      commit('initMessage', messages)
    }
  },
  [ADD_MESSAGE](
    context,
    { name, roomKey, color, message, memberKey, callback }
  ) {
    const key = Math.random()
      .toString(36)
      .slice(-8)
    if (messagesRef == null) {
      messagesRef = dbMessagesRef(database, roomKey)
    }
    messagesRef
      .push({
        name: name,
        color: color,
        key: key,
        message: message,
        memberKey: memberKey,
        createdAt: Date.now()
      })
      .then(function() {
        if (callback != null) {
          callback(key)
        }
      })
  }
}

const getters = {
  getMessages: state => state.messages
}

export default {
  state,
  mutations,
  actions,
  getters
}

function dbMessagesRef(database, roomKey) {
  return database.ref('messages/' + roomKey + '/')
}
