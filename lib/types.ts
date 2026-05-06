export type WordEntry = {
  wid: number
  word: string
  type: string
  form?: string
  note?: string
  job: string
}

export type Breakdown = {
  words: WordEntry[]
  explanation: string
  trap: string
}

export type Sentence = {
  id: string
  language: string
  text: string
  ctx_before: string | null
  ctx_after: string | null
  breakdown: Breakdown
  created_at: string
}
