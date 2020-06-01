<template lang="html">
  <div>
    <section class="section">
      <div class="container">
        <h1 class="title is-5">ユーザ情報編集</h1>
        <div class="columns">
          <div class="column">
            <div>
              <hr>
              <h2 class="title is-6">パスワード変更</h2>
              <div class="notification is-size-7">
                メールアドレス / パスワードの組み合わせは他サービスで利用していないものにしてください。
              </div>
              <div class="field">
                <label class="label">旧パスワード</label>
                <div class="control has-icons-left has-icons-right">
                  <input class="input" :class="!hasOldPasswordInput ? '' : hasOldPasswordError ? 'is-danger': 'is-success'"
                    type="password" placeholder="Old Password" v-model="oldPassword" @keyup="validatePassword">
                  <span class="icon is-small is-left">
                    <i class="fas fa-key"></i>
                  </span>
                  <span v-if="hasOldPasswordInput" class="icon is-small is-right">
                    <i v-if="hasOldPasswordError" class="fas fa-exclamation-triangle"></i>
                    <i v-if="!hasOldPasswordError" class="fas fa-check"></i>
                  </span>
                </div>
                <p class="help is-danger">{{this.oldPasswordError}}</p>
              </div>
              <div class="field">
                <label class="label">新パスワード</label>
                <div class="control has-icons-left has-icons-right">
                  <input class="input" :class="!hasPasswordInput ? '' : hasPasswordError ? 'is-danger': 'is-success'"
                    type="password" placeholder="New Password" v-model="password" @keyup="validatePassword">
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
                <label class="label">新パスワード（確認）</label>
                <div class="control has-icons-left has-icons-right">
                  <input class="input" :class="!hasConfirmPasswordInput ? '' : hasConfirmPasswordError ? 'is-danger': 'is-success'"
                    type="password" placeholder="New Password" v-model="confirmPassword" @keyup="validatePassword">
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
                  <button class="button is-primary" :disabled="!canChangePasswordSubmit" @click="changePassword">パスワード変更</button>
                </div>
              </div>
            </div>
            <div>
              <hr>
              <h2 class="title is-6">退会</h2>
              <div class="field">
                <div class="control has-text-centered">
                  <button class="button is-danger" @click="deleteUser">退会する</button>
                </div>
              </div>
            </div>
          </div>
          <div class="column" v-if="user != null && !user.emailVerified">
            <hr>
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

<script>
import firebase from '~/plugins/firebase'
export default {
  head() {
    return { title: 'ユーザ情報編集' }
  },
  data() {
    return {
      oldPassword: null,
      oldPasswordError: null,
      password: null,
      passwordError: null,
      confirmPassword: null,
      confirmPasswordError: null
    }
  },
  computed: {
    user() {
      return this.$store.getters.getUser
    },
    isLogin() {
      return this.$store.getters.isLogin
    },
    hasOldPasswordInput() {
      return this.oldPassword != null && this.oldPassword !== ''
    },
    hasOldPasswordError() {
      return this.oldPasswordError != null
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
    canChangePasswordSubmit() {
      return (
        this.hasOldPasswordInput &&
        this.hasPasswordInput &&
        this.hasConfirmPasswordInput &&
        !this.hasOldPasswordError &&
        !this.hasPasswordError &&
        !this.hasConfirmPasswordError
      )
    },
    isUserNotVerified() {
      return this.user != null && !this.user.emailVerified
    }
  },
  methods: {
    validatePassword() {
      if (this.oldPassword != null && this.oldPassword !== '') {
        if (!this.validPassword(this.oldPassword)) {
          this.oldPasswordError =
            '7文字以上20文字以内の英数で入力してください。'
        } else {
          this.oldPasswordError = null
        }
      }
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
    changePassword() {
      const self = this
      const credential = firebase.auth.EmailAuthProvider.credential(
        this.user.email,
        this.oldPassword
      )
      this.user
        .reauthenticateAndRetrieveDataWithCredential(credential)
        .then(function() {
          self.user
            .updatePassword(self.password)
            .then(function() {
              // トップページに戻る
              self.$router.replace({ path: '/' })
            })
            .catch(function() {
              self.passwordError = 'エラーが発生しました。'
            })
        })
        .catch(function() {
          self.oldPasswordError = '旧パスワードが正しくありません。'
        })
    },
    resendVerifyMail() {
      const self = this
      this.user
        .sendEmailVerification()
        .then(function() {
          // トップページに戻る
          self.$router.replace({ path: '/' })
        })
        .catch(function() {})
    },
    deleteUser() {
      if (
        !window.confirm(
          '本当に退会しますか？ユーザが削除され、元に戻せません。'
        )
      ) {
        return
      }
      const self = this
      firebase
        .auth()
        .currentUser.delete()
        .then(function() {
          self.$router.replace({ path: '/' })
        })
        .catch(function() {})
    }
  }
}
</script>

<style lang="css">
</style>
