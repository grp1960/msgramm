/* Ms. Gramm — sentence data
 * One rich German sentence, fully analysed.
 * Schema is designed to be language-agnostic.
 */

window.MS_GRAMM_DATA = {
  language: "German",
  sentence: "Am Montag bringt sie ihrer Schwester das Geschenk zum Bahnhof mit.",
  translation: "On Monday she brings her sister the present to the train station.",
  context: {
    paragraph: "Sie kommt am Wochenende immer zu spät. Am Montag bringt sie ihrer Schwester das Geschenk zum Bahnhof mit. So spart sie sich die Fahrt am Wochenende.",
    paragraphEn: "She always comes too late at the weekend. On Monday she brings her sister the present to the train station. That way she saves herself the journey on the weekend."
  },

  words: [
    {
      id: 1,
      surface: "Am",
      pos: "contraction",
      posLabel: "preposition + article",
      lemma: "an + dem",
      gloss: "On",
      role: "Time-when expression — points at the day.",
      props: { case: "dative", gender: "masculine" },
      note: "A fusion of an + dem. German contracts these whenever the article is unstressed — and with weekdays, it almost always is.",
      ruleId: "fusions",
      trap: null
    },
    {
      id: 2,
      surface: "Montag",
      pos: "noun",
      posLabel: "noun",
      lemma: "der Montag",
      gloss: "Monday",
      role: "The day the action happens.",
      props: { case: "dative", gender: "masculine", number: "singular" },
      note: "Days of the week are masculine in German. The dative here isn't because Monday is being given to anyone — it's the case an demands when it points to a time.",
      ruleId: "an-time",
      trap: null
    },
    {
      id: 3,
      surface: "bringt",
      pos: "verb",
      posLabel: "verb (separable)",
      lemma: "mitbringen",
      gloss: "brings (along)",
      role: "Main verb. Position two, where every German main-clause verb lives.",
      props: { tense: "present", person: "3rd singular", separable: "yes" },
      note: "The infinitive is mitbringen. The prefix mit has been peeled off and sent to the end of the clause — see word 11.",
      ruleId: "separable-verbs",
      trap: null
    },
    {
      id: 4,
      surface: "sie",
      pos: "pronoun",
      posLabel: "personal pronoun",
      lemma: "sie",
      gloss: "she",
      role: "The one doing the bringing.",
      props: { case: "nominative", person: "3rd singular", gender: "feminine" },
      note: "Capital-S Sie means you (formal). Lowercase sie can mean she or they — context disambiguates. Here, the singular verb bringt tells you it's she.",
      ruleId: "sie-vs-Sie",
      trap: "Sie (capital) would mean a formal you — wrong subject, wrong verb form."
    },
    {
      id: 5,
      surface: "ihrer",
      pos: "article",
      posLabel: "possessive article",
      lemma: "ihr",
      gloss: "her",
      role: "Says whose sister we mean.",
      props: { case: "dative", gender: "feminine", number: "singular" },
      note: "Possessive articles take the same endings as ein-words. Feminine dative singular ending is -er. So ihr + er = ihrer.",
      ruleId: "ein-word-endings",
      trap: null
    },
    {
      id: 6,
      surface: "Schwester",
      pos: "noun",
      posLabel: "noun",
      lemma: "die Schwester",
      gloss: "sister",
      role: "Indirect object — the one receiving the present.",
      props: { case: "dative", gender: "feminine", number: "singular" },
      note: "When a verb has both an indirect and a direct object, the indirect (the receiver) goes in the dative. Schwester gets the gift; Geschenk is the gift.",
      ruleId: "dative-indirect",
      trap: null
    },
    {
      id: 7,
      surface: "das",
      pos: "article",
      posLabel: "definite article",
      lemma: "der/die/das",
      gloss: "the",
      role: "Marks the thing being brought.",
      props: { case: "accusative", gender: "neuter", number: "singular" },
      note: "Neuter accusative looks identical to neuter nominative — both das. The verb tells you which one you're looking at.",
      ruleId: "der-die-das",
      trap: null
    },
    {
      id: 8,
      surface: "Geschenk",
      pos: "noun",
      posLabel: "noun",
      lemma: "das Geschenk",
      gloss: "present, gift",
      role: "Direct object — what's being brought.",
      props: { case: "accusative", gender: "neuter", number: "singular" },
      note: "Most nouns starting with Ge- and ending in a consonant are neuter. A useful pattern, not a law.",
      ruleId: "ge-nouns",
      trap: null
    },
    {
      id: 9,
      surface: "zum",
      pos: "contraction",
      posLabel: "preposition + article",
      lemma: "zu + dem",
      gloss: "to the",
      role: "Marks the destination.",
      props: { case: "dative", gender: "masculine" },
      note: "zu always governs the dative. zu + dem fuses to zum whenever the article is unstressed — and with destinations, it almost always is.",
      ruleId: "fusions",
      trap: null
    },
    {
      id: 10,
      surface: "Bahnhof",
      pos: "noun",
      posLabel: "noun",
      lemma: "der Bahnhof",
      gloss: "train station",
      role: "Where the bringing ends up.",
      props: { case: "dative", gender: "masculine", number: "singular" },
      note: "Hof (yard, court) is masculine, and compound nouns take the gender of their last piece. Bahn-hof → der Bahnhof.",
      ruleId: "compound-gender",
      trap: null
    },
    {
      id: 11,
      surface: "mit",
      pos: "particle",
      posLabel: "separable prefix",
      lemma: "mit-",
      gloss: "along",
      role: "The prefix of mitbringen, sent to the very end of the clause.",
      props: { attachesTo: "bringt", position: "clause-final" },
      note: "Don't confuse this with the preposition mit (which means with and takes the dative). Here, mit is part of the verb — it belongs to bringt and travels to the end of the sentence.",
      ruleId: "separable-verbs",
      trap: "Sie mitbringt das Geschenk — wrong. The prefix must travel; it cannot ride along with the conjugated verb."
    }
  ],

  // Overall structural insight + the canonical mistake
  insight: {
    title: "The separable verb is the load-bearing wall.",
    body: "German main clauses have a verb in position two and, often, a second verbal piece at the very end — the past participle, an infinitive, a modal complement, or, here, the separated prefix of a separable verb. mitbringen splits: bringt takes position two, mit travels to the end. Everything else (subject, objects, time, place) sits between them. Recognise this bracket, and the rest of the sentence relaxes into place.",
  },
  trap: {
    wrong: "Sie mitbringt das Geschenk zum Bahnhof.",
    right: "Sie bringt das Geschenk zum Bahnhof mit.",
    why: "Separable prefixes peel off in main clauses. The verb takes position two; the prefix goes home — last position. Glueing them together is the most common slip with this verb family."
  }
};
