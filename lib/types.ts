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

export type TopicBlock =
  | { type: 'paragraph'; data: { text: string } }
  | { type: 'header'; data: { text: string; level: number } }

export type Topic = {
  id: string
  slug: string
  language: string
  title: string
  body: { blocks: TopicBlock[] }
  word_type: string | null
  lemmas: string[] | null
  chain_answers: string[] | null
  created_at: string
}

export type Sentence = {
  id: string
  language: string
  text: string
  difficulty: Difficulty
  tags: string[]
  concepts: string[] | null
  ctx_before: string | null
  ctx_after: string | null
  ctx_before_translation: string | null
  ctx_after_translation: string | null
  breakdown: Breakdown
  created_at: string
}
