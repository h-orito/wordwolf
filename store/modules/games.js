import { INIT_GAME, ADD_GAME, REMOVE_GAME } from '~/store/action-types'
import firebase from '~/plugins/firebase'

const firestore = firebase.firestore()
firestore.settings({
  timestampsInSnapshots: true
})
const gamesRef = firestore.collection('games')

const state = {
  game: null
}

const mutations = {
  initGame(state, game) {
    state.game = game
  },
  addGame(state, game) {
    state.games.push(game)
  }
}

const actions = {
  async [INIT_GAME]({ commit }) {
    this.state.unsubscribe = gamesRef.onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        switch (change.type) {
          case 'added':
            commit('addGame', change.doc.data())
            break
          case 'modified':
            commit('updateGame', change.doc.data())
            break
          case 'removed':
            commit('removeGame', change.doc.data())
            break
          default:
            break
        }
      })
    })
    await gamesRef
      .orderBy('created_at')
      .get()
      .then(games => {
        commit('initGame', games)
      })
  },
  [ADD_GAME](context, gameName) {
    const key = Math.random()
      .toString(36)
      .slice(-8)
    gamesRef.doc(key).set({
      name: gameName,
      key: key,
      created_at: new Date()
    })
  },
  [REMOVE_GAME](context, key) {
    gamesRef.doc(key).delete()
  }
}

const getters = {
  getGames: state => state.games
}

export default {
  state,
  mutations,
  actions,
  getters
}
