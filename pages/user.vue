<template>
  <div>
    <section class="section">
      <div class="container">
        <h1 class="title is-5">ユーザ情報編集</h1>
        <div class="columns">
          <div class="column">
            <div>
              <hr />
              <h2 class="title is-6">パスワード変更</h2>
              <div class="notification is-size-7">
                メールアドレス / パスワードの組み合わせは他サービスで利用していないものにしてください。
              </div>
              <div class="field">
                <label class="label">旧パスワード</label>
                <div class="control has-icons-left has-icons-right">
                  <input
                    class="input"
                    :class="!hasOldPasswordInput ? '' : hasOldPasswordError ? 'is-danger' : 'is-success'"
                    type="password"
                    placeholder="Old Password"
                    v-model="oldPassword"
                    @keyup="validatePassword"
                  />
                  <span class="icon is-small is-left">
                    <i class="fas fa-key"></i>
                  </span>
                  <span v-if="hasOldPasswordInput" class="icon is-small is-right">
                    <i v-if="hasOldPasswordError" class="fas fa-exclamation-triangle"></i>
                    <i v-if="!hasOldPasswordError" class="fas fa-check"></i>
                  </span>
                </div>
                <p class="help is-danger">{{ oldPasswordError }}</p>
              </div>
              <div class="field">
                <label class="label">新パスワード</label>
                <div class="control has-icons-left has-icons-right">
                  <input
                    class="input"
                    :class="!hasPasswordInput ? '' : hasPasswordError ? 'is-danger' : 'is-success'"
                    type="password"
                    placeholder="New Password"
                    v-model="password"
                    @keyup="validatePassword"
                  />
                  <span class="icon is-small is-left">
                    <i class="fas fa-key"></i>
                  </span>
                  <span v-if="hasPasswordInput" class="icon is-small is-right">
                    <i v-if="hasPasswordError" class="fas fa-exclamation-triangle"></i>
                    <i v-if="!hasPasswordError" class="fas fa-check"></i>
                  </span>
                </div>
                <p class="help is-danger">{{ passwordError }}</p>
              </div>
              <div class="field">
                <label class="label">新パスワード（確認）</label>
                <div class="control has-icons-left has-icons-right">
                  <input
                    class="input"
                    :class="!hasConfirmPasswordInput ? '' : hasConfirmPasswordError ? 'is-danger' : 'is-success'"
                    type="password"
                    placeholder="New Password"
                    v-model="confirmPassword"
                    @keyup="validatePassword"
                  />
                  <span class="icon is-small is-left">
                    <i class="fas fa-key"></i>
                  </span>
                  <span v-if="hasConfirmPasswordInput" class="icon is-small is-right">
                    <i v-if="hasConfirmPasswordError" class="fas fa-exclamation-triangle"></i>
                    <i v-if="!hasConfirmPasswordError" class="fas fa-check"></i>
                  </span>
                </div>
                <p class="help is-danger">{{ confirmPasswordError }}</p>
              </div>
              <div class="field">
                <div class="control has-text-centered">
                  <button
                    class="button is-primary"
                    :disabled="!canChangePasswordSubmit"
                    @click="changePassword"
                  >
                    パスワード変更
                  </button>
                </div>
              </div>
            </div>
            <div>
              <hr />
              <h2 class="title is-6">退会</h2>
              <div class="field">
                <div class="control has-text-centered">
                  <button class="button is-danger" @click="deleteUser">退会する</button>
                </div>
              </div>
            </div>
          </div>
          <div class="column" v-if="isUserNotVerified">
            <hr />
            <h2 class="title is-6">確認メール再送</h2>
            <div class="notification is-size-7">
              ユーザ新規登録時の確認メールを再送します。
            </div>
            <button class="button is-primary" @click="resendVerifyMail">再送する</button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendEmailVerification,
  deleteUser as firebaseDeleteUser
} from 'firebase/auth'
import { useAuthStore } from '~/stores/auth'

useHead({
  title: 'ユーザ情報編集'
})

const router = useRouter()
const auth = useFirebaseAuth()!
const authStore = useAuthStore()

// data
const oldPassword = ref<string | null>(null)
const oldPasswordError = ref<string | null>(null)
const password = ref<string | null>(null)
const passwordError = ref<string | null>(null)
const confirmPassword = ref<string | null>(null)
const confirmPasswordError = ref<string | null>(null)

// computed
const user = computed(() => authStore.user)
const isLogin = computed(() => authStore.isLogin)

const hasOldPasswordInput = computed(() => oldPassword.value != null && oldPassword.value !== '')
const hasOldPasswordError = computed(() => oldPasswordError.value != null)
const hasPasswordInput = computed(() => password.value != null && password.value !== '')
const hasPasswordError = computed(() => passwordError.value != null)
const hasConfirmPasswordInput = computed(() => confirmPassword.value != null && confirmPassword.value !== '')
const hasConfirmPasswordError = computed(() => confirmPasswordError.value != null)

const canChangePasswordSubmit = computed(() =>
  hasOldPasswordInput.value &&
  hasPasswordInput.value &&
  hasConfirmPasswordInput.value &&
  !hasOldPasswordError.value &&
  !hasPasswordError.value &&
  !hasConfirmPasswordError.value
)

const isUserNotVerified = computed(() => user.value != null && !user.value.emailVerified)

// methods
function validPassword(pw: string): boolean {
  if (pw.length < 7 || pw.length > 20) {
    return false
  }
  const re = /^[a-zA-Z0-9]*$/
  return re.test(String(pw))
}

function validatePassword() {
  if (oldPassword.value != null && oldPassword.value !== '') {
    if (!validPassword(oldPassword.value)) {
      oldPasswordError.value = '7文字以上20文字以内の英数で入力してください。'
    } else {
      oldPasswordError.value = null
    }
  }
  if (password.value != null && password.value !== '') {
    if (!validPassword(password.value)) {
      passwordError.value = '7文字以上20文字以内の英数で入力してください。'
    } else {
      passwordError.value = null
    }
  }
  if (confirmPassword.value != null && confirmPassword.value !== '') {
    if (password.value !== confirmPassword.value) {
      confirmPasswordError.value = 'パスワードが一致しません。'
    } else {
      confirmPasswordError.value = null
    }
  }
}

async function changePassword() {
  const currentUser = auth.currentUser
  if (!currentUser || !currentUser.email || !oldPassword.value || !password.value) return

  try {
    const credential = EmailAuthProvider.credential(currentUser.email, oldPassword.value)
    await reauthenticateWithCredential(currentUser, credential)
    await updatePassword(currentUser, password.value)
    router.replace({ path: '/' })
  } catch (error: any) {
    if (error.code === 'auth/wrong-password') {
      oldPasswordError.value = '旧パスワードが正しくありません。'
    } else {
      passwordError.value = 'エラーが発生しました。'
    }
  }
}

async function resendVerifyMail() {
  const currentUser = auth.currentUser
  if (!currentUser) return

  try {
    await sendEmailVerification(currentUser)
    router.replace({ path: '/' })
  } catch {
    // エラーハンドリングなし
  }
}

async function deleteUser() {
  if (!window.confirm('本当に退会しますか？ユーザが削除され、元に戻せません。')) {
    return
  }

  const currentUser = auth.currentUser
  if (!currentUser) return

  try {
    await firebaseDeleteUser(currentUser)
    router.replace({ path: '/' })
  } catch {
    // エラーハンドリングなし
  }
}
</script>

<style lang="css"></style>
