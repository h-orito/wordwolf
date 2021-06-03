<template lang="html">
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
              <input type="checkbox" v-model="termsandpolicy" />
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
        <hr />
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
              class="input"
              :class="
                !hasEmailInput ? '' : hasEmailError ? 'is-danger' : 'is-success'
              "
              type="email"
              placeholder="Email"
              v-model="email"
              @keyup="validateEmail"
            />
            <span class="icon is-small is-left">
              <i class="fas fa-envelope"></i>
            </span>
            <span v-if="hasEmailInput" class="icon is-small is-right">
              <i v-if="hasEmailError" class="fas fa-exclamation-triangle"></i>
              <i v-if="!hasEmailError" class="fas fa-check"></i>
            </span>
          </div>
          <p class="help is-danger">{{ emailError }}</p>
        </div>
        <div class="field">
          <label class="label">パスワード</label>
          <div class="control has-icons-left has-icons-right">
            <input
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
              v-model="password"
              @keyup="validatePassword"
            />
            <span class="icon is-small is-left">
              <i class="fas fa-key"></i>
            </span>
            <span v-if="hasPasswordInput" class="icon is-small is-right">
              <i
                v-if="hasPasswordError"
                class="fas fa-exclamation-triangle"
              ></i>
              <i v-if="!hasPasswordError" class="fas fa-check"></i>
            </span>
          </div>
          <p class="help is-danger">{{ this.passwordError }}</p>
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
            <nuxt-link :to="{ path: 'remind' }">パスワードを忘れた</nuxt-link>
          </div>
        </div>
      </div>
    </section>
    <div class="modal" id="terms-modal">
      <div class="modal-background"></div>
      <div class="modal-content">
        <div class="box">
          <h4 class="is-size-5">利用規約</h4>
          <div class="content">
            <Terms />
          </div>
        </div>
      </div>
    </div>
    <div class="modal" id="policy-modal">
      <div class="modal-background"></div>
      <div class="modal-content">
        <div class="box">
          <h4 class="is-size-5">プライバシーポリシー</h4>
          <div class="content">
            <Policy />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import firebase from '~/plugins/firebase'
import Terms from '~/components/Terms.vue'
import Policy from '~/components/Policy.vue'

const auth = firebase.auth()
export default {
  head() {
    return { title: 'ログイン' }
  },
  data() {
    return {
      email: null,
      emailError: null,
      password: null,
      passwordError: null,
      termsandpolicy: false,
      annonymouslyError: null
    }
  },
  components: {
    Terms,
    Policy
  },
  computed: {
    hasEmailInput() {
      return this.email != null && this.email !== ''
    },
    hasEmailError() {
      return this.emailError != null
    },
    hasPasswordInput() {
      return this.password != null && this.password !== ''
    },
    hasPasswordError() {
      return this.passwordError != null
    },
    canSubmit() {
      return (
        this.hasEmailInput &&
        this.hasPasswordInput &&
        !this.hasEmailError &&
        !this.hasPasswordError
      )
    },
    canAnnonymouslySubmit() {
      return !!this.termsandpolicy
    }
  },
  methods: {
    validateEmail() {
      if (this.email == null || this.email === '') {
        return
      }
      if (!this.validEmail(this.email)) {
        this.emailError = '正しいメールアドレス形式で入力してください。'
      } else {
        this.emailError = null
      }
    },
    validEmail(email) {
      const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      return re.test(String(email).toLowerCase())
    },
    validatePassword() {
      if (this.password == null || this.password === '') {
        return
      }
      if (!this.validPassword(this.password)) {
        this.passwordError = '7文字以上20文字以内の英数で入力してください。'
      } else {
        this.passwordError = null
      }
    },
    validPassword(password) {
      if (password.length < 7 || password.length > 20) {
        return false
      }
      const re = /^[a-zA-Z0-9]*$/
      return re.test(String(password))
    },
    signin() {
      const self = this
      auth
        .signInWithEmailAndPassword(self.email, self.password)
        .then(function() {
          self.$router.replace({ path: '/' })
        })
        .catch(function(error) {
          const errorCode = error.code
          if (errorCode === 'auth/user-disabled') {
            self.emailError = 'このアカウントは無効にされています。'
          } else if (errorCode === 'auth/invalid-email') {
            self.emailError = 'このメールアドレスは使用できません。'
          } else if (
            errorCode === 'auth/user-not-found' ||
            errorCode === 'auth/wrong-password'
          ) {
            self.passwordError =
              'メールアドレスまたはパスワードが正しくありません。'
          } else if (errorCode != null && errorCode !== '') {
            self.emailError = 'エラーが発生しました。'
          }
        })
    },
    annonymouslySignin() {
      const self = this
      auth
        .signInAnonymously()
        .then(function() {
          self.$router.replace({ path: '/' })
        })
        .catch(function() {
          self.annonymouslyError = 'エラーが発生しました。'
        })
    },
    openTermsModal() {
      var modal = document.querySelector('#terms-modal')
      var html = document.querySelector('html')
      modal.classList.add('is-active')
      html.classList.add('is-clipped')

      modal
        .querySelector('.modal-background')
        .addEventListener('click', function(e) {
          e.preventDefault()
          modal.classList.remove('is-active')
          html.classList.remove('is-clipped')
        })
    },
    openPolicyModal() {
      var modal = document.querySelector('#policy-modal')
      var html = document.querySelector('html')
      modal.classList.add('is-active')
      html.classList.add('is-clipped')

      modal
        .querySelector('.modal-background')
        .addEventListener('click', function(e) {
          e.preventDefault()
          modal.classList.remove('is-active')
          html.classList.remove('is-clipped')
        })
    }
  }
}
</script>

<style lang="css"></style>
