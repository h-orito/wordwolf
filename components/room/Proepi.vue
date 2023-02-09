<template>
  <div class="panel" v-if="isNotProgress">
    <p class="is-size-7 has-text-left panel-heading">ゲーム開始前</p>
    <div class="panel-block" v-if="roomStatus === 'epilogue'">
      <p class="is-size-7 has-text-left">
        <span class="has-text-weight-bold is-size-6">{{
          room.winCamp === 'wolfs' ? '人狼' : '村人'
        }}</span>
        の勝利です。 <br />村人のワードは
        <span class="has-text-weight-bold is-size-6">{{
          room.villagersWord
        }}</span>
        でした。 <br />人狼のワードは
        <span class="has-text-weight-bold is-size-6">{{ room.wolfWord }}</span>
        でした。
      </p>
    </div>
    <div class="panel-block">
      <p
        class="is-size-7 has-text-left"
        v-if="!isOwner"
        style="margin-bottom: 10px;"
      >
        現在ゲーム開始前です。
        <br />4人以上集まり、全員が準備完了すればルームオーナーがゲームを開始することができます。
      </p>
      <div class="has-text-left is-size-7" v-if="!isOwner && isMember">
        <div class="field">
          <div class="control">
            <button
              class="button is-primary is-small"
              v-if="canReady"
              @click="ready"
            >
              準備完了状態にする
            </button>
            <button
              class="button is-default is-small"
              v-if="canCancelReady"
              @click="cancelReady"
            >
              準備中に戻す
            </button>
          </div>
        </div>
      </div>
      <div class="has-text-left is-size-7" v-if="isOwner">
        <p style="margin-bottom: 10px;">
          あなたはルームオーナーです。
          <br />4人以上集まり、ルームオーナー以外の全員が準備完了すればゲームを開始することができます。
        </p>
        <div class="field">
          <label class="label is-size-7 has-text-left">議論時間（分）</label>
          <div class="control">
            <input
              class="input is-small"
              type="number"
              min="1"
              max="10"
              step="1"
              v-model="talkMinutes"
            />
          </div>
        </div>
        <div class="field">
          <label class="label is-size-7 has-text-left">人狼の人数</label>
          <div class="control">
            <input
              class="input is-small"
              type="number"
              min="1"
              max="3"
              step="1"
              v-model="wolfNum"
            />
          </div>
        </div>
        <div class="field">
          <div class="control">
            <button
              class="button is-primary is-small"
              :disabled="!canGameStart"
              @click="gameStart"
            >
              ゲームを開始する
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="panel-block" v-if="!canJoin && !isLogin">
      <p class="has-text-left is-size-7">
        参加するにはログインが必要です。トップページよりログインしてください。
      </p>
    </div>
    <div class="panel-block" v-if="!canJoin && notVerified">
      <p class="has-text-left is-size-7">
        参加するにはメール認証が必要です。メールをご確認ください。
        <br />送信されていない場合は「ユーザ情報編集」から再送してください。
      </p>
    </div>
    <div class="panel-block" v-if="canJoin">
      <div class="field">
        <label class="label is-size-7 has-text-left">自分のニックネーム</label>
        <div class="control">
          <input
            class="input is-small"
            type="text"
            v-model="playerName"
            placeholder="ニックネーム"
            :class="
              !hasPlayerName
                ? ''
                : hasPlayerNameError
                ? 'is-danger'
                : 'is-success'
            "
            @keyup="validatePlayerName"
          />
        </div>
        <p class="help is-danger is-size-7 has-text-left" v-if="hasPlayerName">
          {{ this.playerNameError }}
        </p>
      </div>
      <div class="field">
        <div class="control">
          <button
            class="button is-primary is-small"
            :disabled="!canJoinSubmit"
            @click="joinRoom"
          >
            参加する
          </button>
        </div>
      </div>
    </div>
    <div class="panel-block" v-if="canLeave">
      <div class="has-text-left">
        <button class="button is-danger is-small" @click="leaveRoom">
          退出する
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import * as consts from '~/store/consts'
export default {
  props: ['room', 'members', 'user', 'isLogin', 'master'],
  data: function() {
    return {
      playerName: '',
      playerNameError: null,
      talkMinutes: 3,
      wolfNum: 1
    }
  },
  computed: {
    roomStatus() {
      if (this.room == null) {
        return ''
      }
      return this.room.status
    },
    isNotProgress: function() {
      return (
        this.room != null &&
        (this.roomStatus === consts.STATUS_PROLOGUE ||
          this.roomStatus === consts.STATUS_EPILOGUE)
      )
    },
    isOwner: function() {
      return (
        this.user != null &&
        this.room != null &&
        this.room.creatorRef === this.user.uid
      )
    },
    isMember() {
      return (
        this.user != null && this.members.some(mem => mem.key === this.user.uid)
      )
    },
    notVerified() {
      return (
        this.isLogin &&
        !this.isMember &&
        this.user.email &&
        !this.user.emailVerified &&
        this.isNotProgress &&
        this.room != null &&
        (this.room.ban == null ||
          !this.room.ban.some(target => target === this.user.uid))
      )
    },
    isGlobalBaned() {
      const bans = this.$store.getters.getBans
      const clientToken = this.$cookies.get('client-token')
      return bans.some(b => b === clientToken)
    },
    canJoin() {
      return (
        this.isLogin &&
        !this.isMember &&
        (!this.user.email || this.user.emailVerified) &&
        this.isNotProgress &&
        this.room != null &&
        !this.isGlobalBaned &&
        (this.room.ban == null ||
          !this.room.ban.some(target => target === this.user.uid))
      )
    },
    canLeave() {
      return this.isLogin && this.isMember && this.isNotProgress
    },
    hasPlayerName() {
      return this.playerName != null && this.playerName !== ''
    },
    hasPlayerNameError() {
      return this.playerNameError != null
    },
    canJoinSubmit() {
      this.validatePlayerName()
      return this.hasPlayerName && !this.hasPlayerNameError && this.isLogin
    },
    canReady() {
      return (
        this.isMember &&
        !this.members.filter(m => m.key === this.user.uid)[0].ready
      )
    },
    canCancelReady() {
      return (
        this.isMember &&
        this.members.filter(m => m.key === this.user.uid)[0].ready
      )
    },
    canGameStart() {
      return (
        this.members.length >= 4 &&
        this.isNotProgress &&
        this.isOwner &&
        this.members
          .filter(m => m.key != this.room.creatorRef)
          .every(m => m.ready)
      )
    }
  },
  created: function() {},
  methods: {
    validatePlayerName() {
      if (!this.validPlayerName(this.playerName)) {
        this.playerNameError = '3文字以上10文字以内で入力してください'
      } else if (
        this.playerName.trim() === 'ort' &&
        this.user.uid !== this.master
      ) {
        this.playerNameError = 'その名前は使用できません'
      } else {
        this.playerNameError = null
      }
    },
    validPlayerName(playerName) {
      if (playerName.trim().length < 1 || playerName.length > 10) {
        return false
      }
      return true
    },
    joinRoom() {
      this.validatePlayerName()
      if (!this.canJoinSubmit) {
        return
      }
      this.$emit('joinRoom', this.playerName.trim())
    },
    leaveRoom() {
      if (!this.canLeave) {
        return
      }
      this.$emit('leaveRoom')
    },
    ready() {
      if (!this.canReady) {
        return
      }
      this.$emit('ready')
    },
    cancelReady() {
      if (!this.canCancelReady) {
        return
      }
      this.$emit('cancelReady')
    },
    gameStart() {
      if (!this.canGameStart) {
        return
      }
      this.$emit('gameStart', {
        talkMinutes: Math.floor(this.talkMinutes),
        wolfNum: this.wolfNum
      })
    }
  }
}
</script>

<style></style>
