import { INIT_MEMBER, ADD_MEMBER, REMOVE_MEMBER } from '~/store/action-types'
import firebase from '~/plugins/firebase'

const firestore = firebase.firestore()
firestore.settings({
  timestampsInSnapshots: true
})
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
        : leftColor[Math.round(Math.random() * COLORS.length)]
    membersRef
      .doc(userId)
      .set({
        name: userName,
        key: userId,
        roomKey: roomKey,
        createdAt: new Date(),
        color: color
      })
      .then(function() {
        callback(state.members)
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
  }
}

const getters = {
  getMembers: state => state.members
}

export default {
  state,
  mutations,
  actions,
  getters
}
