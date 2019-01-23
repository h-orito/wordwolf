<template lang="html">
  <div>
    <section class="section">
      <div class="container">
        <h1 class="title is-5">FAQ</h1>
        <div class="columns">
          <div class="column">
            <p class="content">よくある質問</p>
          </div>
        </div>
      </div>
    </section>
    <section class="section has-background-light">
      <div class="container">
        <p class="content">Q. 部屋に入っても参加できません。どうやったら参加できますか？
          <br>A. ユーザ登録とメール認証が必要です。
          <br>「新規登録」からユーザ登録するとメールが届くので記載されているURLにアクセスしてください。
          <br>その後ログインした状態で部屋に入ると参加することができます。（ゲーム中は参加できません）
        </p>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <p class="content">Q. 人狼の人数って増やせないんですか？
          <br>A. 現状1名固定です。
        </p>
      </div>
    </section>
    <section class="section has-background-light">
      <div class="container">
        <p class="content">Q. 1部屋の最大人数は何人ですか？
          <br>A. 制限はありませんが、10人目以降はチャットの色がシステムメッセージと同じになってしまいます。
        </p>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <p class="content">Q. 全員投票しても先に進みません。
          <br>A. 参加者の通信状況次第で進まないことがあります。
          <br>お手数ですがゲームマスターもしくは部屋主が「投票を打ち切る」ボタンを押して進めてください。
        </p>
      </div>
    </section>
    <section class="section has-background-light">
      <div class="container">
        <p class="content">Q. 寝落ちした人がいて先に進めなくなりました。
          <br>A. 部屋主の方が「リセット」ボタンを押してゲーム前の状態に戻してください。
          <br>進行中であればゲームマスターもしくは部屋主が「投票を打ち切る」ボタンを押すことで先に進むこともできます。
        </p>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <p class="content">Q. どうやってもゲームが進まなくなりました。
          <br>A. お手数ですが部屋主の方が「リセット」ボタンを押してゲーム前の状態に戻してください。
        </p>
      </div>
    </section>
    <section class="section has-background-light">
      <div class="container">
        <p class="content">Q. 変な人が入ってきて部屋を荒らされています。
          <br>A. 部屋主の方は参加者を追い出すことができます。追い出された人はその部屋には参加できなくなります。
          <br>ひどいようであれば<a href="https://twitter.com/ort_dev" target="_blank">@ort_dev</a>へ報告をお願いします。
        </p>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  head() {
    return { title: 'よくある質問' }
  },
  data() {
    return {}
  },
  computed: {},
  created: function() {},
  methods: {}
}
</script>

<style lang="css">
</style>
