# Firebase ルール

Firestore と Realtime Database のセキュリティルールをここで管理する。

## テスト

エミュレータ上でルールのテストを実行する（Java が必要）。

```bash
cd firebase
pnpm install
pnpm test
```

## 本番への反映

**アプリ（Netlify）のデプロイが終わってから**ルールを反映する。旧クライアントは退出時に「メンバー削除 → ルームの人数更新」の順で書き込むため、新しいルールでは人数の更新が拒否される。開いたままのタブは再読み込みされるまで旧クライアントのまま。

```bash
cd firebase
npx firebase login   # 初回のみ
pnpm deploy:rules    # .firebaserc の default（本番）に反映される
```

開発環境に反映するときは `pnpm deploy:rules --project dev`。

## ローカルでアプリをエミュレータにつなぐ

`firebase.json` をリポジトリ直下にコピーすると、nuxt-vuefire がエミュレータを検出して接続する（コピーしたファイルはコミットしない）。

## ルールで防げないこと

ゲームの進行をクライアントが担っており、Realtime Database のルールからは Firestore のメンバー情報を参照できないため、次のことはルールだけでは防げない。サーバー側の処理（Cloud Functions など）が必要。

- パスワード付きルームのメッセージ・メンバーは、パスワードを知らなくても読める
- システムメッセージ（name が空）は、ログインしていれば誰でもどのルームにも書ける
- ルームの投票はログインしていれば誰でも全削除できる
- 役職とお題はルームのドキュメントに含まれており、参加者から読める
- ルームのメンバーはゲームの状態（status・winCamp など）を書き換えられる
