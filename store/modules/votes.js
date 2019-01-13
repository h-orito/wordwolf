import { INIT_VOTE, DELETE_VOTE } from '~/store/action-types'
import firebase from '~/plugins/firebase'

const database = firebase.database()

const state = {
  votes: []
}

const mutations = {
  initVote(state, votes) {
    state.votes = votes
  }
}

const actions = {
  async [INIT_VOTE]({ commit }, { roomKey }) {
    const ref = dbVotesRef(database, roomKey)
    await ref.on('value', function(snapshots) {
      const votes = []
      snapshots.forEach(s => {
        votes.push(s.val())
      })
      commit('initVote', votes)
    })
  },
  [DELETE_VOTE](context, { roomKey }) {
    database.ref('votes/' + roomKey).remove()
  }
}

const getters = {
  getVotes: state => state.votes
}

export default {
  state,
  mutations,
  actions,
  getters
}

function dbVotesRef(database, roomKey) {
  return database.ref('votes/' + roomKey + '/')
}
