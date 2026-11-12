import { defineStore } from 'pinia'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore'
import { ref as dbRef, push, get } from 'firebase/database'
import type { Room, Member, Vote } from './types'
import * as consts from './consts'
import { useMembersStore } from './members'

const PERSON_SYSTEM = ''
const HR = 'ーーーーーーーーーーーーーーーーーーーーー'

export const useRoomsStore = defineStore('rooms', () => {
  const rooms = ref<Room[]>([])
  const oldRooms = ref<Room[]>([])
  const room = ref<Room | null>(null)
  let roomUnsubscribe: (() => void) | null = null

  async function initRooms() {
    const db = useFirestore()
    const roomsRef = collection(db, 'rooms')
    const q = query(
      roomsRef,
      where('isComplete', '==', false),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    const newRooms: Room[] = []
    snapshot.forEach((doc) => {
      newRooms.push(doc.data() as Room)
    })
    rooms.value = newRooms
  }

  async function initOldRooms(all = false) {
    const db = useFirestore()
    const roomsRef = collection(db, 'rooms')
    const q = all
      ? query(roomsRef, where('isComplete', '==', true), orderBy('createdAt', 'desc'))
      : query(
          roomsRef,
          where('isComplete', '==', true),
          orderBy('createdAt', 'desc'),
          limit(10)
        )
    const snapshot = await getDocs(q)
    const newRooms: Room[] = []
    snapshot.forEach((doc) => {
      newRooms.push(doc.data() as Room)
    })
    oldRooms.value = newRooms
  }

  async function initRoom(roomKey: string, isComplete: boolean) {
    room.value = null
    if (roomUnsubscribe) {
      roomUnsubscribe()
      roomUnsubscribe = null
    }

    const db = useFirestore()
    const roomDoc = doc(db, 'rooms', roomKey)

    if (isComplete) {
      const snapshot = await getDoc(roomDoc)
      room.value = snapshot.data() as Room
    } else {
      // 初回取得
      const snapshot = await getDoc(roomDoc)
      room.value = snapshot.data() as Room

      // 変更を監視
      roomUnsubscribe = onSnapshot(roomDoc, (doc) => {
        room.value = doc.data() as Room
      })
    }
  }

  async function addRoom(
    roomName: string,
    userId: string,
    userName: string,
    roomPassword: string,
    roomRating: string
  ): Promise<string> {
    const db = useFirestore()
    const key = generateKey()
    const roomDoc = doc(db, 'rooms', key)
    await setDoc(roomDoc, makeRoomTemplate(roomName, key, userId, userName, roomPassword, roomRating))
    return key
  }

  async function toPrepareRoom(
    roomKey: string,
    members: Member[],
    talkMinutes: number,
    wolfNum: number
  ) {
    const gm = detectGameMaster(room.value?.gameMaster || null, members)
    const wnum =
      wolfNum == null || wolfNum <= 0 || members.length - 1 <= wolfNum ? 1 : wolfNum

    const mems = members.slice().filter((m) => m.key !== gm.key)
    shuffle(mems)
    const wolfs = mems.slice(0, wnum)
    const villagers = mems.slice(wnum)

    const db = useFirestore()
    const roomDoc = doc(db, 'rooms', roomKey)
    await updateDoc(roomDoc, {
      status: consts.STATUS_PREPARE,
      gameMaster: gm,
      wolfs,
      villagers,
      wolfWord: '',
      villagersWord: '',
      endingTime: null,
      winCamp: null,
      talkMinutes: talkMinutes ?? 2,
      membersNum: members.length
    })

    await addSystemMessage(roomKey, makePrepareMessage(gm, wnum))
  }

  async function toProgressRoom(
    roomKey: string,
    villagersWord: string,
    wolfWord: string
  ) {
    const endTime = new Date()
    const minutes = room.value?.talkMinutes ?? 2
    endTime.setMinutes(endTime.getMinutes() + minutes)

    const db = useFirestore()
    const roomDoc = doc(db, 'rooms', roomKey)
    await updateDoc(roomDoc, {
      status: consts.STATUS_PROGRESS,
      villagersWord,
      wolfWord,
      endingTime: endTime
    })

    await addSystemMessage(roomKey, makeProgressMessage())
    await addWord(villagersWord, wolfWord)
  }

  async function voteRoom(roomKey: string, uid: string, targetKey: string, members: Member[]) {
    const database = useDatabase()
    const votesRef = dbRef(database, `votes/${roomKey}/`)

    // 投票
    await push(votesRef, {
      uid,
      target: targetKey,
      createdAt: Date.now()
    })

    // 投票後の投票状態
    const snapshot = await get(votesRef)
    const votes: Vote[] = []
    snapshot.forEach((vs) => {
      const vote = vs.val() as Vote
      if (!votes.some((v) => v.uid === vote.uid)) {
        votes.push(vote)
      }
    })

    const allVote = votes.length >= members.length - 1
    if (allVote) {
      await updateAllVoteRoom(roomKey, members, votes)
    }
  }

  async function endVoteRoom(roomKey: string, members: Member[]) {
    const database = useDatabase()
    const votesRef = dbRef(database, `votes/${roomKey}/`)
    const snapshot = await get(votesRef)
    const votes: Vote[] = []
    snapshot.forEach((vs) => {
      const vote = vs.val() as Vote
      if (!votes.some((v) => v.uid === vote.uid)) {
        votes.push(vote)
      }
    })
    await updateAllVoteRoom(roomKey, members, votes)
  }

  async function counterRoom(roomKey: string, counterWord: string) {
    const collect = room.value?.villagersWord === counterWord
    const db = useFirestore()
    const roomDoc = doc(db, 'rooms', roomKey)

    await updateDoc(roomDoc, {
      status: consts.STATUS_EPILOGUE,
      winCamp: collect ? 'wolfs' : 'villagers'
    })

    await addSystemMessage(
      roomKey,
      makeCounterMessage(
        collect,
        counterWord,
        room.value?.villagersWord || '',
        room.value?.wolfWord || ''
      )
    )

    const winnerKeys = collect
      ? (room.value?.wolfs || []).map((w) => w.key)
      : (room.value?.villagers || []).map((m) => m.key)

    const membersStore = useMembersStore()
    await membersStore.addWinNum(winnerKeys)
  }

  async function changeRoomMember(
    roomKey: string,
    memberNum: number,
    isChangeCreator: boolean,
    newCreator?: string
  ) {
    const db = useFirestore()
    const roomDoc = doc(db, 'rooms', roomKey)
    const updateData: { membersNum: number; creatorRef?: string } = { membersNum: memberNum }
    if (isChangeCreator && newCreator) {
      updateData.creatorRef = newCreator
    }
    await updateDoc(roomDoc, updateData)

    if (isChangeCreator) {
      await addSystemMessage(roomKey, 'ルームマスターが変更されました。')
    }
  }

  async function resetRoom(roomKey: string, members: Member[]) {
    const db = useFirestore()
    const roomDoc = doc(db, 'rooms', roomKey)
    await updateDoc(roomDoc, {
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
  }

  async function banRoomMember(roomKey: string, target: string) {
    const banTargets = room.value?.ban || []
    banTargets.push(target)

    const db = useFirestore()
    const roomDoc = doc(db, 'rooms', roomKey)
    await updateDoc(roomDoc, { ban: banTargets })
  }

  async function completeRoom(roomKey: string) {
    const db = useFirestore()
    const roomDoc = doc(db, 'rooms', roomKey)
    await updateDoc(roomDoc, { isComplete: true })
  }

  async function updateAllVoteRoom(roomKey: string, members: Member[], votes: Vote[]) {
    const [isWolfWin, counterPerson] = getCounterPerson(
      votes,
      room.value?.wolfs || [],
      members
    )

    const db = useFirestore()
    const roomDoc = doc(db, 'rooms', roomKey)

    if (isWolfWin) {
      await updateDoc(roomDoc, {
        status: consts.STATUS_EPILOGUE,
        winCamp: 'wolfs'
      })

      const membersStore = useMembersStore()
      await membersStore.addWinNum((room.value?.wolfs || []).map((w) => w.key))
    } else {
      await updateDoc(roomDoc, {
        status: consts.STATUS_COUNTER,
        counterPerson
      })
    }

    await addSystemMessage(roomKey, makeVoteCompleteMessage(room.value!, votes, members))
  }

  async function addSystemMessage(roomKey: string, message: string) {
    const database = useDatabase()
    const messagesRef = dbRef(database, `messages/${roomKey}/`)
    const key = generateKey()
    await push(messagesRef, {
      name: PERSON_SYSTEM,
      key,
      message,
      createdAt: Date.now()
    })
  }

  async function addWord(villagersWord: string, wolfWord: string) {
    const db = useFirestore()
    const key = generateKey()
    const wordDoc = doc(db, 'words', key)
    await setDoc(wordDoc, { villagersWord, wolfWord })
  }

  return {
    rooms,
    oldRooms,
    room,
    initRooms,
    initOldRooms,
    initRoom,
    addRoom,
    toPrepareRoom,
    toProgressRoom,
    voteRoom,
    endVoteRoom,
    counterRoom,
    changeRoomMember,
    resetRoom,
    banRoomMember,
    completeRoom
  }
})

// Helper functions
function generateKey() {
  return Math.random().toString(36).slice(-8)
}

function shuffle<T>(array: T[]): T[] {
  let n = array.length
  let t: T | undefined
  let i: number

  while (n) {
    i = Math.floor(Math.random() * n--)
    t = array[n]
    array[n] = array[i]!
    array[i] = t!
  }

  return array
}

function makeRoomTemplate(
  roomName: string,
  roomKey: string,
  userId: string,
  userName: string,
  roomPassword: string,
  roomRating: string
): Room {
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
    roomPassword,
    roomRating,
    ban: [],
    counterPerson: null
  }
}

function detectGameMaster(gameMaster: Member | null, members: Member[]): Member {
  if (gameMaster == null) {
    return members[0]!
  }
  const prevGMKey = gameMaster.key
  let gm = members[0]!
  for (let idx = 0; idx < members.length - 1; idx++) {
    if (members[idx]!.key === prevGMKey) {
      gm = members[idx + 1]!
    }
  }
  return gm
}

function getCounterPerson(
  votes: Vote[],
  wolfs: Member[],
  members: Member[]
): [boolean, string | null] {
  const voteCounts = members.map((m) => ({
    key: m.key,
    count: votes.filter((v) => v.target === m.key).length,
    isWolf: wolfs.some((w) => w.key === m.key)
  }))

  let maxVoteCount = 0
  voteCounts.forEach((vc) => {
    if (maxVoteCount < vc.count) {
      maxVoteCount = vc.count
    }
  })

  const isWolfWin = voteCounts.some((vc) => !vc.isWolf && vc.count === maxVoteCount)

  if (isWolfWin) {
    return [true, null]
  }

  const maxVoteWolfs = voteCounts.filter((vc) => vc.isWolf && vc.count === maxVoteCount)
  shuffle(maxVoteWolfs)
  return [false, maxVoteWolfs[0]?.key || null]
}

function makePrepareMessage(gamemaster: Member, wolfNum: number): string {
  const msgs = [HR]
  msgs.push(
    `ゲームを開始します。ゲームマスターは ${gamemaster.name} さん、人狼の人数は${wolfNum}人です。`
  )
  msgs.push(HR)
  return msgs.join('\n')
}

function makeProgressMessage(): string {
  const msgs = [HR]
  msgs.push('ワードが決定しました。参加者の皆さんで配られたワードについて話し合ってください。')
  msgs.push('残り時間が0になったら、人狼（少数派）だと思う人に投票してください。')
  return msgs.join('\n')
}

function makeVoteCompleteMessage(room: Room, votes: Vote[], members: Member[]): string {
  const msgs = [HR, '投票結果']
  votes.forEach((v) => {
    const fromMember = members.find((m) => m.key === v.uid)
    const fromName = fromMember?.name || '不明'
    const isVillagers = !room.wolfs.some((w) => w.key === v.uid)
    const campName = isVillagers ? '（村人）' : '（人狼）'
    const toMember = members.find((m) => m.key === v.target)
    const toName = toMember?.name || '不明'
    msgs.push(`${fromName}${campName} → ${toName}`)
  })
  msgs.push('')
  if (room.status === consts.STATUS_EPILOGUE) {
    msgs.push('最多票が人狼（少数派）にならなかったため、人狼の勝利です！')
    msgs.push('')
    msgs.push(`村人のワード：${room.villagersWord}`)
    msgs.push(`人狼のワード：${room.wolfWord}`)
    msgs.push('ゲームが終了しました。')
  } else {
    msgs.push('最多票が人狼（少数派）となりました。')
    msgs.push('人狼が村人のワードを当てられれば人狼の勝利、当てられなければ村人の勝利となります。')
  }
  msgs.push(HR)
  return msgs.join('\n')
}

function makeCounterMessage(
  collect: boolean,
  counterWord: string,
  villagersWord: string,
  wolfWord: string
): string {
  const msgs = [HR, `村人のワード予想: ${counterWord}`]
  if (collect) {
    msgs.push('人狼が村人のワードを当てたため、人狼の勝利です！')
  } else {
    msgs.push('人狼が村人のワードを当てられなかったため、村人の勝利です！')
  }
  msgs.push('')
  msgs.push(`村人のワード：${villagersWord}`)
  msgs.push(`人狼のワード：${wolfWord}`)
  msgs.push('ゲームが終了しました。')
  return msgs.join('\n')
}
