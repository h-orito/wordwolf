<template>
  <div>
    <section class="section">
      <div class="container">
        <h1 class="title is-5">ログイン</h1>
        <h2 class="title is-6">匿名ログイン</h2>
        <p class="content is-size-7">
          2021/5よりメール登録は不要となり、「匿名ログイン」すれば参加や部屋の作成が行えるようになりました。
        </p>
        <div class="field">
          <div class="control has-text-centered">
            <label class="checkbox">
              <input v-model="termsandpolicy" type="checkbox" >
              <a href="javascript:void(0);" @click="openTermsModal">利用規約</a>
              および<a href="javascript:void(0);" @click="openPolicyModal"
                >プライバシーポリシー</a
              >に同意します。
            </label>
          </div>
        </div>
        <div class="field">
          <div class="control has-text-centered">
            <button
              class="button is-primary"
              :disabled="!canAnnonymouslySubmit"
              @click="annonymouslySignin"
            >
              匿名ログイン
            </button>
          </div>
          <p class="help is-danger">{{ annonymouslyError }}</p>
        </div>
        <hr >
        <h2 class="title is-6">
          メールアドレスでログイン（メール認証で登録した方向け）
        </h2>
        <p class="content is-size-7">
          過去にメール登録した方は以下よりログインすることもできます。
        </p>
        <div class="field">
          <label class="label">メールアドレス</label>
          <div class="control has-icons-left has-icons-right">
            <input
              v-model="email"
              class="input"
              :class="
                !hasEmailInput ? '' : hasEmailError ? 'is-danger' : 'is-success'
              "
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
          <label class="label">パスワード</label>
          <div class="control has-icons-left has-icons-right">
            <input
              v-model="password"
              class="input"
              :class="
                !hasPasswordInput
                  ? ''
                  : hasPasswordError
                  ? 'is-danger'
                  : 'is-success'
              "
              type="password"
              placeholder="Password"
              @keyup="validatePassword"
            >
            <span class="icon is-small is-left">
              <i class="fas fa-key"/>
            </span>
            <span v-if="hasPasswordInput" class="icon is-small is-right">
              <i
                v-if="hasPasswordError"
                class="fas fa-exclamation-triangle"
              />
              <i v-if="!hasPasswordError" class="fas fa-check"/>
            </span>
          </div>
          <p class="help is-danger">{{ passwordError }}</p>
        </div>
        <div class="field">
          <div class="control has-text-centered">
            <button
              class="button is-primary"
              :disabled="!canSubmit"
              @click="signin"
            >
              ログイン
            </button>
          </div>
          <div class="control has-text-centered" style="margin-top: 15px;">
            <NuxtLink :to="{ path: '/remind' }">パスワードを忘れた</NuxtLink>
          </div>
        </div>
      </div>
    </section>
    <div id="terms-modal" class="modal">
      <div class="modal-background" @click="closeTermsModal"/>
      <div class="modal-content">
        <div class="box">
          <h4 class="is-size-5">利用規約</h4>
          <div class="content">
            <TermsOfService />
          </div>
        </div>
      </div>
    </div>
    <div id="policy-modal" class="modal">
      <div class="modal-background" @click="closePolicyModal"/>
      <div class="modal-content">
        <div class="box">
          <h4 class="is-size-5">プライバシーポリシー</h4>
          <div class="content">
            <PrivacyPolicy />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth'

useHead({
  title: 'ログイン'
})

const router = useRouter()
const auth = useFirebaseAuth()!

// data
const email = ref<string | null>(null)
const emailError = ref<string | null>(null)
const password = ref<string | null>(null)
const passwordError = ref<string | null>(null)
const termsandpolicy = ref(false)
const annonymouslyError = ref<string | null>(null)

// computed
const hasEmailInput = computed(() => email.value != null && email.value !== '')
const hasEmailError = computed(() => emailError.value != null)
const hasPasswordInput = computed(() => password.value != null && password.value !== '')
const hasPasswordError = computed(() => passwordError.value != null)
const canSubmit = computed(() =>
  hasEmailInput.value &&
  hasPasswordInput.value &&
  !hasEmailError.value &&
  !hasPasswordError.value
)
const canAnnonymouslySubmit = computed(() => !!termsandpolicy.value)

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

function validPassword(pw: string): boolean {
  if (pw.length < 7 || pw.length > 20) {
    return false
  }
  const re = /^[a-zA-Z0-9]*$/
  return re.test(String(pw))
}

function validatePassword() {
  if (password.value == null || password.value === '') {
    return
  }
  if (!validPassword(password.value)) {
    passwordError.value = '7文字以上20文字以内の英数で入力してください。'
  } else {
    passwordError.value = null
  }
}

async function signin() {
  if (!email.value || !password.value) return

  try {
    await signInWithEmailAndPassword(auth, email.value, password.value)
    router.replace({ path: '/' })
  } catch (error) {
    const errorCode = (error as { code?: string }).code
    if (errorCode === 'auth/user-disabled') {
      emailError.value = 'このアカウントは無効にされています。'
    } else if (errorCode === 'auth/invalid-email') {
      emailError.value = 'このメールアドレスは使用できません。'
    } else if (
      errorCode === 'auth/user-not-found' ||
      errorCode === 'auth/wrong-password'
    ) {
      passwordError.value = 'メールアドレスまたはパスワードが正しくありません。'
    } else if (errorCode != null && errorCode !== '') {
      emailError.value = 'エラーが発生しました。'
    }
  }
}

async function annonymouslySignin() {
  try {
    await signInAnonymously(auth)
    router.replace({ path: '/' })
  } catch {
    annonymouslyError.value = 'エラーが発生しました。'
  }
}

function openTermsModal() {
  const modal = document.querySelector('#terms-modal')
  const html = document.querySelector('html')
  modal?.classList.add('is-active')
  html?.classList.add('is-clipped')
}

function closeTermsModal() {
  const modal = document.querySelector('#terms-modal')
  const html = document.querySelector('html')
  modal?.classList.remove('is-active')
  html?.classList.remove('is-clipped')
}

function openPolicyModal() {
  const modal = document.querySelector('#policy-modal')
  const html = document.querySelector('html')
  modal?.classList.add('is-active')
  html?.classList.add('is-clipped')
}

function closePolicyModal() {
  const modal = document.querySelector('#policy-modal')
  const html = document.querySelector('html')
  modal?.classList.remove('is-active')
  html?.classList.remove('is-clipped')
}
</script>

<style lang="css"></style>
