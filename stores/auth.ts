import { defineStore } from 'pinia'
import { doc, updateDoc } from 'firebase/firestore'
import type { User } from 'firebase/auth'

interface AuthUser {
  uid: string
  displayName: string | null
  email: string | null
  emailVerified: boolean
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)

  const isLogin = computed(() => user.value != null)
  const userName = computed(() => user.value?.displayName ?? '')

  function login(firebaseUser: User) {
    user.value = {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName,
      email: firebaseUser.email,
      emailVerified: firebaseUser.emailVerified
    }
  }

  function logout() {
    user.value = null
  }

  async function updateUserName(userKey: string, newUserName: string) {
    if (!user.value) return

    const db = useFirestore()
    const memberDoc = doc(db, 'members', userKey)
    await updateDoc(memberDoc, { name: newUserName })
    user.value.displayName = newUserName
  }

  return {
    user,
    isLogin,
    userName,
    login,
    logout,
    updateUserName
  }
})
