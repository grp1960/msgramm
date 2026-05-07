export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'

export type WordEntry = {
  wid: number
  word: string
  type: string
  translation?: string
  form?: string
  note?: string
  job: string
}

export type Breakdown = {
  words: WordEntry[]
  translation: string
  explanation: string
  trap: string
}

export type Sentence = {
  id: string
  language: string
  text: string
  difficulty: Difficulty
  ctx_before: string | null
  ctx_after: string | null
  breakdown: Breakdown
  created_at: string
}
