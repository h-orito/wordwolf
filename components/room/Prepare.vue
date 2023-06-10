<template>
  <div class="panel" v-if="isPrepare">
    <p class="is-size-7 has-text-left panel-heading">ゲーム準備中</p>
    <div class="panel-block is-size-7 has-text-left" v-if="!canSetWord">
      ゲームマスターがワードを決めています。
    </div>
    <div class="panel-block" v-if="canSetWord">
      <div class="field">
        <div class="control">
          <p class="is-size-7">
            あなたはゲームマスターです。
            <br />ワードをそれぞれ20文字以内で設定してください。
            <br />ワードに設定できる文字はひらがなと半角数字のみです。
          </p>
        </div>
      </div>
      <label class="label is-size-7 has-text-left"
        >村人（多数派）のワード</label
      >
      <div class="field">
        <div class="control">
          <input
            v-model="villagersWord"
            type="text"
            class="input is-small"
            :class="
              villagersWord == ''
                ? ''
                : villagersWordError != null
                ? 'is-danger'
                : 'is-success'
            "
            @keyup="validateWord"
            placeholder="村人（多数派）のワード"
          />
          <br />
        </div>
        <p class="help is-danger has-text-left">
          {{ this.villagersWordError }}
        </p>
      </div>
      <label class="label is-size-7 has-text-left"
        >人狼（少数派）のワード</label
      >
      <div class="field">
        <div class="control">
          <input
            v-model="wolfWord"
            type="text"
            class="input is-small"
            :class="
              wolfWord == ''
                ? ''
                : wolfWordError != null
                ? 'is-danger'
                : 'is-success'
            "
            @keyup="validateWord"
            placeholder="人狼（少数派）のワード"
          />
          <br />
        </div>
        <p class="help is-danger has-text-left">{{ this.wolfWordError }}</p>
      </div>
      <button
        class="button is-primary is-small"
        :disabled="!canSubmitSetWord"
        @click="submitSetWord"
      >
        決定
      </button>
      <br />
    </div>
  </div>
</template>

<script>
import * as consts from '~/store/consts'
export default {
  props: ['room', 'members', 'user'],
  data: function() {
    return {
      villagersWord: '',
      villagersWordError: '',
      wolfWord: '',
      wolfWordError: ''
    }
  },
  computed: {
    isPrepare() {
      return this.roomStatus === consts.STATUS_PREPARE
    },
    isMember() {
      return (
        this.user != null && this.members.some(mem => mem.key === this.user.uid)
      )
    },
    isGameMaster() {
      return (
        this.room != null &&
        this.user != null &&
        this.room.gameMaster.key === this.user.uid
      )
    },
    roomStatus() {
      if (this.room == null) {
        return ''
      }
      return this.room.status
    },
    canSetWord() {
      return (
        this.room != null &&
        this.isMember &&
        this.isPrepare &&
        this.isGameMaster
      )
    },
    canSubmitSetWord() {
      return (
        this.villagersWord !== '' &&
        this.wolfWord !== '' &&
        this.villagersWordError == null &&
        this.wolfWordError == null
      )
    }
  },
  created: function() {},
  methods: {
    validateWord: function() {
      this.validateVillagersWord()
      this.validateWolfWord()
    },
    validateVillagersWord: function() {
      if (this.villagersWord == null || this.villagersWord === '') {
        return
      }
      if (this.villagersWord.length > 20) {
        this.villagersWordError = '20文字以内で入力してください。'
      } else if (!isOnlyHiragana(this.villagersWord)) {
        this.villagersWordError = 'ひらがなと半角数字で入力してください。'
      } else {
        this.villagersWordError = null
      }
    },
    validateWolfWord: function() {
      if (this.wolfWord == null || this.wolfWord === '') {
        return
      }
      if (this.wolfWord.length > 20) {
        this.wolfWordError = '20文字以内で入力してください。'
      } else if (!isOnlyHiragana(this.wolfWord)) {
        this.wolfWordError = 'ひらがなと半角数字で入力してください。'
      } else if (this.villagersWord === this.wolfWord) {
        this.wolfWordError = '村人と別のワードを設定してください。'
      } else {
        this.wolfWordError = null
      }
    },
    submitSetWord() {
      this.validateWord()
      if (this.canSubmitSetWord) {
        this.$emit('setWord', {
          villagersWord: this.villagersWord,
          wolfWord: this.wolfWord
        })
      }
    }
  }
}

const isOnlyHiragana = function(word) {
  const re = /^[ぁ-ゞ0-9ー]+$/u
  return re.test(word)
}
</script>

<style></style>
