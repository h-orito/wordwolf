import { defineStore } from 'pinia'
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  increment
} from 'firebase/firestore'
import type { Member } from './types'

const COLORS = [
  'color01',
  'color02',
  'color03',
  'color04',
  'color05',
  'color06',
  'color07',
  'color08',
  'color09',
  'color10'
]

export const useMembersStore = defineStore('members', () => {
  const members = ref<Member[]>([])
  let unsubscribe: (() => void) | null = null

  function resetMembers() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    members.value = []
  }

  async function initMembers(roomKey: string) {
    if (unsubscribe) {
      unsubscribe()
      members.value = []
    }

    const db = useFirestore()
    const membersRef = collection(db, 'members')
    const q = query(
      membersRef,
      where('roomKey', '==', roomKey),
      orderBy('createdAt')
    )

    unsubscribe = onSnapshot(q, (snapshot) => {
      const newMembers: Member[] = []
      snapshot.forEach((doc) => {
        newMembers.push(doc.data() as Member)
      })
      members.value = newMembers
    })
  }

  async function addMember(
    userName: string,
    userId: string,
    roomKey: string,
    clientToken: string
  ) {
    const leftColor = COLORS.filter((c) => {
      return !members.value.some((m) => m.color === c)
    })
    const color =
      leftColor.length > 0
        ? leftColor[0]
        : COLORS[Math.floor(Math.random() * COLORS.length)]

    const db = useFirestore()
    const memberDoc = doc(db, 'members', userId)
    await setDoc(memberDoc, {
      name: userName,
      key: userId,
      roomKey: roomKey,
      createdAt: new Date(),
      color: color,
      ready: false,
      winNum: 0,
      clientToken: clientToken
    })
  }

  async function addReady(userId: string) {
    const db = useFirestore()
    const memberDoc = doc(db, 'members', userId)
    await updateDoc(memberDoc, { ready: true })
  }

  async function deleteReady(userId: string) {
    const db = useFirestore()
    const memberDoc = doc(db, 'members', userId)
    await updateDoc(memberDoc, { ready: false })
  }

  async function deleteReadies(membersList: Member[]) {
    const db = useFirestore()
    for (const m of membersList) {
      const memberDoc = doc(db, 'members', m.key)
      await updateDoc(memberDoc, { ready: false })
    }
  }

  async function removeMember(key: string) {
    const db = useFirestore()
    const memberDoc = doc(db, 'members', key)
    await deleteDoc(memberDoc)
  }

  async function addWinNum(keys: string[]) {
    const db = useFirestore()
    for (const key of keys) {
      const memberDoc = doc(db, 'members', key)
      await updateDoc(memberDoc, { winNum: increment(1) })
    }
  }

  return {
    members,
    resetMembers,
    initMembers,
    addMember,
    addReady,
    deleteReady,
    deleteReadies,
    removeMember,
    addWinNum
  }
})
