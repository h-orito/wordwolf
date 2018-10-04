import Vuex from 'vuex'
import rooms from './modules/rooms'
import members from './modules/members'
import messages from './modules/messages'
import auth from './modules/auth'

const store = () =>
  new Vuex.Store({
    modules: {
      rooms,
      members,
      messages,
      auth
    }
  })
export default store
