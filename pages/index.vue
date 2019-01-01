<template lang="html">
  <div>
    <section class="section">
      <div class="container">
        <h1 class="title is-5">必要なのはブラウザだけ</h1>
        <div class="columns">
          <div class="column">
            <p class="content">ワードウルフオンラインはワードウルフが無料・専用アプリ不要で気軽に遊べるサービスです。</p>
            <nuxt-link class="button is-primary" :to="{ path: 'intro' }">ワードウルフとは</nuxt-link>
          </div>
        </div>
      </div>
    </section>
    <section class="section has-background-light">
      <div class="container">
        <div v-if="!isLogin">
          <h1 class="title is-5">はじめる</h1>
          <nuxt-link class="button is-primary" :to="{ path: 'signup' }">新規登録</nuxt-link>
          <nuxt-link class="button is-primary" :to="{ path: 'signin' }">ログイン</nuxt-link> 
        </div>
        <div v-if="isLogin">
          <h1 class="title is-5">ようこそ</h1>
          <p class="content">{{ user.email }} さん</p>
          <nuxt-link class="button is-primary" :to="{ path: 'user' }">ユーザ情報編集</nuxt-link>
          <button class="button" @click="logout">ログアウト</button>
          <div v-if="isLogin && !user.emailVerified" class="notification is-warning is-size-7" style="margin-top: 1.5rem;">
            部屋の作成やゲームへの参加にはメール認証が必要です。メールをご確認ください。送信されていない場合は「ユーザ情報編集」から再送してください。<br>
          </div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <h1 class="title is-5">部屋一覧</h1>
        <p class="content" v-if="rooms.length == 0">現在部屋がありません。</p><br>
        <table v-if="rooms.length > 0" class="table is-striped is-fullwidth is-size-7">
          <thead>
            <tr>
              <th>部屋名</th>
              <th>人数</th>
              <th>状態</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="room in rooms" 
              :key="room['key']">
              <td>
                <nuxt-link :to="{ path: 'room', query: { id: room.key }}">{{ room.name }}</nuxt-link>
              </td>
              <td>{{ room['membersNum'] }}人</td>
              <td>{{ getStatusName(room['status']) }}</td>
            </tr>
          </tbody>
        </table>
        <nuxt-link
          class="button is-primary"
          v-if="isLogin && user.emailVerified" 
          to="/create-room">部屋を作成</nuxt-link>
      </div>
    </section>
    <section class="section has-background-light">
      <div class="container">
        <h1 class="title is-5">その他情報</h1>
        <div class="columns">
          <div class="column">
            <ul class="content has-text-left is-size-7" style="list-style: inside;">
              <li>ワードウルフは<a href="https://twitter.com/kawasakifactory" target="_blank">川崎晋</a>様が考案されたゲームです</li>
              <li>要望、改善提案、不具合報告はTwitter<a href="https://twitter.com/ort_dev" target="_blank">@ort_dev</a>へお願いします</li>
              <li>投げ銭いただける方は<a href="javascript:void(0);" @click="openKampaModal">こちら</a>からお願いします</li>
            </ul>
          </div>
        </div>
        <div class="modal" id="kampa-modal">
          <div class="modal-background"></div>
          <div class="modal-content">
            <div class="box">
              <h4 class="is-size-5">投げ銭について</h4>
              <ul class="is-size-7 content">
                <li>Amazonギフトカードによる投げ銭（15円〜、手数料なし）になります。</li>
                <li>Kampa!というサービスを利用することで、個人情報をやりとりすることなくAmazonギフトカードで投げ銭することができます。</li>
                <li>投げ銭していただける方は下記手順にてお願いします。
                  <br>
                  <ol>
                    <li>最下段の「Amazonギフトカードで投げ銭」よりKampa!サイトへ遷移</li>
                    <li>表示されたページのメールアドレスをコピーし、Kampa!ボタンをクリック</li>
                    <li>「金額」に投げ銭していただける金額を入力、「受取人」にコピーしたメールアドレスを貼り付けし、購入 （応援メッセージをいただけると喜びます）</li>
                  </ol>
                </li>
                <li
                  class="has-text-danger"
                >Amazonページ遷移時、デフォルトは10,000円に設定されており、 Amazonにログインしている場合は贈り主に氏名が自動入力されているようなのでご注意ください。※金額は15円〜で設定可能です。</li>
              </ul>
              <h4 class="is-size-5">補足</h4>
              <ul class="is-size-7 content">
                <li>頂いた投げ銭はサーバ維持費用など当サイト運営目的にのみ使用します。</li>
                <li>
                  頂いた改善提案、ご要望については投げ銭の有無に関係なく積極的に取り入れていくので、Twitter
                  <a
                    href="https://twitter.com/ort_dev"
                    target="_blank"
                  >@ort_dev</a>までお願いします。
                </li>
              </ul>
              <a
                href="http://kampa.me/t/lxc"
                target="_blank"
                class="button is-primary"
              >Amazonギフトカードで投げ銭する</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { LOGINOUT } from '~/store/action-types'
import { INIT_ROOMS } from '../store/action-types'
import * as consts from '~/store/consts'
import firebase from '~/plugins/firebase'
const auth = firebase.auth()
export default {
  head() {
    return { title: 'ワードウルフオンライン', titleTemplate: '' }
  },
  data() {
    return {}
  },
  computed: {
    rooms() {
      return this.$store.getters.getRooms
    },
    user() {
      return this.$store.getters.getUser
    },
    isLogin() {
      return this.$store.getters.isLogin
    }
  },
  async fetch({ store }) {
    return await store.dispatch(INIT_ROOMS)
  },
  created: function() {
    firebase.auth().onAuthStateChanged(user => {
      this.$store.dispatch(LOGINOUT, {
        user: user
      })
    })
  },
  methods: {
    isCreator(roomCreator) {
      return this.user != null && this.user.uid === roomCreator
    },
    openKampaModal() {
      var modal = document.querySelector('#kampa-modal')
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
    logout() {
      auth.signOut()
    },
    getStatusName(status) {
      return consts.VILLAGE_STATUS_MAP[status]
    }
  }
}
</script>

<style lang="css">
</style>
