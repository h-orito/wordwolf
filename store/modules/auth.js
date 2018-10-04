import { LOGINOUT, UPDATE_USERNAME } from '~/store/action-types'
import firebase from '~/plugins/firebase'

const firestore = firebase.firestore()
firestore.settings({
  timestampsInSnapshots: true
})
const membersRef = firestore.collection('members')

const state = {
  user: null
}

const mutations = {
  login(state, user) {
    state.user = user
  },
  logout(state) {
    state.user = null
  },
  updateUserName(state, userName) {
    state.user.displayName = userName
  }
}

const actions = {
  [LOGINOUT]({ commit }, { user, callback }) {
    if (user) {
      commit('login', user)
    } else {
      commit('logout')
    }
    if (callback) {
      callback(user)
    }
  },
  [UPDATE_USERNAME]({ commit }, { userKey, userName, callback }) {
    commit('updateUserName', userName)
    membersRef
      .doc(userKey)
      .update({
        name: userName
      })
      .then(() => {
        callback(state.user)
      })
  }
}

const getters = {
  getUser: state => state.user,
  isLogin: state => state.user != null,
  getUserName: state => state.user.displayName
}

export default {
  state,
  mutations,
  actions,
  getters
}
