export type ChainQuestion = {
  id: string
  prompt: string
  field: string
  options: string[]
}

export const CHAIN_QUESTIONS: Record<string, ChainQuestion[]> = {
  Noun: [
    { id: 'case',   prompt: 'What case is it in?',     field: 'case',   options: ['Nominative', 'Accusative', 'Dative', 'Genitive'] },
    { id: 'gender', prompt: 'What is its gender?',     field: 'gender', options: ['Masculine', 'Feminine', 'Neuter'] },
    { id: 'number', prompt: 'Singular or plural?',     field: 'number', options: ['Singular', 'Plural'] },
  ],
  Verb: [
    { id: 'tense',  prompt: 'What tense is it?',       field: 'tense',  options: ['Present', 'Past', 'Perfect', 'Pluperfect', 'Future'] },
    { id: 'person', prompt: 'What person and number?', field: 'person', options: ['1st singular', '2nd singular', '3rd singular', '1st plural', '2nd plural', '3rd plural'] },
  ],
  'Helper verb': [
    { id: 'tense',  prompt: 'What tense?',             field: 'tense',  options: ['Present', 'Past', 'Perfect', 'Pluperfect', 'Future'] },
    { id: 'person', prompt: 'What person and number?', field: 'person', options: ['1st singular', '2nd singular', '3rd singular', '1st plural', '2nd plural', '3rd plural'] },
  ],
  'Modal verb': [
    { id: 'person', prompt: 'What person and number?', field: 'person', options: ['1st singular', '2nd singular', '3rd singular', '1st plural', '2nd plural', '3rd plural'] },
  ],
  Article: [
    { id: 'case',   prompt: 'What case does it mark?', field: 'case',   options: ['Nominative', 'Accusative', 'Dative', 'Genitive'] },
    { id: 'gender', prompt: 'What gender does it mark?', field: 'gender', options: ['Masculine', 'Feminine', 'Neuter'] },
  ],
  'Article contraction': [
    { id: 'case',   prompt: 'What case does it mark?', field: 'case',   options: ['Nominative', 'Accusative', 'Dative', 'Genitive'] },
    { id: 'gender', prompt: 'What gender does it mark?', field: 'gender', options: ['Masculine', 'Feminine', 'Neuter'] },
  ],
  Pronoun: [
    { id: 'case',   prompt: 'What case is it in?',     field: 'case',   options: ['Nominative', 'Accusative', 'Dative', 'Genitive'] },
  ],
}
