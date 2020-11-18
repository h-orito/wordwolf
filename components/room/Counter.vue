<template>
  <div class="panel" v-if="isCounter">
    <p class="is-size-7 has-text-left panel-heading">ゲーム進行中</p>
    <div class="panel-block is-size-7 has-text-left" v-if="isGameMaster">
      <p>
        村人のワードは
        <span class="has-text-weight-bold is-size-6">{{ room.villagersWord }}</span> です。
        <br>人狼のワードは
        <span class="has-text-weight-bold is-size-6">{{ room.wolfWord }}</span> です。
        <br>
      </p>
    </div>
    <div class="panel-block is-size-7 has-text-left" v-if="isMember && !isGameMaster">
      <div class="content">
        <p>
          あなたのワードは
          <span class="has-text-weight-bold is-size-6">{{ myWord }}</span> です。
          <br>あなたは
          <span class="has-text-weight-bold is-size-6">{{ isWolfs ? '人狼' : '村人' }}</span> でした。
          <br>
        </p>
      </div>
    </div>
    <div class="panel-block is-size-7 has-text-left" v-if="isCounterPerson">
      <p>あなたが最多票になりました。
        <br>村人のワードを当てられればあなたの勝利、当てられなければ村人の勝利となります。
        <br>村人のワードを予想してください。
      </p>
    </div>
    <div class="panel-block is-size-7 has-text-left" v-if="isCounterPerson">
      <label class="label is-size-7 has-text-left">村人（多数派）のワード</label>
      <div class="field">
        <div class="control">
          <input
            class="input is-small"
            :class="counterWord == '' ? '' : counterWordError != null ? 'is-danger': 'is-success'"
            v-model="counterWord"
            placeholder="村人（多数派）のワード"
            type="text"
            @keyup="validateCounterWord"
          >
        </div>
        <p class="help is-danger has-text-left">{{this.counterWordError}}</p>
      </div>
      <button class="button is-primary is-small" @click="submit" :disabled="!canSubmitCounterWord">決定</button>
      <br>
    </div>
    <div class="panel-block is-size-7 has-text-left" v-if="!isCounterPerson">
      <p>人狼が最多票になりました。
        <br>人狼が村人のワードを予想しています。
        <br>人狼が村人のワードを当てられれば人狼の勝利、当てられなければ村人の勝利となります。
      </p>
    </div>
  </div>
</template>

<script>
import * as consts from '~/store/consts'
export default {
  props: ['room', 'members', 'user'],
  data: function() {
    return {
      counterWord: '',
      counterWordError: null
    }
  },
  computed: {
    roomStatus() {
      if (this.room == null) {
        return ''
      }
      return this.room.status
    },
    isCounter() {
      return this.roomStatus === consts.STATUS_COUNTER
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
    myWord() {
      if (isVillagers(this.room.villagers, this.user)) {
        return this.room.villagersWord
      } else if (this.isWolfs) {
        return this.room.wolfWord
      } else {
        return ''
      }
    },
    isWolfs() {
      return (
        this.room != null &&
        this.user != null &&
        this.room.wolfs.some(w => w.key === this.user.uid)
      )
    },
    isCounterPerson() {
      return this.isWolfs && this.room.counterPerson === this.user.uid
    },
    canSubmitCounterWord() {
      return (
        !!this.counterWord && this.counterWord !== '' && !this.counterWordError
      )
    }
  },
  created: function() {},
  methods: {
    validateCounterWord() {
      if (this.counterWord == null || this.counterWord === '') {
        return
      }
      if (this.counterWord.length > 20) {
        this.counterWordError = '20文字以内で入力してください。'
      } else if (!isOnlyHiragana(this.counterWord)) {
        this.counterWordError = 'ひらがなと半角数字で入力してください。'
      } else {
        this.counterWordError = null
      }
    },
    submit() {
      if (!this.canSubmitCounterWord) return
      this.$emit('submitCounterWord', this.counterWord)
      this.counterWord = ''
    }
  }
}

const isVillagers = function(villagers, user) {
  return villagers.some(vil => vil.key === user.uid)
}

const isOnlyHiragana = function(word) {
  const re = /^[ぁ-ゞ0-9ー]+$/u
  return re.test(word)
}
</script>

<style>
</style>
