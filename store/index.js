import Vuex from 'vuex'
import games from './modules/games'

const store = () =>
  new Vuex.Store({
    modules: {
      games
    }
  })
export default store
