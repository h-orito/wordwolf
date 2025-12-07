import { defineStore } from 'pinia'
import { ref as dbRef, onValue, off, remove } from 'firebase/database'
import type { Vote } from './types'
import type { DatabaseReference } from 'firebase/database'

export const useVotesStore = defineStore('votes', () => {
  const votes = ref<Vote[]>([])
  let votesRef: DatabaseReference | null = null

  function resetVotes() {
    if (votesRef) {
      off(votesRef)
      votesRef = null
    }
    votes.value = []
  }

  async function initVotes(roomKey: string) {
    if (votesRef) {
      off(votesRef)
      votes.value = []
    }

    const database = useDatabase()
    votesRef = dbRef(database, `votes/${roomKey}/`)

    onValue(votesRef, (snapshot) => {
      const newVotes: Vote[] = []
      snapshot.forEach((child) => {
        newVotes.push(child.val() as Vote)
      })
      votes.value = newVotes
    })
  }

  async function deleteVotes(roomKey: string) {
    const database = useDatabase()
    const ref = dbRef(database, `votes/${roomKey}`)
    await remove(ref)
  }

  return {
    votes,
    resetVotes,
    initVotes,
    deleteVotes
  }
})
