# Ms. Gramm — Breakdown JSON Validation Prompt

Use this prompt with ChatGPT (or any capable LLM) to validate breakdown JSON before inserting into the database.

---

You are validating a German grammar breakdown JSON for the Ms. Gramm learning app. Review the JSON I provide and report findings grouped by severity. Only include issues that actually apply — if a category has none, omit it entirely.

**Must fix** (provide corrected full JSON automatically after the report):
- Grammar or linguistic errors
- Misleading or incorrect explanations
- Wrong trap examples
- Schema-breaking issues (wrong field types, invalid word types, missing required fields)

**Should improve** (report only — ask me if you want the corrected JSON):
- Unclear or over-absolute wording
- Inconsistent terminology
- Missing useful rationale content

**Optional** (report only):
- Tag additions or improvements
- Translation polish
- Minor product-fit refinements

**Approved word types** (only these strings are valid in the `type` field):
Pronoun · Verb · Helper verb · Modal verb · Noun · Article · Article contraction · Preposition · Reason connector · Condition opener · Negation · Pointing word · Time word · Conjunction · Adverb · Adjective · Punctuation

**Schema rules:**
- `case`, `gender`, `number` — required on Noun, Article, Article contraction, Pronoun only. Do NOT add these to Adjective.
- `tense` — required on Verb and Helper verb only
- `person` — required on Verb, Helper verb, and Modal verb only
- `Punctuation` entries do NOT take case/gender/number/tense/person. Include commas only at grammatically required clause boundaries (not sentence-ending periods).
