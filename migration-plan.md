# ワードウルフオンライン Nuxt 4 移行計画

## 現状分析

### 現在のバージョン
- **Nuxt.js**: 2.12.2 (EOL: 2024年6月30日)
- **Vue.js**: 2系 (Nuxt 2経由)
- **Firebase**: 7.14.0
- **状態管理**: Vuex + vuexfire

### 脆弱性サマリ
```
205 vulnerabilities (14 low, 105 moderate, 65 high, 21 critical)
```

### コードベース規模
- ソースファイル数: 約71ファイル (.vue, .js)
- ページ数: 10ページ
- コンポーネント数: 12コンポーネント
- Vuexモジュール数: 6モジュール

---

## 移行戦略

### 推奨パス: Nuxt 2 → Nuxt 4 (直接移行)

公式の推奨パスは「Nuxt 2 → Nuxt 3 → Nuxt 4」ですが、Nuxt 3→4の差分は小さいため、直接Nuxt 4へ移行します。

**主な変更点:**
1. **Vue 2 → Vue 3**: Options API → Composition API (段階的移行可能)
2. **Vuex → Pinia**: 状態管理の移行
3. **vuexfire → VueFire 3**: Firebaseバインディングの移行
4. **Firebase 7 → Firebase 10+**: Modular API採用
5. **ディレクトリ構造**: `app/` ディレクトリベースの新構造（オプション）

---

## 段階的移行計画

### Phase 1: 準備作業

**1.1 バックアップ**
```bash
git tag v1.0-nuxt2-backup
```

**1.2 Node.js確認**
- 要件: Node.js 18.20以上（現在23.7.0なので問題なし）

---

### Phase 2: 既存プロジェクトのNuxt 4化

**2.1 クリーンアップ**
```bash
# node_modules と package-lock.json を削除
rm -rf node_modules package-lock.json

# Nuxt 2 の生成物を削除
rm -rf .nuxt dist
```

**2.2 旧設定ファイルの削除/リネーム**
```bash
# 旧設定ファイルをバックアップ
mv nuxt.config.js nuxt.config.js.bak
mv .eslintrc.js .eslintrc.js.bak
```

**2.3 package.json を書き換え**
```json
{
  "name": "wordwolf",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  },
  "dependencies": {
    "@fortawesome/fontawesome-free": "^6.5.1",
    "bcryptjs": "^2.4.3",
    "bulma": "^1.0.0",
    "firebase": "^10.8.0",
    "nuxt": "^4.0.0",
    "vuefire": "^3.1.0"
  },
  "devDependencies": {
    "@nuxt/eslint": "^0.5.0",
    "sass": "^1.71.0"
  }
}
```

**2.4 依存関係のインストール**
```bash
npm install
```

**2.5 Nuxt 4 の初期ファイル作成**
```bash
# app.vue を作成（Nuxt 4のエントリーポイント）
touch app.vue
```

`app.vue`:
```vue
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

---

### Phase 3: 設定ファイルの移行

**3.1 nuxt.config.ts**
```typescript
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  app: {
    head: {
      titleTemplate: 'ワードウルフオンライン | %s',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          hid: 'description',
          name: 'description',
          content: 'ワードウルフ、ワード人狼をオンラインで遊べるサービスです。'
        }
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
    }
  },

  css: [
    'bulma/css/bulma.css',
    '@fortawesome/fontawesome-free/css/all.css',
    '~/assets/main.scss'
  ],

  modules: [
    'vuefire/nuxt'
  ],

  vuefire: {
    config: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.FIREBASE_DATABASEURL,
      projectId: process.env.FIREBASE_PROJECTID,
      storageBucket: process.env.FIREBASE_STORAGEBUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGINGSENDERID
    }
  },

  runtimeConfig: {
    public: {
      // 公開設定
    }
  }
})
```

---

### Phase 4: Firebase/VueFire 3の設定

**4.1 composables/useFirebase.ts**
```typescript
import { useFirestore, useDatabase } from 'vuefire'
import { collection, doc, query, where, orderBy } from 'firebase/firestore'
import { ref as dbRef } from 'firebase/database'

export const useRooms = () => {
  const db = useFirestore()
  const roomsRef = collection(db, 'rooms')

  const activeRoomsQuery = query(
    roomsRef,
    where('isComplete', '==', false),
    orderBy('createdAt', 'desc')
  )

  return { roomsRef, activeRoomsQuery }
}

export const useMessages = (roomKey: string) => {
  const database = useDatabase()
  const messagesRef = dbRef(database, `messages/${roomKey}`)
  return { messagesRef }
}

export const useVotes = (roomKey: string) => {
  const database = useDatabase()
  const votesRef = dbRef(database, `votes/${roomKey}`)
  return { votesRef }
}
```

---

### Phase 5: Vuex → Pinia移行

**5.1 stores/rooms.ts（例）**
```typescript
import { defineStore } from 'pinia'
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore'
import { useFirestore } from 'vuefire'

export const useRoomsStore = defineStore('rooms', {
  state: () => ({
    rooms: [] as Room[],
    oldRooms: [] as Room[],
    room: null as Room | null
  }),

  actions: {
    async initRooms() {
      const db = useFirestore()
      const roomsRef = collection(db, 'rooms')
      const q = query(
        roomsRef,
        where('isComplete', '==', false),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      this.rooms = snapshot.docs.map(doc => doc.data() as Room)
    },

    async initRoom(roomKey: string) {
      const db = useFirestore()
      const roomDoc = doc(db, 'rooms', roomKey)
      const snapshot = await getDoc(roomDoc)
      this.room = snapshot.data() as Room
    }

    // 他のアクションも同様に移行...
  }
})
```

**5.2 リアルタイムバインディング（Composition API使用）**
```typescript
// pages/room.vue での使用例
<script setup lang="ts">
import { useDocument, useCollection, useDatabaseList } from 'vuefire'
import { doc, collection } from 'firebase/firestore'
import { ref as dbRef } from 'firebase/database'

const route = useRoute()
const roomKey = route.query.id as string

// Firestore リアルタイム購読
const db = useFirestore()
const roomRef = doc(db, 'rooms', roomKey)
const { data: room } = useDocument(roomRef)

// Realtime Database リアルタイム購読
const database = useDatabase()
const messagesRef = dbRef(database, `messages/${roomKey}`)
const { data: messages } = useDatabaseList(messagesRef)
</script>
```

---

### Phase 6: コンポーネント移行

**6.1 Options API → Composition APIへの変換パターン**

**Before (Nuxt 2 / Options API):**
```vue
<script>
export default {
  data() {
    return {
      roomKey: '',
      leftTime: 0
    }
  },
  computed: {
    user() {
      return this.$store.getters.getUser
    },
    room() {
      return this.$store.getters.getRoom
    }
  },
  methods: {
    async joinRoom() {
      await this.$store.dispatch('ADD_MEMBER', { ... })
    }
  },
  mounted() {
    this.roomKey = this.$route.query.id
  }
}
</script>
```

**After (Nuxt 4 / Composition API):**
```vue
<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useRoomsStore } from '~/stores/rooms'

const route = useRoute()
const authStore = useAuthStore()
const roomsStore = useRoomsStore()

// data
const roomKey = ref(route.query.id as string)
const leftTime = ref(0)

// computed
const user = computed(() => authStore.user)
const room = computed(() => roomsStore.room)

// methods
const joinRoom = async () => {
  await roomsStore.addMember({ ... })
}

// mounted
onMounted(() => {
  roomKey.value = route.query.id as string
})
</script>
```

**6.2 テンプレートの変更点**
- `<nuxt-link>` → `<NuxtLink>`
- `$route` → `useRoute()`
- `$router` → `useRouter()`
- `$store` → Piniaストアを直接import

---

### Phase 7: ページごとの移行

移行順序（依存関係と複雑さを考慮）:

| 順序 | ページ | 複雑度 | 備考 |
|------|--------|--------|------|
| 1 | intro.vue | 低 | 静的ページ |
| 2 | faq.vue | 低 | 静的ページ |
| 3 | release-note.vue | 低 | 静的ページ |
| 4 | signin.vue | 中 | Firebase Auth |
| 5 | user.vue | 中 | 認証必要 |
| 6 | remind.vue | 中 | 認証必要 |
| 7 | index.vue | 中 | ルーム一覧表示 |
| 8 | create-room.vue | 中 | Firestore書き込み |
| 9 | room-list.vue | 中 | ルーム検索 |
| 10 | room.vue | 高 | メインゲーム画面 |

---

### Phase 8: コンポーネントの移行

| コンポーネント | 複雑度 | 依存関係 |
|---------------|--------|----------|
| NavBar.vue | 低 | 認証状態 |
| Footer.vue | 低 | なし |
| Terms.vue | 低 | なし |
| Policy.vue | 低 | なし |
| GoogleAds.vue | 低 | なし |
| room/Members.vue | 中 | Props受け取り |
| room/Chat.vue | 中 | Realtime Database |
| room/Prepare.vue | 中 | ゲーム状態 |
| room/Progress.vue | 中 | 投票、タイマー |
| room/Counter.vue | 中 | ゲーム状態 |
| room/Proepi.vue | 中 | ゲーム状態 |
| room/Reset.vue | 低 | ゲーム状態 |

---

## 作業チェックリスト

### 事前準備
- [x] gitでタグ付けバックアップ
- [x] node_modules, package-lock.json, .nuxt, dist 削除
- [x] nuxt.config.js, .eslintrc.js をバックアップ
- [x] package.json 書き換え
- [x] pnpm install (pnpmに変更)
- [x] app.vue 作成

### 設定・インフラ
- [x] nuxt.config.ts作成
- [x] Firebase/VueFire設定 (nuxt-vuefire使用)
- [x] 環境変数(.env)設定
- [x] ESLint設定 (@nuxt/eslint使用)
- [x] Sass/Bulma設定
- [x] tsconfig.json作成

### 状態管理
- [x] Piniaセットアップ (@pinia/nuxt使用)
- [x] stores/types.ts作成 (型定義)
- [x] stores/consts.ts作成 (定数)
- [x] stores/auth.ts作成
- [x] stores/rooms.ts作成
- [x] stores/members.ts作成
- [x] stores/messages.ts作成
- [x] stores/votes.ts作成
- [x] stores/master.ts作成

### 共通コンポーネント
- [x] layouts/default.vue作成
- [x] components/NavBar.vue移行
- [ ] components/Footer.vue移行
- [x] components/Terms.vue移行
- [x] components/Policy.vue移行
- [x] components/GoogleAds.vue移行

### ページ移行
- [x] pages/index.vue移行
- [x] pages/intro.vue移行
- [x] pages/faq.vue移行
- [x] pages/release-note.vue移行
- [x] pages/signin.vue移行
- [x] pages/user.vue移行
- [x] pages/remind.vue移行
- [x] pages/create-room.vue移行
- [x] pages/room-list.vue移行
- [x] pages/room.vue移行

### ゲームコンポーネント
- [x] components/room/Members.vue移行
- [x] components/room/Chat.vue移行
- [x] components/room/Prepare.vue移行
- [x] components/room/Progress.vue移行
- [x] components/room/Counter.vue移行
- [x] components/room/Proepi.vue移行
- [x] components/room/Reset.vue移行

### 動作確認
- [ ] 認証フロー確認
- [ ] ルーム作成確認
- [ ] メンバー参加確認
- [ ] チャット送信確認
- [ ] 投票機能確認
- [ ] ゲーム進行確認
- [x] pnpm run build成功
- [ ] pnpm audit脆弱性確認

---

## リスクと対策

| リスク | 影響度 | 対策 |
|--------|--------|------|
| VueFire 3のAPIがvuexfireと大きく異なる | 高 | Composition APIベースで書き直し |
| Options API→Composition API変換の工数 | 高 | 段階的に移行、まずは動作優先 |
| Bulmaの互換性 | 低 | Bulma自体はCSS Frameworkなので互換性問題は少ない |
| Firebase Modular APIへの移行 | 中 | VueFire 3が内部でハンドル |
| Google Analytics設定 | 低 | `@nuxtjs/gtm`または`vue-gtag`に置き換え |

---

## 工数見積もり

| Phase | 内容 | 見積もり |
|-------|------|----------|
| Phase 1-3 | プロジェクト初期化・設定 | 小 |
| Phase 4 | Firebase/VueFire設定 | 小 |
| Phase 5 | Vuex→Pinia移行 | 中〜大 |
| Phase 6-7 | ページ移行 | 大 |
| Phase 8 | コンポーネント移行 | 中 |
| テスト・修正 | 動作確認・バグ修正 | 中 |

---

## 参考リンク

- [Nuxt 4 公式ドキュメント](https://nuxt.com/docs/4.x/getting-started/upgrade)
- [Nuxt 4 アナウンス](https://nuxt.com/blog/v4)
- [VueFire v2→v3 移行ガイド](https://vuefire.vuejs.org/cookbook/migration-v2-v3.html)
- [Vuex→Pinia移行ガイド](https://pinia.vuejs.org/cookbook/migration-vuex.html)
- [Nuxt 4 移行ガイド (MasteringNuxt)](https://masteringnuxt.com/blog/complete-guide-how-to-upgrade-to-nuxt-4)

---

## 備考

### Options APIの維持について
Vue 3/Nuxt 4でもOptions APIは引き続きサポートされています。段階的な移行として、最初はOptions APIのままコンポーネントを移行し、後からComposition APIにリファクタリングする方法も可能です。ただし、VueFire 3はComposition APIベースのため、Firebaseとのバインディング部分はComposition APIで書く必要があります。

### 代替案: Nuxt 2のまま依存パッケージのみ更新
Nuxt 4への移行が工数的に難しい場合、Nuxt 2.18 + Firebase 10 Compat APIで脆弱性を大幅に軽減する選択肢もあります。ただしNuxt 2自体がEOLのため、長期的にはNuxt 4への移行が推奨されます。

### 既存プロジェクト内での移行について
このプロジェクトでは別ディレクトリを作成せず、既存のディレクトリ内で直接Nuxt 4に移行します。
- `pages/`, `components/`, `store/`, `assets/` などのディレクトリはそのまま利用
- 各 `.vue` ファイルは順次 Composition API に書き換え
- 旧設定ファイル（`nuxt.config.js`, `.eslintrc.js`）はバックアップ後に新形式で再作成
