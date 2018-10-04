<template lang="html">
  <div>
    <section class="section">
      <div class="container">
        <h1 class="title is-5">新規登録</h1>
        <div class="columns">
          <div class="column">
            <div class="notification is-size-7">
              メールアドレス / パスワードの組み合わせは他サービスで利用していないものにしてください。
            </div>
            <div class="field">
              <label class="label">メールアドレス</label>
              <div class="control has-icons-left has-icons-right">
                <input class="input" :class="!hasEmailInput ? '' : hasEmailError ? 'is-danger': 'is-success'"
                  type="email" placeholder="Email" v-model="email" @keyup="validateEmail">
                <span class="icon is-small is-left">
                  <i class="fas fa-envelope"></i>
                </span>
                <span v-if="hasEmailInput" class="icon is-small is-right">
                  <i v-if="hasEmailError" class="fas fa-exclamation-triangle"></i>
                  <i v-if="!hasEmailError" class="fas fa-check"></i>
                </span>
              </div>
              <p class="help is-danger">{{this.emailError}}</p>
            </div>
            <div class="field">
              <label class="label">パスワード</label>
              <div class="control has-icons-left has-icons-right">
                <input class="input" :class="!hasPasswordInput ? '' : hasPasswordError ? 'is-danger': 'is-success'"
                  type="password" placeholder="Password" v-model="password" @keyup="validatePassword">
                <span class="icon is-small is-left">
                  <i class="fas fa-key"></i>
                </span>
                <span v-if="hasPasswordInput" class="icon is-small is-right">
                  <i v-if="hasPasswordError" class="fas fa-exclamation-triangle"></i>
                  <i v-if="!hasPasswordError" class="fas fa-check"></i>
                </span>
              </div>
              <p class="help is-danger">{{this.passwordError}}</p>
            </div>
            <div class="field">
              <label class="label">パスワード（確認）</label>
              <div class="control has-icons-left has-icons-right">
                <input class="input" :class="!hasConfirmPasswordInput ? '' : hasConfirmPasswordError ? 'is-danger': 'is-success'"
                  type="password" placeholder="Password" v-model="confirmPassword" @keyup="validatePassword">
                <span class="icon is-small is-left">
                  <i class="fas fa-key"></i>
                </span>
                <span v-if="hasConfirmPasswordInput" class="icon is-small is-right">
                  <i v-if="hasConfirmPasswordError" class="fas fa-exclamation-triangle"></i>
                  <i v-if="!hasConfirmPasswordError" class="fas fa-check"></i>
                </span>
              </div>
              <p class="help is-danger">{{this.confirmPasswordError}}</p>
            </div>
            <div class="field">
              <div class="control has-text-centered">
                <label class="checkbox">
                  <input type="checkbox" v-model="termsandpolicy">
                  <a href="javascript:void(0);" @click="openTermsModal">利用規約</a>
                  および<a href="javascript:void(0);" @click="openPolicyModal">プライバシーポリシー</a>に同意します。
                </label>
              </div>
            </div>
            <div class="field">
              <div class="control has-text-centered">
                <button class="button is-primary" :disabled="!canSubmit" @click="signup">登録</button>
              </div>
            </div>
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
const auth = firebase.auth()
import Terms from '~/components/Terms.vue'
import Policy from '~/components/Policy.vue'

export default {
  head() {
    return { title: 'ユーザ新規登録' }
  },
  data() {
    return {
      email: null,
      emailError: null,
      password: null,
      passwordError: null,
      confirmPassword: null,
      confirmPasswordError: null,
      termsandpolicy: null
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
    hasConfirmPasswordInput() {
      return this.confirmPassword != null && this.confirmPassword !== ''
    },
    hasConfirmPasswordError() {
      return this.confirmPasswordError != null
    },
    canSubmit() {
      return (
        this.hasEmailInput &&
        this.hasPasswordInput &&
        this.hasConfirmPasswordInput &&
        !this.hasEmailError &&
        !this.hasPasswordError &&
        !this.hasConfirmPasswordError &&
        this.termsandpolicy
      )
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
      if (this.password != null && this.password !== '') {
        if (!this.validPassword(this.password)) {
          this.passwordError = '7文字以上20文字以内の英数で入力してください。'
        } else {
          this.passwordError = null
        }
      }
      if (this.confirmPassword != null && this.confirmPassword !== '') {
        if (this.password !== this.confirmPassword) {
          this.confirmPasswordError = 'パスワードが一致しません。'
        } else {
          this.confirmPasswordError = null
        }
      }
    },
    validPassword(password) {
      if (password.length < 7 || password.length > 20) {
        return false
      }
      const re = /^[a-zA-Z0-9]*$/
      return re.test(String(password))
    },
    signup() {
      const self = this
      // メールアドレスとパスワードでユーザ作成
      auth
        .createUserWithEmailAndPassword(self.email, self.password)
        .then(function() {
          // 確認メール送信
          const user = auth.currentUser
          user
            .sendEmailVerification()
            .then(function() {
              // トップページに戻る
              self.$router.replace({ path: '/' })
            })
            .catch(function() {})
        })
        .catch(function(error) {
          const errorCode = error.code
          if (errorCode === 'auth/email-already-in-use') {
            self.emailError = '既に登録されているメールアドレスです。'
          } else if (errorCode === 'auth/invalid-email') {
            self.emailError = 'このメールアドレスは使用できません。'
          } else if (errorCode === 'auth/weak-password') {
            self.passwordError = 'パスワードの強度が不十分です。'
          } else if (errorCode != null && errorCode !== '') {
            self.emailError = 'エラーが発生しました。'
          }
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

<style lang="css">
</style>
