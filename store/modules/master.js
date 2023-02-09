import { INIT_MASTER } from '~/store/action-types'
import firebase from '~/plugins/firebase'

const firestore = firebase.firestore()
const masterRef = firestore.collection('users')

const state = {
  master: '',
  bans: []
}

const mutations = {
  initMaster(state, master) {
    state.master = master
  },
  initBans(state, bans) {
    state.bans = bans
  }
}

const actions = {
  async [INIT_MASTER]({ commit }) {
    await masterRef
      .limit(1)
      .get()
      .then(snapshot => {
        snapshot.forEach(function(doc) {
          commit('initMaster', doc.data().master)
          commit('initBans', doc.data().globalBans)
        })
      })
  }
}

const getters = {
  getMaster: state => state.master,
  getBans: state => state.bans
}

export default {
  state,
  mutations,
  actions,
  getters
}
