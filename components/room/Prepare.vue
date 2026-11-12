<template>
  <div v-if="isPrepare" class="panel">
    <p class="is-size-7 has-text-left panel-heading">ゲーム準備中</p>
    <div v-if="!canSetWord" class="panel-block is-size-7 has-text-left">
      ゲームマスターがワードを決めています。
    </div>
    <div v-if="canSetWord" class="panel-block">
      <div class="field">
        <div class="control">
          <p class="is-size-7">
            あなたはゲームマスターです。
            <br >ワードをそれぞれ20文字以内で設定してください。
            <br >ワードに設定できる文字はひらがなと半角数字のみです。
          </p>
        </div>
      </div>
      <label class="label is-size-7 has-text-left">村人（多数派）のワード</label>
      <div class="field">
        <div class="control">
          <input
            v-model="villagersWord"
            type="text"
            class="input is-small"
            :class="
              villagersWord === ''
                ? ''
                : villagersWordError != null
                ? 'is-danger'
                : 'is-success'
            "
            placeholder="村人（多数派）のワード"
            @keyup="validateWord"
          >
          <br >
        </div>
        <p class="help is-danger has-text-left">
          {{ villagersWordError }}
        </p>
      </div>
      <label class="label is-size-7 has-text-left">人狼（少数派）のワード</label>
      <div class="field">
        <div class="control">
          <input
            v-model="wolfWord"
            type="text"
            class="input is-small"
            :class="
              wolfWord === ''
                ? ''
                : wolfWordError != null
                ? 'is-danger'
                : 'is-success'
            "
            placeholder="人狼（少数派）のワード"
            @keyup="validateWord"
          >
          <br >
        </div>
        <p class="help is-danger has-text-left">{{ wolfWordError }}</p>
      </div>
      <button
        class="button is-primary is-small"
        :disabled="!canSubmitSetWord"
        @click="submitSetWord"
      >
        決定
      </button>
      <br >
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
  setWord: [{ villagersWord: string; wolfWord: string }]
}>()

// data
const villagersWord = ref('')
const villagersWordError = ref<string | null>(null)
const wolfWord = ref('')
const wolfWordError = ref<string | null>(null)

// computed
const roomStatus = computed(() => {
  if (props.room == null) {
    return ''
  }
  return props.room.status
})

const isPrepare = computed(() => {
  return roomStatus.value === consts.STATUS_PREPARE
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

const canSetWord = computed(() => {
  return (
    props.room != null &&
    isMember.value &&
    isPrepare.value &&
    isGameMaster.value
  )
})

const canSubmitSetWord = computed(() => {
  return (
    villagersWord.value !== '' &&
    wolfWord.value !== '' &&
    villagersWordError.value == null &&
    wolfWordError.value == null
  )
})

// methods
function isOnlyHiragana(word: string): boolean {
  const re = /^[ぁ-ゞ0-9ー]+$/u
  return re.test(word)
}

function validateWord() {
  validateVillagersWord()
  validateWolfWord()
}

function validateVillagersWord() {
  if (villagersWord.value == null || villagersWord.value === '') {
    return
  }
  if (villagersWord.value.length > 20) {
    villagersWordError.value = '20文字以内で入力してください。'
  } else if (!isOnlyHiragana(villagersWord.value)) {
    villagersWordError.value = 'ひらがなと半角数字で入力してください。'
  } else {
    villagersWordError.value = null
  }
}

function validateWolfWord() {
  if (wolfWord.value == null || wolfWord.value === '') {
    return
  }
  if (wolfWord.value.length > 20) {
    wolfWordError.value = '20文字以内で入力してください。'
  } else if (!isOnlyHiragana(wolfWord.value)) {
    wolfWordError.value = 'ひらがなと半角数字で入力してください。'
  } else if (villagersWord.value === wolfWord.value) {
    wolfWordError.value = '村人と別のワードを設定してください。'
  } else {
    wolfWordError.value = null
  }
}

function submitSetWord() {
  validateWord()
  if (canSubmitSetWord.value) {
    emit('setWord', {
      villagersWord: villagersWord.value,
      wolfWord: wolfWord.value
    })
  }
}
</script>

<style></style>
