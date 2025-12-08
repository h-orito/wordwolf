<template>
  <div class="panel" v-if="isCounter">
    <p class="is-size-7 has-text-left panel-heading">ゲーム進行中</p>
    <div class="panel-block is-size-7 has-text-left" v-if="isGameMaster">
      <p>
        村人のワードは
        <span class="has-text-weight-bold is-size-6">{{ room?.villagersWord }}</span> です。
        <br>人狼のワードは
        <span class="has-text-weight-bold is-size-6">{{ room?.wolfWord }}</span> です。
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
            :class="counterWord === '' ? '' : counterWordError != null ? 'is-danger': 'is-success'"
            v-model="counterWord"
            placeholder="村人（多数派）のワード"
            type="text"
            @keyup="validateCounterWord"
          >
        </div>
        <p class="help is-danger has-text-left">{{ counterWordError }}</p>
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

<script setup lang="ts">
import * as consts from '~/stores/consts'
import type { Room, Member } from '~/stores/types'

interface Props {
  room: Room | null
  members: Member[]
  user: { uid: string } | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  submitCounterWord: [string]
}>()

// data
const counterWord = ref('')
const counterWordError = ref<string | null>(null)

// computed
const roomStatus = computed(() => {
  if (props.room == null) {
    return ''
  }
  return props.room.status
})

const isCounter = computed(() => {
  return roomStatus.value === consts.STATUS_COUNTER
})

const isMember = computed(() => {
  return props.user != null && props.members.some(mem => mem.key === props.user!.uid)
})

const isGameMaster = computed(() => {
  return (
    props.room != null &&
    props.user != null &&
    props.room.gameMaster != null &&
    props.room.gameMaster.key === props.user.uid
  )
})

const myWord = computed(() => {
  if (!props.room || !props.user) return ''
  if (props.room.villagers.some(vil => vil.key === props.user!.uid)) {
    return props.room.villagersWord
  } else if (isWolfs.value) {
    return props.room.wolfWord
  } else {
    return ''
  }
})

const isWolfs = computed(() => {
  return (
    props.room != null &&
    props.user != null &&
    props.room.wolfs.some(w => w.key === props.user!.uid)
  )
})

const isCounterPerson = computed(() => {
  return isWolfs.value && props.room?.counterPerson === props.user?.uid
})

const canSubmitCounterWord = computed(() => {
  return (
    !!counterWord.value && counterWord.value !== '' && !counterWordError.value
  )
})

// methods
function isOnlyHiragana(word: string): boolean {
  const re = /^[ぁ-ゞ0-9ー]+$/u
  return re.test(word)
}

function validateCounterWord() {
  if (counterWord.value == null || counterWord.value === '') {
    return
  }
  if (counterWord.value.length > 20) {
    counterWordError.value = '20文字以内で入力してください。'
  } else if (!isOnlyHiragana(counterWord.value)) {
    counterWordError.value = 'ひらがなと半角数字で入力してください。'
  } else {
    counterWordError.value = null
  }
}

function submit() {
  if (!canSubmitCounterWord.value) return
  emit('submitCounterWord', counterWord.value)
  counterWord.value = ''
}
</script>

<style></style>
