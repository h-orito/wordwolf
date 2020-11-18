import { INIT_MASTER } from '~/store/action-types'
import firebase from '~/plugins/firebase'

const firestore = firebase.firestore()
const masterRef = firestore.collection('users')

const state = {
  master: ''
}

const mutations = {
  initMaster(state, master) {
    state.master = master
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
        })
      })
  }
}

const getters = {
  getMaster: state => state.master
}

export default {
  state,
  mutations,
  actions,
  getters
}
