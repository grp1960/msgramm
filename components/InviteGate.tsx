'use client'

type Props = {
  userId: string
  onActivated: () => void
}

export default function InviteGate({ }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bone)',
      fontFamily: 'var(--sans)',
    }}>
      <div style={{ maxWidth: 420, width: '100%', padding: '0 24px' }}>
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--gold)',
          marginBottom: 16,
        }}>
          Ms▪Gramm
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>
          You're on the list
        </h1>
        <p style={{ fontSize: 15, color: '#666', lineHeight: 1.6 }}>
          Your account is registered. We'll activate your access shortly and send you a sign-in link when you're ready to go.
        </p>
      </div>
    </div>
  )
}
