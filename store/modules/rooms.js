import { INIT_ROOM, ADD_ROOM, REMOVE_ROOM } from '~/store/action-types'
import firebase from '~/plugins/firebase'

const firestore = firebase.firestore()
firestore.settings({
  timestampsInSnapshots: true
})
const roomsRef = firestore.collection('rooms')

const state = {
  rooms: [],
  unsubscribe: null
}

const mutations = {
  initRoom(state, rooms) {
    state.rooms = []
    rooms.forEach(room => {
      state.rooms.push(room.data())
    })
  },
  addRoom(state, room) {
    state.rooms.push(room)
  },
  updateRoom(state, room) {
    state.rooms.forEach(g => {
      if (room.key === g.key) {
        g = room
      }
    })
  },
  removeRoom(state, room) {
    state.rooms = state.rooms.filter(g => g.key !== room.key)
  }
}

const actions = {
  async [INIT_ROOM]({ commit }) {
    this.state.unsubscribe = roomsRef.onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        switch (change.type) {
          case 'added':
            commit('addRoom', change.doc.data())
            break
          case 'modified':
            commit('updateRoom', change.doc.data())
            break
          case 'removed':
            commit('removeRoom', change.doc.data())
            break
          default:
            break
        }
      })
    })
    await roomsRef
      .orderBy('created_at')
      .get()
      .then(rooms => {
        commit('initRoom', rooms)
      })
  },
  [ADD_ROOM](context, roomName) {
    // 部屋を追加
    const key = Math.random()
      .toString(36)
      .slice(-8)
    roomsRef.doc(key).set({
      name: roomName,
      key: key,
      membersRef: [],
      created_at: new Date()
    })
  },
  [REMOVE_ROOM](context, key) {
    roomsRef.doc(key).delete()
  }
}

const getters = {
  getRooms: state => state.rooms
}

export default {
  state,
  mutations,
  actions,
  getters
}
