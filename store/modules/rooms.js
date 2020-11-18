import {
  INIT_ROOMS,
  INIT_ALL_OLD_ROOMS,
  INIT_OLD_ROOMS,
  INIT_ROOM,
  ADD_ROOM,
  TO_PREPARE_ROOM,
  TO_PROGRESS_ROOM,
  VOTE_ROOM,
  END_VOTE_ROOM,
  COUNTER_ROOM,
  CHANGE_ROOM_MEMBER,
  BAN_ROOM_MEMBER,
  RESET_ROOM,
  COMPLETE_ROOM
} from '~/store/action-types'
import * as consts from '~/store/consts'
import firebase from '~/plugins/firebase'

const PERSON_SYSTEM = ''
const HR = 'ーーーーーーーーーーーーーーーーーーーーー'

const firestore = firebase.firestore()
const roomsRef = firestore.collection('rooms')
let roomsUnsubscribe = null
const wordsRef = firestore.collection('words')

const database = firebase.database()

const state = {
  rooms: [],
  oldRooms: [],
  room: null
}

const mutations = {
  initRooms(state, rooms) {
    state.rooms = rooms
  },
  initOldRooms(state, rooms) {
    state.oldRooms = rooms
  },
  initRoom(state, room) {
    state.room = room
  }
}

const actions = {
  async [INIT_ROOMS]({ commit }) {
    await roomsRef
      .where('isComplete', '==', false)
      .orderBy('createdAt', 'desc')
      .get()
      .then(function(querySnapshot) {
        let rooms = []
        querySnapshot.forEach(function(doc) {
          rooms.push(doc.data())
        })
        commit('initRooms', rooms)
      })
  },
  async [INIT_OLD_ROOMS]({ commit }) {
    await roomsRef
      .where('isComplete', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get()
      .then(function(querySnapshot) {
        let rooms = []
        querySnapshot.forEach(function(doc) {
          rooms.push(doc.data())
        })
        commit('initOldRooms', rooms)
      })
  },
  async [INIT_ALL_OLD_ROOMS]({ commit }) {
    await roomsRef
      .where('isComplete', '==', true)
      .orderBy('createdAt', 'desc')
      .get()
      .then(function(querySnapshot) {
        let rooms = []
        querySnapshot.forEach(function(doc) {
          rooms.push(doc.data())
        })
        commit('initOldRooms', rooms)
      })
  },
  async [INIT_ROOM]({ commit }, { roomKey, isComplete }) {
    // 一旦初期化
    await commit('initRoom', null)
    if (roomsUnsubscribe != null) {
      roomsUnsubscribe()
    }
    // 終了している場合は1回だけ読み込む
    if (isComplete) {
      const doc = await roomsRef.doc(roomKey).get()
      await commit('initRoom', doc.data())
    } else {
      // 初回
      const doc = await roomsRef.doc(roomKey).get()
      await commit('initRoom', doc.data())
      // 変更を取得
      roomsUnsubscribe = await roomsRef.doc(roomKey).onSnapshot(doc => {
        commit('initRoom', doc.data())
      })
    }
  },
  [ADD_ROOM](
    context,
    { roomName, userId, userName, callback, roomPassword, roomRating }
  ) {
    // 部屋を追加
    const key = generateKey()
    roomsRef
      .doc(key)
      .set(
        makeRoomTemplate(
          roomName,
          key,
          userId,
          userName,
          roomPassword,
          roomRating
        )
      )
      .then(function() {
        callback(key)
      })
  },
  // 開始前→準備
  [TO_PREPARE_ROOM](context, { roomKey, members, talkMinutes, wolfNum }) {
    // GMは順番にする
    const gm = detectGameMaster(state.room.gameMaster, members)
    const wnum =
      wolfNum == null || wolfNum <= 0 || members.length - 1 <= wolfNum
        ? 1
        : wolfNum
    let mems = members.slice(0, members.length).filter(m => m.key !== gm.key)
    shuffle(mems)
    const wolfs = mems.slice(0, wnum)
    const villagers = mems.slice(wnum, mems.length)
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
        winCamp: null,
        talkMinutes: talkMinutes != null ? talkMinutes : 2,
        membersNum: members.length
      })
      .then(() => {
        addMessage(roomKey, PERSON_SYSTEM, makePrepareMessage(gm, wnum))
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
        addWord(villagersWord, wolfWord)
        callback()
      })
  },
  async [VOTE_ROOM](context, { roomKey, uid, targetKey, members }) {
    const votesRef = dbVotesRef(database, roomKey)
    // 投票
    await votesRef.push({
      uid: uid,
      target: targetKey,
      createdAt: Date.now()
    })
    // 投票後の投票状態
    const votesnapshots = await votesRef.orderByChild('createdAt').once('value')
    const votes = []
    votesnapshots.forEach(vs => {
      const vote = vs.val()
      if (!votes.some(v => v.uid === vote.uid)) {
        votes.push(vote)
      }
    })
    const allVote = votes.length >= members.length - 1
    if (allVote) {
      await updateAllVoteRoom(state.room, members, votes, roomKey)
    }
  },
  async [END_VOTE_ROOM](context, { roomKey, members }) {
    const votesRef = dbVotesRef(database, roomKey)
    // 投票後の投票状態
    const votesnapshots = await votesRef.orderByChild('createdAt').once('value')
    const votes = []
    votesnapshots.forEach(vs => {
      const vote = vs.val()
      if (!votes.some(v => v.uid === vote.uid)) {
        votes.push(vote)
      }
    })
    await updateAllVoteRoom(state.room, members, votes, roomKey)
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
      membersNum: memberNum
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
  },
  [RESET_ROOM](context, { roomKey, members }) {
    roomsRef.doc(roomKey).update({
      key: roomKey,
      createdAt: new Date(),
      status: consts.STATUS_PROLOGUE,
      gameMaster: null,
      wolfs: [],
      villagers: [],
      wolfWord: '',
      villagersWord: '',
      endingTime: null,
      winCamp: null,
      membersNum: members.length,
      counterPerson: null
    })
  },
  [BAN_ROOM_MEMBER](context, { roomKey, target }) {
    const banTargets = state.room.ban == null ? [] : state.room.ban
    banTargets.push(target)
    roomsRef.doc(roomKey).update({
      ban: banTargets
    })
  },
  [COMPLETE_ROOM](context, { roomKey }) {
    roomsRef.doc(roomKey).update({
      isComplete: true
    })
  }
}

const getters = {
  getRooms: state => state.rooms,
  getOldRooms: state => state.oldRooms,
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

function addMessage(roomKey, name, message) {
  const key = generateKey()
  return dbMessagesRef(database, roomKey).push({
    name: name,
    key: key,
    message: message,
    createdAt: Date.now()
  })
}

function dbMessagesRef(database, roomKey) {
  return database.ref('messages/' + roomKey + '/')
}

function dbVotesRef(database, roomKey) {
  return database.ref('votes/' + roomKey + '/')
}

function addWord(villagersWord, wolfWord) {
  const key = generateKey()
  return wordsRef.doc(key).set({
    villagersWord: villagersWord,
    wolfWord: wolfWord
  })
}

function generateKey() {
  return Math.random()
    .toString(36)
    .slice(-8)
}

function makeRoomTemplate(
  roomName,
  roomKey,
  userId,
  userName,
  roomPassword,
  roomRating
) {
  return {
    isComplete: false,
    name: roomName,
    key: roomKey,
    creatorRef: userId,
    creatorName: userName,
    createdAt: new Date(),
    status: consts.STATUS_PROLOGUE,
    gameMaster: null,
    wolfs: [],
    villagers: [],
    wolfWord: '',
    villagersWord: '',
    endingTime: null,
    winCamp: null,
    membersNum: 1,
    roomPassword: roomPassword,
    roomRating: roomRating,
    ban: [],
    counterPerson: null
  }
}

function detectGameMaster(gameMaster, members) {
  if (gameMaster == null) {
    return members[0] // 初回
  }
  const prevGMKey = gameMaster.key
  let gm = members[0]
  for (let idx = 0; idx < members.length - 1; idx++) {
    if (members[idx].key === prevGMKey) {
      gm = members[idx + 1]
    }
  }
  return gm
}

function updateAllVoteRoom(room, members, votes, roomKey) {
  const query = {}
  const [isWolfWin, counterPerson] = getCounterPerson(
    votes,
    room.wolfs,
    members
  )
  if (isWolfWin) {
    query['status'] = consts.STATUS_EPILOGUE
    query['winCamp'] = 'wolfs'
  } else {
    query['status'] = consts.STATUS_COUNTER
    query['counterPerson'] = counterPerson
  }
  roomsRef
    .doc(roomKey)
    .update(query)
    .then(() => {
      addMessage(
        roomKey,
        PERSON_SYSTEM,
        makeVoteCompleteMessage(state.room, votes, members)
      )
    })
}

function getCounterPerson(votes, wolfs, members) {
  // それぞれの得票数を集計
  const voteCounts = members.map(m => {
    return {
      key: m.key,
      count: votes.filter(v => v.target === m.key).length,
      isWolf: wolfs.some(w => w.key === m.key)
    }
  })

  // 最大得票数
  let maxVoteCount = 0
  voteCounts.forEach(vc => {
    if (maxVoteCount < vc.count) {
      maxVoteCount = vc.count
    }
  })

  // 村人で最大得票数だった人がいるか
  const isWolfWin = voteCounts.some(
    vc => !vc.isWolf && vc.count === maxVoteCount
  )

  // 人狼の勝利
  if (isWolfWin) {
    return [true, null]
  }

  // 人狼が最大得票数の場合は最大得票数のうち一人をランダムで選出
  let maxVoteWolfs = voteCounts.filter(
    vc => vc.isWolf && vc.count === maxVoteCount
  )
  shuffle(maxVoteWolfs)
  return [false, maxVoteWolfs[0].key]
}

// ------------------------------------------
// システムメッセージ
// ------------------------------------------
function makePrepareMessage(gamemaster, wolfNum) {
  const msgs = [HR]
  msgs.push(
    'ゲームを開始します。ゲームマスターは ' +
      gamemaster.name +
      ' さん、人狼の人数は' +
      wolfNum +
      '人です。'
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
    const isVillagers = !room.wolfs.some(w => w.key === v.uid)
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
