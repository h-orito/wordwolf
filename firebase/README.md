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

```bash
cd firebase
npx firebase login   # 初回のみ
pnpm deploy:rules    # .firebaserc の default（本番）に反映される
```

開発環境に反映するときは `pnpm deploy:rules --project dev`。

## ローカルでアプリをエミュレータにつなぐ

`firebase.json` をリポジトリ直下にコピーすると、nuxt-vuefire がエミュレータを検出して接続する（コピーしたファイルはコミットしない）。
