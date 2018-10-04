<template lang="html">
  <div>
    <section class="section">
      <div class="container">
        <h1 class="title is-5">ログイン</h1>
        <div class="columns">
          <div class="column">
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
              <div class="control has-text-centered">
                <button class="button is-primary" :disabled="!canSubmit" @click="signin">ログイン</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import firebase from '~/plugins/firebase'
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
      passwordError: null
    }
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
    }
  }
}
</script>

<style lang="css">
</style>
