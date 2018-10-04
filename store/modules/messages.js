import { INIT_MESSAGE, ADD_MESSAGE } from '~/store/action-types'
import firebase from '~/plugins/firebase'

const firestore = firebase.firestore()
firestore.settings({
  timestampsInSnapshots: true
})
const messagesRef = firestore.collection('messages')

const state = {
  messages: []
}

const mutations = {
  initMessage(state, messages) {
    state.messages = messages
  }
}

const actions = {
  async [INIT_MESSAGE]({ commit }, { roomKey }) {
    await messagesRef
      .where('roomKey', '==', roomKey)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        let messages = []
        let cnt = 0
        snapshot.forEach(function(doc) {
          if (cnt >= 100) return // 最新の100個だけ表示
          messages.push(doc.data())
          cnt++
        })
        commit('initMessage', messages)
      })
  },
  [ADD_MESSAGE](context, { name, roomKey, color, message, callback }) {
    const key = Math.random()
      .toString(36)
      .slice(-8)
    messagesRef
      .doc(key)
      .set({
        name: name,
        color: color,
        key: key,
        message: message,
        roomKey: roomKey,
        createdAt: new Date()
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
