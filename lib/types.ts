export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'

export type WordEntry = {
  wid: number
  word: string
  type: string
  translation?: string
  form?: string
  note?: string
  job: string
  // Quiz chain fields — populated by GPT at analysis time
  case?: string
  gender?: string
  number?: string
  tense?: string
  person?: string
  rationale?: Record<string, string>
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
  tags: string[]
  ctx_before: string | null
  ctx_after: string | null
  breakdown: Breakdown
  created_at: string
}
