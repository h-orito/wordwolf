<template>
  <div>
    <section class="section">
      <div class="container">
        <h1 class="title is-5">必要なのはブラウザだけ</h1>
        <div class="columns">
          <div class="column">
            <p class="content">
              ワードウルフオンラインはワードウルフが無料・専用アプリ不要で気軽に遊べるサービスです。
            </p>
            <NuxtLink class="button is-primary" :to="{ path: '/intro' }">
              ワードウルフとは
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
    <section class="section has-background-light">
      <div class="container">
        <div v-if="!isLogin">
          <h1 class="title is-5">はじめる</h1>
          <p class="content">参加/部屋の作成にはログインが必要です。</p>
          <NuxtLink class="button is-primary" :to="{ path: '/signin' }">
            ログイン
          </NuxtLink>
        </div>
        <div v-if="isLogin">
          <h1 class="title is-5">ようこそ</h1>
          <p v-if="user?.email" class="content">{{ user.email }} さん</p>
          <NuxtLink
            v-if="user?.email"
            class="button is-primary"
            :to="{ path: '/user' }"
          >
            ユーザ情報編集
          </NuxtLink>
          <button class="button" @click="logout">ログアウト</button>
          <div
            v-if="isLogin && user?.email && !user.emailVerified"
            class="notification is-warning is-size-7"
            style="margin-top: 1.5rem;"
          >
            部屋の作成やゲームへの参加にはメール認証が必要です。メールをご確認ください。送信されていない場合は「ユーザ情報編集」から再送してください。<br />
          </div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <h1 class="title is-5">部屋一覧</h1>
        <p class="content" v-if="rooms.length === 0">現在部屋がありません。</p>
        <br />
        <table
          v-if="rooms.length > 0"
          class="table is-striped is-fullwidth is-size-7"
        >
          <thead>
            <tr>
              <th class="has-text-left">部屋名</th>
              <th>作成者</th>
              <th>人数</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="room in rooms" :key="room.key">
              <td class="has-text-left">
                <span
                  v-if="room.roomPassword != null && room.roomPassword !== ''"
                  class="fas fa-key"
                ></span>
                <span
                  v-if="room.roomRating === 'R15' || room.roomRating === 'R18'"
                  class="tag reverse-danger"
                >{{ room.roomRating }}</span>
                <NuxtLink :to="{ path: '/room', query: { id: room.key } }">
                  {{ room.name }}
                </NuxtLink>
              </td>
              <td>{{ room.creatorName }}</td>
              <td>{{ room.membersNum }}人</td>
            </tr>
          </tbody>
        </table>
        <NuxtLink
          class="button is-primary"
          v-if="canCreateRoom"
          to="/create-room"
        >
          部屋を作成
        </NuxtLink>
        <div style="margin-top: 15px;">
          <NuxtLink to="/room-list">終了した部屋を見る</NuxtLink>
        </div>
      </div>
    </section>
    <section class="section has-background-light">
      <div class="container">
        <h1 class="title is-5">よくある質問</h1>
        <div class="columns">
          <div class="column">
            <NuxtLink class="button is-primary" :to="{ path: '/faq' }">
              よくある質問を見る
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <h1 class="title is-5">更新情報</h1>
        <div class="columns">
          <div class="column">
            <ul
              class="content has-text-left is-size-7"
              style="list-style: inside;"
            >
              <li>2021/05/22 匿名ログインできるように変更</li>
            </ul>
            <NuxtLink class="button is-primary" :to="{ path: '/release-note' }">
              過去の更新情報を見る
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
    <section class="section has-background-light">
      <div class="container">
        <h1 class="title is-5">その他情報</h1>
        <div class="columns">
          <div class="column">
            <ul
              class="content has-text-left is-size-7"
              style="list-style: inside;"
            >
              <li>
                ワードウルフは<a
                  href="https://twitter.com/kawasakifactory"
                  target="_blank"
                >川崎晋</a>様が考案したゲームです
              </li>
              <li>
                要望、改善提案、不具合報告はTwitter<a
                  href="https://twitter.com/ort_dev"
                  target="_blank"
                >@ort_dev</a>へお願いします
              </li>
              <li>
                投げ銭いただける方は<a
                  href="javascript:void(0);"
                  @click="openKampaModal"
                >こちら</a>からお願いします
              </li>
              <li>
                <a href="javascript:void(0);" @click="openTermsModal">利用規約</a>
              </li>
              <li>
                <a href="javascript:void(0);" @click="openPolicyModal">プライバシーポリシー</a>
              </li>
            </ul>
          </div>
        </div>
        <div class="modal" id="kampa-modal">
          <div class="modal-background" @click="closeKampaModal"></div>
          <div class="modal-content">
            <div class="box">
              <h4 class="is-size-5">投げ銭について</h4>
              <ul class="is-size-7 content">
                <li>
                  投げ銭いただける方は、下記Amazonほしい物リストからお願いします。
                </li>
                <li>
                  改善提案、ご要望については投げ銭の有無に関係なく積極的に取り入れていくので、Twitter
                  <a href="https://twitter.com/ort_dev" target="_blank">@ort_dev</a>
                  までお願いします。
                </li>
              </ul>
              <a
                href="https://www.amazon.jp/hz/wishlist/ls/1KZSJAJS1ETW4?ref_=wl_share"
                target="_blank"
                class="button is-primary"
              >Amazonほしい物リストを送る</a>
            </div>
          </div>
        </div>
      </div>
    </section>
    <div class="modal" id="terms-modal">
      <div class="modal-background" @click="closeTermsModal"></div>
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
      <div class="modal-background" @click="closePolicyModal"></div>
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

<script setup lang="ts">
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { useAuthStore } from '~/stores/auth'
import { useRoomsStore } from '~/stores/rooms'

useHead({
  title: 'ワードウルフオンライン',
  titleTemplate: ''
})

const auth = useFirebaseAuth()!
const authStore = useAuthStore()
const roomsStore = useRoomsStore()

// computed
const user = computed(() => authStore.user)
const isLogin = computed(() => authStore.isLogin)
const rooms = computed(() => roomsStore.rooms)
const canCreateRoom = computed(() => {
  if (!isLogin.value) return false
  return !user.value?.email || user.value.emailVerified
})

// fetch rooms
await roomsStore.initRooms()

// watch auth state
onMounted(() => {
  onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      authStore.login(firebaseUser)
    } else {
      authStore.logout()
    }
  })
})

// methods
function logout() {
  signOut(auth)
}

function openKampaModal() {
  const modal = document.querySelector('#kampa-modal')
  const html = document.querySelector('html')
  modal?.classList.add('is-active')
  html?.classList.add('is-clipped')
}

function closeKampaModal() {
  const modal = document.querySelector('#kampa-modal')
  const html = document.querySelector('html')
  modal?.classList.remove('is-active')
  html?.classList.remove('is-clipped')
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

<style lang="css">
.reverse-danger {
  border: 1px solid #ff3860;
  color: #ff3860 !important;
  background-color: #ffffff !important;
  padding: 5px !important;
}
</style>
