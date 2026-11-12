import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment
} from '@firebase/rules-unit-testing'
import {
  arrayUnion,
  deleteDoc,
  doc,
  getDoc,
  increment,
  setDoc,
  updateDoc,
  type Firestore
} from 'firebase/firestore'
import { get, push, ref, remove, set, type Database } from 'firebase/database'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

const ADMIN_DOC = 'users/f3hRhU3eBPPAhZcIPVCE'
const ROOM = 'room0001'
const HASH = '$2a$10$' + 'a'.repeat(53)

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-wordwolf',
    firestore: { rules: readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8') },
    database: { rules: readFileSync(resolve(__dirname, '../database.rules.json'), 'utf8') }
  })
})

afterAll(async () => {
  await env.cleanup()
})

beforeEach(async () => {
  await env.clearFirestore()
  await env.clearDatabase()
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), ADMIN_DOC), { master: 'admin', globalBans: [] })
  })
})

function fs(uid: string | null): Firestore {
  return (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore()
}

function rtdb(uid: string | null): Database {
  return (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).database()
}

function roomTemplate(creator: string, overrides: Record<string, unknown> = {}) {
  return {
    isComplete: false,
    name: 'テストルーム',
    key: ROOM,
    creatorRef: creator,
    creatorName: creator,
    createdAt: new Date(),
    status: 'prologue',
    gameMaster: null,
    wolfs: [],
    villagers: [],
    wolfWord: '',
    villagersWord: '',
    endingTime: null,
    winCamp: null,
    membersNum: 1,
    roomPassword: '',
    roomRating: '',
    ban: [],
    counterPerson: null,
    ...overrides
  }
}

function memberTemplate(uid: string, overrides: Record<string, unknown> = {}) {
  return {
    name: uid,
    key: uid,
    roomKey: ROOM,
    createdAt: new Date(),
    color: 'color01',
    ready: false,
    winNum: 0,
    clientToken: 'token',
    ...overrides
  }
}

/** owner がルームを作り、members の各ユーザーが参加した状態にする */
async function seedRoom(owner: string, members: string[], roomOverrides: Record<string, unknown> = {}) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'rooms', ROOM), roomTemplate(owner, { membersNum: members.length, ...roomOverrides }))
    for (const m of members) {
      await setDoc(doc(db, 'members', m), memberTemplate(m))
    }
  })
}

describe('通常の遊び方ができる', () => {
  it('ルームを作成して参加し、入室メッセージを送れる', async () => {
    await assertSucceeds(setDoc(doc(fs('alice'), 'rooms', ROOM), roomTemplate('alice', { roomPassword: HASH, roomRating: 'R15' })))
    await assertSucceeds(setDoc(doc(fs('alice'), 'members', 'alice'), memberTemplate('alice')))
    await assertSucceeds(push(ref(rtdb('alice'), `messages/${ROOM}`), {
      name: '', key: 'abcdefgh', message: 'aliceさんが入室しました', createdAt: Date.now()
    }))
  })

  it('別のルームにいたユーザーが参加し直せる（ドキュメントの上書き）', async () => {
    await seedRoom('alice', ['alice'])
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'members', 'bob'), memberTemplate('bob', { roomKey: 'oldroom', winNum: 3 }))
    })
    await assertSucceeds(setDoc(doc(fs('bob'), 'members', 'bob'), memberTemplate('bob', { color: 'color02' })))
    await assertSucceeds(updateDoc(doc(fs('bob'), 'rooms', ROOM), { membersNum: 2 }))
  })

  it('3 人でゲームを最後まで進められる', async () => {
    await seedRoom('alice', ['alice', 'bob', 'carol'])
    // 準備完了（本人）
    await assertSucceeds(updateDoc(doc(fs('bob'), 'members', 'bob'), { ready: true }))
    // 開始（ルームマスター）: ルーム更新・投票の削除・全員の準備完了を解除
    await assertSucceeds(updateDoc(doc(fs('alice'), 'rooms', ROOM), {
      status: 'prepare',
      gameMaster: memberTemplate('alice'),
      wolfs: [memberTemplate('bob')],
      villagers: [memberTemplate('carol')],
      wolfWord: '', villagersWord: '', endingTime: null, winCamp: null, talkMinutes: 2, membersNum: 3
    }))
    await assertSucceeds(remove(ref(rtdb('alice'), `votes/${ROOM}`)))
    await assertSucceeds(updateDoc(doc(fs('alice'), 'members', 'bob'), { ready: false }))
    await assertSucceeds(updateDoc(doc(fs('alice'), 'members', 'alice'), { ready: false }))
    // お題の決定（ゲームマスター）
    await assertSucceeds(updateDoc(doc(fs('alice'), 'rooms', ROOM), {
      status: 'progress', villagersWord: 'りんご', wolfWord: 'みかん', endingTime: new Date()
    }))
    await assertSucceeds(setDoc(doc(fs('alice'), 'words', 'w1'), { villagersWord: 'りんご', wolfWord: 'みかん' }))
    // 発言
    await assertSucceeds(push(ref(rtdb('bob'), `messages/${ROOM}`), {
      name: 'bob', color: 'color01', key: 'k1', message: 'こんにちは', memberKey: 'bob', createdAt: Date.now(), clientToken: 'token'
    }))
    // 投票（最後に投票した参加者が集計してルームを進める）
    await assertSucceeds(push(ref(rtdb('bob'), `votes/${ROOM}`), { uid: 'bob', target: 'carol', createdAt: Date.now() }))
    await assertSucceeds(push(ref(rtdb('carol'), `votes/${ROOM}`), { uid: 'carol', target: 'bob', createdAt: Date.now() }))
    await assertSucceeds(get(ref(rtdb('carol'), `votes/${ROOM}`)))
    await assertSucceeds(updateDoc(doc(fs('carol'), 'rooms', ROOM), { status: 'counter', counterPerson: 'bob' }))
    await assertSucceeds(push(ref(rtdb('carol'), `messages/${ROOM}`), {
      name: '', key: 'k2', message: 'ーー\n投票結果\n' + 'x'.repeat(500), createdAt: Date.now()
    }))
    // 逆転（人狼）と勝利数の加算
    await assertSucceeds(updateDoc(doc(fs('bob'), 'rooms', ROOM), { status: 'epilogue', winCamp: 'villagers' }))
    await assertSucceeds(updateDoc(doc(fs('bob'), 'members', 'carol'), { winNum: increment(1) }))
    // リセット（ルームマスター）
    await assertSucceeds(updateDoc(doc(fs('alice'), 'rooms', ROOM), {
      key: ROOM, createdAt: new Date(), status: 'prologue', gameMaster: null, wolfs: [], villagers: [],
      wolfWord: '', villagersWord: '', endingTime: null, winCamp: null, membersNum: 3, counterPerson: null
    }))
  })

  it('勝利数が未設定のメンバーにも加算できる', async () => {
    await seedRoom('alice', ['alice', 'bob'])
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'members', 'bob'), { name: 'bob', key: 'bob', roomKey: ROOM, createdAt: new Date(), color: 'color02', ready: false })
    })
    await assertSucceeds(updateDoc(doc(fs('alice'), 'members', 'bob'), { winNum: increment(1) }))
  })

  it('参加者が退出できる（人数の更新 → メンバー削除の順）', async () => {
    await seedRoom('alice', ['alice', 'bob'])
    await assertSucceeds(updateDoc(doc(fs('bob'), 'rooms', ROOM), { membersNum: 1 }))
    await assertSucceeds(deleteDoc(doc(fs('bob'), 'members', 'bob')))
  })

  it('ルームマスターが退出すると交代し、最後の 1 人が退出するとルームが終了する', async () => {
    await seedRoom('alice', ['alice', 'bob'])
    await assertSucceeds(updateDoc(doc(fs('alice'), 'rooms', ROOM), { membersNum: 1, creatorRef: 'bob' }))
    await assertSucceeds(deleteDoc(doc(fs('alice'), 'members', 'alice')))
    await assertSucceeds(updateDoc(doc(fs('bob'), 'rooms', ROOM), { membersNum: 0, creatorRef: 'bob' }))
    await assertSucceeds(updateDoc(doc(fs('bob'), 'rooms', ROOM), { isComplete: true }))
    await assertSucceeds(deleteDoc(doc(fs('bob'), 'members', 'bob')))
  })

  it('ルームマスターが強制退出させられる', async () => {
    await seedRoom('alice', ['alice', 'bob'])
    await assertSucceeds(updateDoc(doc(fs('alice'), 'rooms', ROOM), { ban: ['bob'] }))
    await assertSucceeds(updateDoc(doc(fs('alice'), 'rooms', ROOM), { membersNum: 1 }))
    await assertSucceeds(deleteDoc(doc(fs('alice'), 'members', 'bob')))
  })

  it('連投した本人が退出の更新をしてから自分を BAN して退出できる', async () => {
    await seedRoom('alice', ['alice', 'bob'])
    await assertSucceeds(updateDoc(doc(fs('bob'), 'rooms', ROOM), { membersNum: 1 }))
    await assertSucceeds(updateDoc(doc(fs('bob'), 'rooms', ROOM), { ban: ['bob'] }))
    await assertSucceeds(deleteDoc(doc(fs('bob'), 'members', 'bob')))
  })

  it('ルームマスターがいないルームでは最後のメンバーが退出してルームを終了できる', async () => {
    await seedRoom('alice', ['bob'])
    await assertSucceeds(updateDoc(doc(fs('bob'), 'rooms', ROOM), { membersNum: 0 }))
    await assertSucceeds(updateDoc(doc(fs('bob'), 'rooms', ROOM), { isComplete: true }))
    await assertSucceeds(deleteDoc(doc(fs('bob'), 'members', 'bob')))
  })

  it('勝者側の本人が自分の勝利数を 1 増やせる', async () => {
    await seedRoom('alice', ['alice', 'bob'])
    await assertSucceeds(updateDoc(doc(fs('bob'), 'members', 'bob'), { winNum: increment(1) }))
  })

  it('ルームマスターがいなくなったルームに参加した人がルームマスターになれる', async () => {
    await seedRoom('alice', [], { membersNum: 0 })
    await assertSucceeds(setDoc(doc(fs('bob'), 'members', 'bob'), memberTemplate('bob')))
    await assertSucceeds(updateDoc(doc(fs('bob'), 'rooms', ROOM), { membersNum: 1, creatorRef: 'bob' }))
  })

  it('名前を変更できる', async () => {
    await seedRoom('alice', ['alice'])
    await assertSucceeds(updateDoc(doc(fs('alice'), 'members', 'alice'), { name: 'ありす' }))
  })

  it('ログインしていなくてもルーム・メンバー・ログを読める', async () => {
    await seedRoom('alice', ['alice'])
    await assertSucceeds(getDoc(doc(fs(null), 'rooms', ROOM)))
    await assertSucceeds(getDoc(doc(fs(null), 'members', 'alice')))
    await assertSucceeds(getDoc(doc(fs(null), ADMIN_DOC)))
    await assertSucceeds(get(ref(rtdb(null), `messages/${ROOM}`)))
    await assertSucceeds(get(ref(rtdb(null), `votes/${ROOM}`)))
  })

  it('管理者はルームを終了させられる', async () => {
    await seedRoom('alice', ['alice'])
    await assertSucceeds(updateDoc(doc(fs('admin'), 'rooms', ROOM), { isComplete: true }))
  })
})

describe('許可されていない操作はできない', () => {
  it('管理用データは書き換えられない', async () => {
    await assertFails(updateDoc(doc(fs('mallory'), ADMIN_DOC), { master: 'mallory' }))
    await assertFails(setDoc(doc(fs('mallory'), 'users', 'other'), { master: 'mallory' }))
  })

  it('ルームとお題の記録は削除できない', async () => {
    await seedRoom('alice', ['alice'])
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'words', 'w1'), { villagersWord: 'a', wolfWord: 'b' })
    })
    await assertFails(deleteDoc(doc(fs('alice'), 'rooms', ROOM)))
    await assertFails(deleteDoc(doc(fs('alice'), 'words', 'w1')))
    await assertFails(updateDoc(doc(fs('alice'), 'words', 'w1'), { wolfWord: 'c' }))
  })

  it('ログインしていないと書き込めない', async () => {
    await assertFails(setDoc(doc(fs(null), 'rooms', ROOM), roomTemplate('alice')))
    await assertFails(push(ref(rtdb(null), `messages/${ROOM}`), { name: '', key: 'k', message: 'x', createdAt: 1 }))
  })

  it('ルーム作成時の値が決められた形式でないと作れない', async () => {
    await assertFails(setDoc(doc(fs('alice'), 'rooms', ROOM), roomTemplate('bob')))
    await assertFails(setDoc(doc(fs('alice'), 'rooms', ROOM), roomTemplate('alice', { roomPassword: '$2a$31$' + 'a'.repeat(53) })))
    await assertFails(setDoc(doc(fs('alice'), 'rooms', ROOM), roomTemplate('alice', { roomPassword: 'plain' })))
    await assertFails(setDoc(doc(fs('alice'), 'rooms', ROOM), roomTemplate('alice', { ban: ['x'] })))
    await assertFails(setDoc(doc(fs('alice'), 'rooms', ROOM), roomTemplate('alice', { isComplete: true })))
    await assertFails(setDoc(doc(fs('alice'), 'rooms', ROOM), roomTemplate('alice', { roomRating: 'R99' })))
    await assertFails(setDoc(doc(fs('alice'), 'rooms', ROOM), roomTemplate('alice', { key: 'other' })))
  })

  it('ルームのパスワード・名前・レーティングは変えられない', async () => {
    await seedRoom('alice', ['alice'], { roomPassword: HASH })
    await assertFails(updateDoc(doc(fs('alice'), 'rooms', ROOM), { roomPassword: '' }))
    await assertFails(updateDoc(doc(fs('alice'), 'rooms', ROOM), { name: '別の名前' }))
    await assertFails(updateDoc(doc(fs('alice'), 'rooms', ROOM), { roomRating: 'R18' }))
  })

  it('ルームに参加していない人はルームを更新できない', async () => {
    await seedRoom('alice', ['alice'])
    await assertFails(updateDoc(doc(fs('mallory'), 'rooms', ROOM), { status: 'epilogue' }))
    await assertFails(updateDoc(doc(fs('mallory'), 'rooms', ROOM), { creatorRef: 'mallory' }))
  })

  it('参加者はルームマスターを奪えず、ルームを終了できず、他人を BAN できない', async () => {
    await seedRoom('alice', ['alice', 'bob', 'carol'])
    await assertFails(updateDoc(doc(fs('bob'), 'rooms', ROOM), { creatorRef: 'bob' }))
    await assertFails(updateDoc(doc(fs('bob'), 'rooms', ROOM), { isComplete: true }))
    await assertFails(updateDoc(doc(fs('bob'), 'rooms', ROOM), { ban: ['carol'] }))
    await assertFails(updateDoc(doc(fs('bob'), 'rooms', ROOM), { ban: arrayUnion('carol') }))
  })

  it('BAN されたユーザーは参加もルームの更新もできない', async () => {
    await seedRoom('alice', ['alice', 'bob'], { ban: ['bob'] })
    await assertFails(updateDoc(doc(fs('bob'), 'rooms', ROOM), { membersNum: 3 }))
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'members', 'bob'), memberTemplate('bob', { roomKey: 'oldroom' }))
    })
    await assertFails(setDoc(doc(fs('bob'), 'members', 'bob'), memberTemplate('bob')))
  })

  it('終了したルームには参加できず、更新もできない', async () => {
    await seedRoom('alice', ['alice'], { isComplete: true })
    await assertFails(setDoc(doc(fs('bob'), 'members', 'bob'), memberTemplate('bob')))
    await assertFails(updateDoc(doc(fs('alice'), 'rooms', ROOM), { isComplete: false }))
  })

  it('存在しないルームには参加できない', async () => {
    await assertFails(setDoc(doc(fs('bob'), 'members', 'bob'), memberTemplate('bob', { roomKey: 'nothing' })))
  })

  it('自分の勝利数を任意の値にはできない', async () => {
    await seedRoom('alice', ['alice'])
    await assertFails(updateDoc(doc(fs('alice'), 'members', 'alice'), { winNum: 100 }))
    await assertFails(setDoc(doc(fs('bob'), 'members', 'bob'), memberTemplate('bob', { winNum: 100 })))
  })

  it('ルームに決められたフィールド以外は追加できない', async () => {
    await seedRoom('alice', ['alice'])
    await assertFails(updateDoc(doc(fs('alice'), 'rooms', ROOM), { extra: 'x' }))
  })

  it('ルームマスターがいるルームでは他のメンバーが終了できない', async () => {
    await seedRoom('alice', ['alice', 'bob'])
    await assertFails(updateDoc(doc(fs('bob'), 'rooms', ROOM), { isComplete: true }))
  })

  it('BAN された本人はルームを更新できない', async () => {
    await seedRoom('alice', ['alice', 'bob'], { ban: ['bob'] })
    await assertFails(updateDoc(doc(fs('bob'), 'rooms', ROOM), { membersNum: 1 }))
  })

  it('メンバーの色は決められたものしか使えない', async () => {
    await seedRoom('alice', ['alice'])
    await assertFails(setDoc(doc(fs('bob'), 'members', 'bob'), memberTemplate('bob', { color: 'modal is-active' })))
    await assertFails(updateDoc(doc(fs('alice'), 'members', 'alice'), { color: 'modal is-active' }))
  })

  it('他人のメンバー情報は準備完了の解除と勝利数 +1 以外は変えられない', async () => {
    await seedRoom('alice', ['alice', 'bob'])
    await assertFails(setDoc(doc(fs('mallory'), 'members', 'bob'), memberTemplate('bob')))
    await assertFails(updateDoc(doc(fs('alice'), 'members', 'bob'), { name: 'なりすまし' }))
    await assertFails(updateDoc(doc(fs('alice'), 'members', 'bob'), { ready: true }))
    await assertFails(updateDoc(doc(fs('alice'), 'members', 'bob'), { winNum: 100 }))
    await assertFails(updateDoc(doc(fs('mallory'), 'members', 'bob'), { winNum: increment(1) }))
  })

  it('ルームマスター以外は他人を退出させられない', async () => {
    await seedRoom('alice', ['alice', 'bob', 'carol'])
    await assertFails(deleteDoc(doc(fs('bob'), 'members', 'carol')))
    await assertFails(deleteDoc(doc(fs('mallory'), 'members', 'alice')))
  })

  it('チャットのメッセージは決められた形式しか書けず、書き換え・削除もできない', async () => {
    const db = rtdb('bob')
    await assertFails(push(ref(db, `messages/${ROOM}`), { name: 'bob', key: 'k', message: 'x', memberKey: 'alice', createdAt: 1 }))
    await assertFails(push(ref(db, `messages/${ROOM}`), { name: 'bob', key: 'k', message: 'x', createdAt: 1 }))
    await assertFails(push(ref(db, `messages/${ROOM}`), { name: 'bob', key: 'k', message: 'x', memberKey: 'bob', color: 'modal is-active', createdAt: 1 }))
    await assertFails(push(ref(db, `messages/${ROOM}`), { name: '', key: 'k', message: 'x'.repeat(3001), createdAt: 1 }))
    await assertFails(push(ref(db, `messages/${ROOM}`), { name: '', key: 'k', message: 'x', createdAt: 1, extra: true }))
    await assertFails(set(ref(db, `messages/${ROOM}`), null))

    await env.withSecurityRulesDisabled(async (ctx) => {
      await set(ref(ctx.database(), `messages/${ROOM}/m1`), { name: '', key: 'k', message: 'x', createdAt: 1 })
    })
    await assertFails(set(ref(db, `messages/${ROOM}/m1`), { name: '', key: 'k', message: 'y', createdAt: 1 }))
    await assertFails(remove(ref(db, `messages/${ROOM}/m1`)))
    await assertFails(remove(ref(db, 'messages')))
  })

  it('投票は本人の分しか書けず、書き換えもできない', async () => {
    const db = rtdb('bob')
    await assertFails(push(ref(db, `votes/${ROOM}`), { uid: 'alice', target: 'carol', createdAt: 1 }))
    await env.withSecurityRulesDisabled(async (ctx) => {
      await set(ref(ctx.database(), `votes/${ROOM}/v1`), { uid: 'bob', target: 'carol', createdAt: 1 })
    })
    await assertFails(set(ref(db, `votes/${ROOM}/v1`), { uid: 'bob', target: 'alice', createdAt: 2 }))
  })

  it('決められたパス以外には読み書きできない', async () => {
    await assertFails(set(ref(rtdb('bob'), 'other/x'), 1))
    await assertFails(get(ref(rtdb(null), 'other')))
  })
})
