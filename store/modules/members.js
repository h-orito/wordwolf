import { ADD_MEMBER, REMOVE_MEMBER } from '~/store/action-types'
import firebase from '~/plugins/firebase'

const firestore = firebase.firestore()
firestore.settings({
  timestampsInSnapshots: true
})
const membersRef = firestore.collection('members')

const state = {
  members: [],
  unsubscribe: null
}

const mutations = {
  initMember(state, members) {
    state.members = []
    members.forEach(member => {
      state.members.push(member.data())
    })
  },
  addMember(state, member) {
    state.members.push(member)
  },
  updateMember(state, member) {
    state.members.forEach(g => {
      if (member.key === g.key) {
        g = member
      }
    })
  },
  removeMember(state, member) {
    state.members = state.members.filter(g => g.key !== member.key)
  }
}

const actions = {
  [ADD_MEMBER](context, { userName, userId }) {
    membersRef.doc(userId).set({
      name: userName,
      key: userId,
      created_at: new Date()
    })
  },
  [REMOVE_MEMBER](context, key) {
    membersRef.doc(key).delete()
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
