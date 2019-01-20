<template>
  <div class="panel" v-if="isNotProgress">
    <p class="is-size-7 has-text-left panel-heading">ゲーム開始前</p>
    <div class="panel-block" v-if="roomStatus === 'epilogue'">
      <p class="is-size-7 has-text-left">
        <span class="has-text-weight-bold is-size-6">{{ room.winCamp === 'wolfs' ? '人狼' : '村人' }}</span> の勝利です。
        <br>村人のワードは
        <span class="has-text-weight-bold is-size-6">{{ room.villagersWord }}</span> でした。
        <br>人狼のワードは
        <span class="has-text-weight-bold is-size-6">{{ room.wolfWord }}</span> でした。
      </p>
    </div>
    <div class="panel-block">
      <p class="is-size-7 has-text-left" v-if="!isOwner">現在ゲーム開始前です。
        <br>4人集まるとルームオーナーがゲームを開始することができます。
      </p>
      <div class="has-text-left is-size-7" v-if="isOwner">
        <p style="margin-bottom: 10px;">あなたはルームオーナーです。
          <br>4人集まればゲームを開始することができます。
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
            >
          </div>
        </div>
        <div class="field">
          <div class="control">
            <button
              class="button is-primary is-small"
              :disabled="!canGameStart"
              @click="gameStart"
            >ゲームを開始する</button>
          </div>
        </div>
      </div>
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
            :class="!hasPlayerName ? '' : hasPlayerNameError ? 'is-danger': 'is-success'"
            @keyup="validatePlayerName"
          >
        </div>
        <p
          class="help is-danger is-size-7 has-text-left"
          v-if="hasPlayerName"
        >{{this.playerNameError}}</p>
      </div>
      <div class="field" v-if="room.roomPassword != null && room.roomPassword !== ''">
        <label class="label is-size-7 has-text-left">部屋パスワード</label>
        <div class="control">
          <input
            class="input is-small"
            :class="!hasRoomPassword ? '' : hasRoomPasswordError ? 'is-danger': 'is-success'"
            type="text"
            v-model="roomPassword"
            placeholder="パスワード"
            @keyup="validateRoomPassword"
          >
        </div>
        <p
          class="help is-danger has-text-left is-size-7"
          v-if="hasRoomPassword"
        >{{this.roomPasswordError}}</p>
      </div>
      <div class="field">
        <div class="control">
          <button
            class="button is-primary is-small"
            :disabled="!canJoinSubmit"
            @click="joinRoom"
          >参加する</button>
        </div>
      </div>
    </div>
    <div class="panel-block" v-if="canLeave">
      <div class="has-text-left">
        <button class="button is-danger is-small" @click="leaveRoom">退出する</button>
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
      roomPassword: '',
      roomPasswordError: null,
      talkMinutes: 3
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
    canJoin() {
      // TODO: 他の村に参加していてゲーム中だったらNG
      return (
        this.isLogin &&
        !this.isMember &&
        this.user.emailVerified &&
        this.isNotProgress &&
        this.room != null &&
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
    hasRoomPassword() {
      return this.roomPassword != null && this.roomPassword !== ''
    },
    hasRoomPasswordError() {
      return this.roomPasswordError != null
    },
    canJoinSubmit() {
      this.validatePlayerName()
      this.validateRoomPassword()
      return (
        this.hasPlayerName &&
        (this.room.roomPassword == null ||
          this.room.roomPassword === '' ||
          this.hasRoomPassword) &&
        !this.hasRoomPasswordError &&
        !this.hasPlayerNameError &&
        this.isLogin
      )
    },
    canGameStart() {
      return this.members.length >= 4 && this.isNotProgress && this.isOwner
    }
  },
  created: function() {},
  methods: {
    validateRoomPassword() {
      if (this.room.roomPassword == null || this.room.roomPassword === '') {
        return
      }
      if (this.room.roomPassword !== this.roomPassword) {
        this.roomPasswordError = '正しくありません'
      } else {
        this.roomPasswordError = null
      }
    },
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
      this.validateRoomPassword()
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
    gameStart() {
      if (!this.canGameStart) {
        return
      }
      this.$emit('gameStart', Math.floor(this.talkMinutes))
    }
  }
}
</script>

<style>
</style>
