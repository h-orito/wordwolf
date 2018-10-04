import {
  INIT_ROOMS,
  INIT_ROOM,
  ADD_ROOM,
  REMOVE_ROOM,
  TO_PREPARE_ROOM,
  TO_PROGRESS_ROOM,
  VOTE_ROOM,
  COUNTER_ROOM,
  CHANGE_ROOM_MEMBER
} from '~/store/action-types'
import * as consts from '~/store/consts'
import firebase from '~/plugins/firebase'

const PERSON_SYSTEM = ''
const HR = 'ーーーーーーーーーーーーーーーーーーーーー'

const firestore = firebase.firestore()
firestore.settings({
  timestampsInSnapshots: true
})

const roomsRef = firestore.collection('rooms')
const messagesRef = firestore.collection('messages')

const state = {
  rooms: [],
  room: null
}

const mutations = {
  initRooms(state, rooms) {
    state.rooms = rooms
  },
  initRoom(state, room) {
    state.room = room
  }
}

const actions = {
  async [INIT_ROOMS]({ commit }) {
    await roomsRef.orderBy('createdAt').onSnapshot(snapshot => {
      let rooms = []
      snapshot.forEach(doc => {
        rooms.push(doc.data())
      })
      commit('initRooms', rooms)
    })
  },
  async [INIT_ROOM]({ commit }, { roomKey }) {
    await roomsRef.doc(roomKey).onSnapshot(doc => {
      commit('initRoom', doc.data())
    })
  },
  [ADD_ROOM](context, { roomName, userId, callback, roomPassword }) {
    // 部屋を追加
    const key = generateKey()
    roomsRef
      .doc(key)
      .set(makeRoomTemplate(roomName, key, userId, roomPassword))
      .then(function() {
        callback(key)
      })
  },
  [REMOVE_ROOM](context, key) {
    roomsRef.doc(key).delete()
  },
  // 開始前→準備
  [TO_PREPARE_ROOM](context, { roomKey, members, talkMinutes }) {
    // ランダムに並び替えてGMや人狼を決定
    let mems = members.slice(0, members.length)
    shuffle(mems)
    const gm = mems[0]
    const wolfs = mems.slice(1, 1 + state.room.wolfNum)
    const villagers = mems.slice(1 + state.room.wolfNum, mems.length)
    roomsRef
      .doc(roomKey)
      .update({
        status: consts.STATUS_PREPARE,
        gameMaster: gm,
        wolfs: wolfs,
        villagers: villagers,
        wolfWord: '',
        villagersWord: '',
        endingTime: null,
        votes: [],
        winCamp: null,
        talkMinutes: talkMinutes != null ? talkMinutes : 2
      })
      .then(() => {
        addMessage(roomKey, PERSON_SYSTEM, makePrepareMessage(gm))
      })
  },
  [TO_PROGRESS_ROOM](context, { roomKey, villagersWord, wolfWord, callback }) {
    let endTime = new Date()
    const minutes = state.room.talkMinutes
    endTime.setMinutes(endTime.getMinutes() + minutes)

    roomsRef
      .doc(roomKey)
      .update({
        status: consts.STATUS_PROGRESS,
        villagersWord: villagersWord,
        wolfWord: wolfWord,
        endingTime: endTime
      })
      .then(() => {
        addMessage(roomKey, PERSON_SYSTEM, makeProgressMessage())
        callback()
      })
  },
  [VOTE_ROOM](context, { roomKey, uid, targetKey, members }) {
    let votes = state.room.votes.slice(0, state.room.votes.length)
    votes = votes.filter(v => v.uid !== uid)
    votes.push({
      uid: uid,
      target: targetKey
    })
    const allVote = votes.length >= members.length - 1
    let status = consts.STATUS_PROGRESS
    if (allVote) {
      if (isWolfWin(votes, state.room.wolfs[0].key)) {
        status = consts.STATUS_EPILOGUE
      } else {
        status = consts.STATUS_COUNTER
      }
    }
    roomsRef
      .doc(roomKey)
      .update({
        votes: votes,
        status: status,
        winCamp: status === consts.STATUS_EPILOGUE ? 'wolfs' : null
      })
      .then(() => {
        if (!allVote) {
          return
        }
        addMessage(
          roomKey,
          PERSON_SYSTEM,
          makeVoteCompleteMessage(state.room, votes, members)
        )
      })
  },
  [COUNTER_ROOM](context, { roomKey, counterWord }) {
    const collect = state.room.villagersWord === counterWord
    roomsRef
      .doc(roomKey)
      .update({
        status: consts.STATUS_EPILOGUE,
        winCamp: collect ? 'wolfs' : 'villagers'
      })
      .then(() => {
        addMessage(
          roomKey,
          PERSON_SYSTEM,
          makeCounterMessage(
            collect,
            counterWord,
            state.room.villagersWord,
            state.room.wolfWord
          )
        )
      })
  },
  [CHANGE_ROOM_MEMBER](
    context,
    { roomKey, memberNum, isChangeCreator, newCreator }
  ) {
    const query = {
      memberNum: memberNum
    }
    if (isChangeCreator) {
      query['creatorRef'] = newCreator
    }
    roomsRef
      .doc(roomKey)
      .update(query)
      .then(() => {
        if (isChangeCreator) {
          addMessage(roomKey, PERSON_SYSTEM, 'ルームマスターが変更されました。')
        }
      })
  }
}

const getters = {
  getRooms: state => state.rooms,
  getRoom: state => state.room,
  getRoomMembers: state => state.members
}

export default {
  state,
  mutations,
  actions,
  getters
}

function shuffle(array) {
  let n = array.length
  let t, i

  while (n) {
    i = Math.floor(Math.random() * n--)
    t = array[n]
    array[n] = array[i]
    array[i] = t
  }

  return array
}

function isWolfWin(votes, wolfKey) {
  // それぞれの得票数を集計
  let voteCounts = []
  votes.forEach(v => {
    if (voteCounts.some(vc => vc.key === v.target)) {
      return true
    }
    voteCounts.push({
      key: v.target,
      count: votes.filter(vt => vt.target === v.key).length
    })
  })
  // 人狼の得票数
  const wolfCount = voteCounts.filter(vc => vc.key === wolfKey)[0].count
  // 人狼と同じか、それ以上に得票数が多い人がいるか
  return voteCounts.some(vc => vc.key !== wolfKey && vc.count >= wolfCount)
}

function addMessage(roomKey, name, message) {
  const key = generateKey()
  return messagesRef.doc(key).set({
    name: name,
    key: key,
    message: message,
    roomKey: roomKey,
    createdAt: new Date()
  })
}

function generateKey() {
  return Math.random()
    .toString(36)
    .slice(-8)
}

function makeRoomTemplate(roomName, roomKey, userId, roomPassword) {
  return {
    name: roomName,
    key: roomKey,
    creatorRef: userId,
    createdAt: new Date(),
    status: consts.STATUS_PROLOGUE,
    gameMaster: null,
    wolfs: [],
    villagers: [],
    wolfWord: '',
    villagersWord: '',
    wolfNum: 1,
    endingTime: null,
    votes: [],
    winCamp: null,
    membersNum: 1,
    roomPassword: roomPassword
  }
}

// ------------------------------------------
// システムメッセージ
// ------------------------------------------
function makePrepareMessage(gamemaster) {
  const msgs = [HR]
  msgs.push(
    'ゲームを開始します。ゲームマスターは ' + gamemaster.name + ' さんです。'
  )
  msgs.push(HR)
  return msgs.join('\n')
}

function makeProgressMessage() {
  const msgs = [HR]
  msgs.push(
    'ワードが決定しました。参加者の皆さんで配られたワードについて話し合ってください。'
  )
  msgs.push(
    '残り時間が0になったら、人狼（少数派）だと思う人に投票してください。'
  )
  return msgs.join('\n')
}

function makeVoteCompleteMessage(room, votes, members) {
  const msgs = [HR, '投票結果']
  votes.forEach(v => {
    const fromName = members.find(m => m.key === v.uid).name
    const isVillagers = room.wolfs.some(w => w.key === v.uid)
    const campName = isVillagers ? '（村人）' : '（人狼）'
    const toName = members.find(m => m.key === v.target).name
    msgs.push(fromName + campName + ' → ' + toName)
  })
  msgs.push('')
  if (room.status === consts.STATUS_EPILOGUE) {
    msgs.push('最多票が人狼（少数派）にならなかったため、人狼の勝利です！')
    msgs.push('')
    msgs.push('村人のワード：' + room.villagersWord)
    msgs.push('人狼のワード：' + room.wolfWord)
    msgs.push('ゲームが終了しました。')
  } else {
    msgs.push('最多票が人狼（少数派）となりました。')
    msgs.push(
      '人狼が村人のワードを当てられれば人狼の勝利、当てられなければ村人の勝利となります。'
    )
  }
  msgs.push(HR)
  return msgs.join('\n')
}

function makeCounterMessage(collect, counterWord, villagersWord, wolfWord) {
  const msgs = [HR, '村人のワード予想: ' + counterWord]
  if (collect) {
    msgs.push('人狼が村人のワードを当てたため、人狼の勝利です！')
  } else {
    msgs.push('人狼が村人のワードを当てられなかったため、村人の勝利です！')
  }
  msgs.push('')
  msgs.push('村人のワード：' + villagersWord)
  msgs.push('人狼のワード：' + wolfWord)
  msgs.push('ゲームが終了しました。')
  return msgs.join('\n')
}
