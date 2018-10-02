import Vuex from 'vuex'
import games from './modules/games'
import rooms from './modules/rooms'

const store = () =>
  new Vuex.Store({
    modules: {
      games,
      rooms
    }
  })
export default store
