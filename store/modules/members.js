import {
  INIT_MEMBER,
  RESET_MEMBER,
  ADD_MEMBER,
  REMOVE_MEMBER,
  ADD_READY,
  DELETE_READY,
  DELETE_READIES,
  ADD_WINNUM
} from '~/store/action-types'
import firebase from '~/plugins/firebase'

const firestore = firebase.firestore()
const membersRef = firestore.collection('members')
let membersUnsubscribe = null
const COLORS = [
  'color01',
  'color02',
  'color03',
  'color04',
  'color05',
  'color06',
  'color07',
  'color08',
  'color09',
  'color10'
]

const state = {
  members: []
}

const mutations = {
  initMember(state, members) {
    state.members = members
  }
}

const actions = {
  async [RESET_MEMBER]({ commit }) {
    if (membersUnsubscribe != null) {
      membersUnsubscribe()
    }
    commit('initMember', [])
  },
  async [INIT_MEMBER]({ commit }, { roomKey }) {
    if (membersUnsubscribe != null) {
      membersUnsubscribe()
      commit('initMember', [])
    }
    membersUnsubscribe = await membersRef
      .where('roomKey', '==', roomKey)
      .orderBy('createdAt')
      .onSnapshot(snapshot => {
        let members = []
        snapshot.forEach(function(doc) {
          members.push(doc.data())
        })
        commit('initMember', members)
      })
  },
  [ADD_MEMBER](context, { userName, userId, roomKey, callback }) {
    const leftColor = COLORS.filter(c => {
      return !state.members.some(m => m.color === c)
    })
    const color =
      leftColor.length > 0
        ? leftColor[0]
        : COLORS[Math.floor(Math.random() * COLORS.length)]

    const clientToken = getClientToken(this)
    membersRef
      .doc(userId)
      .set({
        name: userName,
        key: userId,
        roomKey: roomKey,
        createdAt: new Date(),
        color: color,
        ready: false,
        winNum: 0,
        clientToken: clientToken
      })
      .then(function() {
        callback(state.members)
      })
  },
  [ADD_READY](context, { userId }) {
    membersRef.doc(userId).update({
      ready: true
    })
  },
  [DELETE_READY](context, { userId }) {
    membersRef.doc(userId).update({
      ready: false
    })
  },
  [DELETE_READIES](context, { members }) {
    members.forEach(m => {
      membersRef.doc(m.key).update({
        ready: false
      })
    })
  },
  [REMOVE_MEMBER](context, { key, callback }) {
    membersRef
      .doc(key)
      .delete()
      .then(function() {
        if (callback != null) {
          callback(state.members)
        }
      })
  },
  [ADD_WINNUM](context, { keys }) {
    keys.forEach(key => {
      membersRef.doc(key).update({
        winNum: firebase.firestore.FieldValue.increment(1)
      })
    })
  }
}

const getters = {
  getMembers: state => state.members
}

function generateKey() {
  return Math.random()
    .toString(36)
    .slice(-8)
}

function getClientToken(app) {
  const token = app.$cookies.get('client-token')
  if (token) return token

  const newToken = generateKey()
  app.$cookies.set('client-token', newToken, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  })
  return newToken
}

export default {
  state,
  mutations,
  actions,
  getters
}
