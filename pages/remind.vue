<template>
  <div>
    <section class="section">
      <div class="container">
        <h1 class="title is-5">パスワード再発行</h1>
        <div class="columns">
          <div class="column">
            <div class="field">
              <label class="label">メールアドレス</label>
              <div class="control has-icons-left has-icons-right">
                <input
                  v-model="email"
                  class="input"
                  :class="!hasEmailInput ? '' : hasEmailError ? 'is-danger' : 'is-success'"
                  type="email"
                  placeholder="Email"
                  @keyup="validateEmail"
                >
                <span class="icon is-small is-left">
                  <i class="fas fa-envelope"/>
                </span>
                <span v-if="hasEmailInput" class="icon is-small is-right">
                  <i v-if="hasEmailError" class="fas fa-exclamation-triangle"/>
                  <i v-if="!hasEmailError" class="fas fa-check"/>
                </span>
              </div>
              <p class="help is-danger">{{ emailError }}</p>
            </div>
            <div class="field">
              <div class="control has-text-centered">
                <button
                  class="button is-primary"
                  :disabled="!canSubmit"
                  @click="remindMail"
                >
                  再発行メール送信
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { sendPasswordResetEmail } from 'firebase/auth'

useHead({
  title: 'パスワード再発行'
})

const router = useRouter()
const auth = useFirebaseAuth()!

// data
const email = ref<string | null>(null)
const emailError = ref<string | null>(null)

// computed
const hasEmailInput = computed(() => email.value != null && email.value !== '')
const hasEmailError = computed(() => emailError.value != null)
const canSubmit = computed(() => hasEmailInput.value && !hasEmailError.value)

// methods
function validEmail(emailStr: string): boolean {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(String(emailStr).toLowerCase())
}

function validateEmail() {
  if (email.value == null || email.value === '') {
    return
  }
  if (!validEmail(email.value)) {
    emailError.value = '正しいメールアドレス形式で入力してください。'
  } else {
    emailError.value = null
  }
}

async function remindMail() {
  if (!email.value) return

  try {
    await sendPasswordResetEmail(auth, email.value)
    router.replace({ path: '/' })
  } catch {
    // 悪用防止のためエラーはハンドリングしない
    router.replace({ path: '/' })
  }
}
</script>

<style lang="css"></style>
