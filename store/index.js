import Vuex from 'vuex'
import games from './modules/games'
import rooms from './modules/rooms'
import members from './modules/members'

const store = () =>
  new Vuex.Store({
    modules: {
      games,
      rooms,
      members
    }
  })
export default store
