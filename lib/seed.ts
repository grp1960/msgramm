import { Sentence } from './types'

export const seedSentence: Sentence = {
  id: 'seed-1',
  language: 'de',
  text: 'Ich fahre am Wochenende mit dem Zug zum Markt.',
  difficulty: 'Beginner',
  concepts: null,
  tags: [],
  ctx_before: 'Thomas hat keinen einzigen Samstag verpasst, seit er in die Gegend gezogen ist.',
  ctx_after: 'Er kauft jede Woche dasselbe: Brot, einen Hartkäse und was auch immer ihm ins Auge fällt.',
  ctx_before_translation: null,
  ctx_after_translation: null,
  breakdown: {
    translation: 'I take the train to the market on the weekend.',
    words: [
      { wid: 1, word: 'Ich', type: 'Pronoun', form: 'Subject form · 1st person singular', job: 'The one making the trip' },
      { wid: 2, word: 'fahre', type: 'Verb', form: 'From fahren · 1st person singular · present tense', note: 'German drops -en and adds -e for 1st person singular. Also covers near future — German present means both "I go" and "I\'m going to go."', job: 'The action — travelling by vehicle' },
      { wid: 3, word: 'am', type: 'Article contraction', form: 'From an + dem · dative · time expression', note: 'An means "on/at"; dem is the dative article for masculine and neuter nouns. Fused because the pair appears constantly. Here: "on the weekend."', job: 'Pins the action to a time' },
      { wid: 4, word: 'Wochenende', type: 'Noun', form: 'Neuter · same form in all cases — the article carries the case', note: 'Woche (week) + Ende (end). All German nouns are capitalised.', job: 'The when' },
      { wid: 5, word: 'mit', type: 'Preposition', form: 'Always takes dative', note: 'Means "with" or "by means of." German uses mit for transport where English uses "by" — mit dem Zug = "by train."', job: 'Introduces the means of travel' },
      { wid: 6, word: 'dem', type: 'Article', form: 'Dative masculine · for Zug', note: 'Standalone — mit does not contract with dem. Not every preposition+article pair fuses; only the most common ones do.', job: 'Marks Zug as dative, masculine' },
      { wid: 7, word: 'Zug', type: 'Noun', form: 'Masculine · same form in all cases — dem shows it\'s dative', job: 'The means of travel' },
      { wid: 8, word: 'zum', type: 'Article contraction', form: 'From zu + dem · dative · destination', note: 'Zu means "to" for destinations. Same fusion logic as am — the pair is so common it collapsed. Compare: am answers "when?"; zum answers "where to?"', job: 'Points to the destination' },
      { wid: 9, word: 'Markt', type: 'Noun', form: 'Masculine · same form in all cases — zu forces dative, shown by the article', job: 'The destination' },
    ],
    explanation: 'Two contractions, same case, different jobs. Am (an + dem) places the action in time — "on the weekend." Zum (zu + dem) points to a destination — "to the market." Both are dative, both fuse because the combinations are extremely common in German. Notice mit dem stays separate — not every preposition+article pair contracts, only the ones that appear often enough to earn a shortcut. Word order follows the German rule of time before manner before place: am Wochenende (when) → mit dem Zug (how) → zum Markt (where).',
    trap: 'Saying zu dem Markt instead of zum Markt isn\'t technically wrong, but sounds stiff — a native speaker would find it odd. The same goes for an dem Wochenende instead of am Wochenende. Knowing which pairs contract (and which don\'t, like mit dem) is one of the things that separates textbook German from natural German.',
  },
  created_at: new Date().toISOString(),
}
