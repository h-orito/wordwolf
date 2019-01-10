import { INIT_MESSAGE, ADD_MESSAGE } from '~/store/action-types'
import firebase from '~/plugins/firebase'

const database = firebase.database()

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
    const ref = dbMessagesRef(database, roomKey)
    // 終了している村では全てを1回だけ取得する
    if (isComplete) {
      await ref
        .orderByChild('createdAt')
        .once('value')
        .then(function(snapshots) {
          snapshots.forEach(snapshot => {
            messages.unshift(snapshot.val())
          })
        })
      commit('initMessage', messages)
    } else {
      await ref
        .orderByChild('createdAt')
        .limitToLast(100)
        .once('value')
        .then(function(snapshots) {
          snapshots.forEach(snapshot => {
            messages.unshift(snapshot.val())
          })
        })
      await ref
        .orderByChild('createdAt')
        .limitToLast(1)
        .on('value', function(snapshots) {
          snapshots.forEach(snapshot => {
            const newMessage = snapshot.val()
            if (messages[0].key !== newMessage.key) {
              messages.unshift(newMessage)
            }
          })
        })
      commit('initMessage', messages)
    }
  },
  [ADD_MESSAGE](context, { name, roomKey, color, message, callback }) {
    const key = Math.random()
      .toString(36)
      .slice(-8)
    dbMessagesRef(database, roomKey)
      .push({
        name: name,
        color: color,
        key: key,
        message: message,
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
