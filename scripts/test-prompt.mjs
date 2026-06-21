import { readFileSync } from 'fs'
import OpenAI from 'openai'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => l.split('=').map(s => s.trim()))
)

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })
const SYSTEM_PROMPT = readFileSync('lib/prompt.ts', 'utf8').match(/`([\s\S]+)`/)?.[1] ?? ''

const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  response_format: { type: 'json_object' },
  temperature: 0.2,
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: 'Language: de\nSentence: Ich fahre am Wochenende mit dem Zug zum Markt.' },
  ],
})

const result = JSON.parse(response.choices[0].message.content)
result.words.forEach(w => console.log(`${w.word}: translation="${w.translation ?? 'MISSING'}" case=${w.case ?? '-'} gender=${w.gender ?? '-'}`))
