import { defineStore } from 'pinia'
import { collection, getDocs, limit, query } from 'firebase/firestore'

export const useMasterStore = defineStore('master', () => {
  const master = ref('')
  const bans = ref<string[]>([])

  async function initMaster() {
    const db = useFirestore()
    const usersRef = collection(db, 'users')
    const q = query(usersRef, limit(1))
    const snapshot = await getDocs(q)

    snapshot.forEach((doc) => {
      const data = doc.data()
      master.value = data.master || ''
      bans.value = data.globalBans || []
    })
  }

  return {
    master,
    bans,
    initMaster
  }
})
