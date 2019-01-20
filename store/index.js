import Vuex from 'vuex'
import rooms from './modules/rooms'
import members from './modules/members'
import master from './modules/master'
import messages from './modules/messages'
import votes from './modules/votes'
import auth from './modules/auth'

const store = () =>
  new Vuex.Store({
    modules: {
      rooms,
      members,
      messages,
      votes,
      auth,
      master
    }
  })
export default store
