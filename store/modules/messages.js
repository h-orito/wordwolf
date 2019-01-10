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
    const messages = []
    await messagesRef
      .where('roomKey', '==', roomKey)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get()
      .then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          messages.push(doc.data())
        })
      })

    await messagesRef
      .where('roomKey', '==', roomKey)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .onSnapshot(snapshot => {
        snapshot.forEach(function(doc) {
          const newMessage = doc.data()
          if (messages[0].key !== newMessage.key) {
            messages.unshift(newMessage)
          }
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
