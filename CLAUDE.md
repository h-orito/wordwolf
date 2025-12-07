# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

ワードウルフオンライン - オンラインでワードウルフ（ワード人狼）を遊べるWebアプリケーション。

## 開発コマンド

```bash
# 依存関係インストール
npm install

# 開発サーバー起動 (localhost:3000)
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start

# 静的サイト生成
npm run generate

# ESLint実行
npm run lint

# ESLint自動修正
npm run lintfix
```

## 技術スタック

- **フレームワーク**: Nuxt.js 2.12 (Vue.js 2系)
- **CSSフレームワーク**: Bulma
- **バックエンド**: Firebase (Firestore + Realtime Database)
- **状態管理**: Vuex + vuexfire
- **アイコン**: Font Awesome

## アーキテクチャ

### Firebaseデータ構造
- **Firestore `rooms` コレクション**: ゲームルームの永続データ（ルーム設定、メンバー、勝敗結果）
- **Realtime Database `messages/{roomKey}/`**: リアルタイムチャットメッセージ
- **Realtime Database `votes/{roomKey}/`**: 投票データ（リアルタイム同期）

### Vuexモジュール構成 (`store/modules/`)
- `rooms.js`: ルーム管理（作成、状態遷移、投票処理）- 最も重要なビジネスロジック
- `members.js`: メンバー管理
- `messages.js`: チャット機能
- `votes.js`: 投票管理
- `auth.js`: Firebase認証
- `master.js`: マスターデータ

### ゲームステータス遷移 (`store/consts.js`)
PROLOGUE（開始前）→ PREPARE（準備）→ PROGRESS（進行中）→ 投票 → COUNTER（カウンター）または EPILOGUE（終了）

### ページ構成
- `index.vue`: トップページ、ルーム一覧
- `create-room.vue`: ルーム作成
- `room.vue`: ゲームプレイ画面（メイン）
- `room-list.vue`: ルーム検索
- `signin.vue`: 認証

### コンポーネント (`components/room/`)
ルーム内の各フェーズに対応したコンポーネント：Prepare, Progress, Counter, Chat, Members等

## コードスタイル

- ESLint + Prettier (セミコロンなし、シングルクォート)
- Vue ESLint essential ルール適用

---

## 🚨 現在進行中: Nuxt 4 移行作業

**重要**: このプロジェクトは現在 Nuxt 2 から Nuxt 4 への移行作業中です。

### 移行計画
`migration-plan.md` に詳細な移行計画があります。作業はこの計画に沿って進めてください。

### 移行の主な変更点
- Nuxt 2.12 → Nuxt 4
- Vue 2 → Vue 3
- Vuex + vuexfire → Pinia + VueFire 3
- Firebase 7 → Firebase 10+ (Modular API)
- Options API → Composition API

### 作業時の注意事項
1. 各Phaseを順番に実施すること
2. 機能・UIは変更せず、フレームワーク移行のみに集中
3. 移行完了後に `migration-plan.md` のチェックリストを更新すること
4. エラーが発生した場合は原因を特定し、計画を見直すこと
