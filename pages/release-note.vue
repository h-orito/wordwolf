<template lang="html">
  <div>
    <section class="section">
      <div class="container">
        <h1 class="title is-5">更新情報</h1>
      </div>
    </section>
    <section class="section has-background-light">
      <div class="container">
        <ul class="content has-text-left" style="list-style: inside;">
          <li>2020/11/20 勝利数を表示するよう変更</li>
        </ul>
      </div>
    </section>
    <section class="section has-background">
      <div class="container">
        <ul class="content has-text-left" style="list-style: inside;">
          <li>2020/11/18 投票打ち切りが機能しなくなっていた不具合を修正</li>
          <li>2020/11/18 チャットのパフォーマンスを若干改善</li>
          <li>2020/11/18 最後の人が投票しても進まない不具合の発生率を低減（実験中）</li>
          <li>2020/11/18 人狼が村人のワードを当てる際ひらがな以外が入力されていたら送信できなくなるよう変更</li>
        </ul>
      </div>
    </section>
    <section class="section has-background-light">
      <div class="container">
        <ul class="content has-text-left" style="list-style: inside;">
          <li>2020/11/16 パスワードなしの部屋を作成できない不具合を修正</li>
          <li>2020/11/16 11名以上参加できない不具合を修正</li>
        </ul>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <ul class="content has-text-left" style="list-style: inside;">
          <li>2019/03/23 パスワードリセット機能を追加</li>
        </ul>
      </div>
    </section>
    <section class="section has-background-light">
      <div class="container">
        <ul class="content has-text-left" style="list-style: inside;">
          <li>2019/02/18 全員退出したらすぐに部屋が終了一覧に移動するよう変更</li>
          <li>2019/02/18 利用規約を一部変更（R15R18部屋での暴力表現、R18部屋での性的表現を許容）</li>
          <li>2019/02/18 R15部屋、R18部屋を作成できるように変更</li>
          <li>2019/02/18 部屋パスワードを参加→閲覧パスワードに変更</li>
          <li>2019/02/14 チャットメッセージ重複対策</li>
          <li>2019/02/13 人狼を複数名にできるように変更</li>
          <li>2019/02/10 全員が準備完了したら開始できるように変更</li>
        </ul>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <ul class="content has-text-left" style="list-style: inside;">
          <li>2019/01/20 不正操作対策</li>
          <li>2019/01/20 入退室時に部屋一覧の部屋人数が更新されない不具合を修正</li>
          <li>2019/01/19 パスワードが合っていなくても入室できる不具合を修正</li>
          <li>2019/01/19 一度もゲームを進行させていない部屋で強制退出させられない不具合を修正</li>
          <li>2019/01/19 強制退出させた場合該当者はその部屋には入室できないように変更</li>
        </ul>
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
