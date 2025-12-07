export interface Member {
  key: string
  name: string
  roomKey: string
  createdAt: Date
  color: string
  ready: boolean
  winNum: number
  clientToken?: string
}

export interface Room {
  isComplete: boolean
  name: string
  key: string
  creatorRef: string
  creatorName: string
  createdAt: Date
  status: string
  gameMaster: Member | null
  wolfs: Member[]
  villagers: Member[]
  wolfWord: string
  villagersWord: string
  endingTime: Date | null
  winCamp: string | null
  membersNum: number
  roomPassword: string
  roomRating: string
  ban: string[]
  counterPerson: string | null
  talkMinutes?: number
}

export interface Message {
  key: string
  name: string
  message: string
  color?: string
  memberKey?: string
  createdAt: number
  clientToken?: string
}

export interface Vote {
  uid: string
  target: string
  createdAt: number
}
