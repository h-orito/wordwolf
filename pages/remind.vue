<template lang="html">
  <div>
    <section class="section">
      <div class="container">
        <h1 class="title is-5">パスワード再発行</h1>
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
              <div class="control has-text-centered">
                <button class="button is-primary" :disabled="!canSubmit" @click="remindMail">再発行メール送信</button>
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
    return { title: 'パスワード再発行' }
  },
  data() {
    return {
      email: null,
      emailError: null
    }
  },
  computed: {
    hasEmailInput() {
      return this.email != null && this.email !== ''
    },
    hasEmailError() {
      return this.emailError != null
    },
    canSubmit() {
      return this.hasEmailInput && !this.hasEmailError
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
    remindMail() {
      const self = this
      auth
        .sendPasswordResetEmail(self.email)
        .then(function() {
          self.$router.replace({ path: '/' })
        })
        .catch(function() {
          // 悪用防止のためエラーはハンドリングしない
          self.$router.replace({ path: '/' })
        })
    }
  }
}
</script>

<style lang="css">
</style>
