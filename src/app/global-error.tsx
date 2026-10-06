'use client';

/** Last-resort boundary for errors thrown in the root layout itself. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui', background: '#0c0c0e', color: '#ececf1', display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 18 }}>The application failed to load</h1>
          <p style={{ opacity: 0.7, fontSize: 14 }}>{error.digest ? `Reference: ${error.digest}` : 'An unexpected error occurred.'}</p>
          <button onClick={reset} style={{ marginTop: 12, padding: '6px 12px', borderRadius: 6 }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
