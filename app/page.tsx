import Breakdown from '@/components/Breakdown'
import { seedSentence } from '@/lib/seed'

export default function Home() {
  return (
    <main className="max-w-3xl px-4 py-6">
      <Breakdown sentence={seedSentence} />
    </main>
  )
}
