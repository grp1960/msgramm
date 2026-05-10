export type Language = {
  code: string
  label: string
}

export const LANGUAGES: Language[] = [
  { code: 'de', label: 'German' },
  { code: 'la', label: 'Latin' },
  { code: 'en', label: 'English' },
]

export function getLabel(code: string): string {
  return LANGUAGES.find(l => l.code === code)?.label ?? code
}
