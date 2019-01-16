<template lang="html">
  <div>
    <section class="section">
      <div class="container">
        <h1 class="title is-5">ワードウルフとは</h1>
        <div class="columns">
          <div class="column">
            <p class="content">単語を使った人狼のようなゲームで、4人から1ゲーム5分程度で手軽に遊ぶことができます。</p>
          </div>
        </div>
      </div>
    </section>
    <section class="section has-background-light">
      <div class="container">
        <h1 class="title is-5">ゲームの流れ</h1>
        <p class="content">4人以上いればゲームを始めることができます。</p>
        <img src="~/assets/intro01.png" width="240" height="160"/>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <p class="content">ゲームが始まると、ゲームマスターが一人選ばれます。
          <br>ゲームマスターはこのゲームでは参加者ではなくお題を決める役割になります。
          <br>（ゲームマスターは順々に回ってきます）
        </p>
        <img src="~/assets/intro02.png" width="240" height="160"/>
      </div>
    </section>
    <section class="section has-background-light">
      <div class="container">
        <p class="content">ゲームマスターが、村人（多数派）のワードと人狼（少数派）のワードを決めます。
          <br>ワードは微妙に異なるものにしましょう。</p>
        <img src="~/assets/intro03.png" width="240" height="160"/>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <p class="content">ワードが決定したら参加者の一人に人狼用のワードが配られ、残り全員に村人用のワードが配られます。
          <br>参加者は他の人のワードは知りませんし、自分のワードが村人のものか人狼のものかもわかりません。</p>
        <img src="~/assets/intro04.png" width="240" height="160"/>
      </div>
    </section>
    <section class="section has-background-light">
      <div class="container">
        <p class="content">ワードが配られたら、時間切れまで参加者同士で配られたワードについて話し、誰が人狼（のワードを配られた人）かを探ります。
          <br>自分が人狼だと思ったらそれを悟られないようにしましょう。</p>
        <img src="~/assets/intro05.png" width="240" height="160"/>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <p class="content">時間切れになったら投票タイムです。それぞれが人狼だと思う人に投票します。</p>
        <img src="~/assets/intro06.png" width="240" height="160"/>
      </div>
    </section>
    <section class="section has-background-light">
      <div class="container">
        <p class="content">最多票が村人だった場合は人狼の勝利です。（最多票が二人いて、人狼と村人だった場合も人狼の勝利です。）</p>
        <img src="~/assets/intro07.png" width="240" height="160"/>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <p class="content">最多票が人狼だった場合は人狼にチャンスが与えられます。
          <br>村人のワードがなんだったのかを当てられれば人狼の勝利、当てられなければ村人の勝利となります。</p>
        <img src="~/assets/intro08.png" width="240" height="160"/>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  head() {
    return { title: 'ルール紹介' }
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
