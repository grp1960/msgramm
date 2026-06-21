/* Ms. Gramm — Ask drawer
 * A slim composer pinned bottom-right. Expands into a side drawer.
 * Backed by window.claude.complete for in-context answers.
 */

const { useState: useStateAsk, useRef: useRefAsk, useEffect: useEffectAsk } = React;

function AskMsGramm({ data, open, setOpen }) {
  const [thread, setThread] = useStateAsk([]); // [{role, body}]
  const [draft, setDraft] = useStateAsk('');
  const [busy, setBusy] = useStateAsk(false);
  const threadRef = useRefAsk(null);
  const textareaRef = useRefAsk(null);

  useEffectAsk(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [thread, busy]);

  useEffectAsk(() => {
    if (open && textareaRef.current) {
      setTimeout(() => textareaRef.current.focus(), 280);
    }
  }, [open]);

  const suggestions = [
    "Why does mit go to the end?",
    "What if this were in the past tense?",
    "Why is Schwester in the dative?",
    "How would I say this with 'I' instead?",
  ];

  const send = async (text) => {
    if (!text.trim() || busy) return;
    const userMsg = { role: 'user', body: text.trim() };
    const next = [...thread, userMsg];
    setThread(next);
    setDraft('');
    setBusy(true);

    const systemPreamble = `You are Ms. Gramm, a knowledgeable friend who explains the grammar of a single sentence with playful curiosity but never condescension. Tone: grown-up, warm, specific, never textbook. British English. No em dashes mid-sentence. Keep responses to 2-4 short paragraphs.

The sentence we are looking at is:

"${data.sentence}"
Translation: "${data.translation}"

Word breakdown:
${data.words.map(w => `${w.id}. ${w.surface} — ${w.posLabel} — ${w.gloss}${Object.keys(w.props).length ? ' [' + Object.entries(w.props).map(([k,v]) => `${k}:${v}`).join(', ') + ']' : ''}`).join('\n')}

Always answer in the context of this specific sentence. Quote the relevant German words back when useful.`;

    const messages = [
      { role: 'user', content: systemPreamble + '\n\n---\n\nUser asks: ' + text.trim() },
      ...next.slice(0, -1).map(m => ({ role: m.role, content: m.body })),
    ];

    try {
      const response = await window.claude.complete({ messages: [{ role: 'user', content: systemPreamble + '\n\nUser asks: ' + text.trim() + (thread.length ? '\n\nPrior conversation:\n' + thread.map(m => (m.role === 'user' ? 'You asked: ' : 'You answered: ') + m.body).join('\n\n') : '') }] });
      setThread((t) => [...t, { role: 'assistant', body: response }]);
    } catch (e) {
      setThread((t) => [...t, { role: 'assistant', body: "I couldn't reach the wire just now. Try once more?" }]);
    }
    setBusy(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(draft);
    }
  };

  return (
    <>
      {!open && (
        <button className="mg-ask-launcher" onClick={() => setOpen(true)}>
          <span className="dot"></span>
          Ask Ms. Gramm
        </button>
      )}

      <div className={`mg-ask-drawer ${open ? 'is-open' : ''}`}>
        <div className="mg-ask-header">
          <div className="mg-ask-title">
            <span className="dot"></span>
            Ask Ms. Gramm
          </div>
          <button className="mg-ask-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
        </div>

        <div className="mg-ask-context">
          <span className="lbl">About this sentence</span>
          {data.sentence}
        </div>

        <div className="mg-ask-thread" ref={threadRef}>
          {thread.length === 0 && !busy ? (
            <>
              <p className="empty">Ask anything about this sentence — why a word changes form, what a different tense would look like, where the trap is.</p>
              <div className="mg-suggestions">
                {suggestions.map((s) => (
                  <button key={s} className="mg-suggestion" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </>
          ) : (
            thread.map((m, i) => (
              <div key={i} className={`mg-message ${m.role}`}>
                <div className="role">{m.role === 'user' ? 'You' : 'Ms. Gramm'}</div>
                <div className="body">{m.body}</div>
              </div>
            ))
          )}
          {busy && (
            <div className="mg-message assistant">
              <div className="role">Ms. Gramm</div>
              <div className="mg-thinking">thinking</div>
            </div>
          )}
        </div>

        <div className="mg-ask-input">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything…"
            rows={1}
          />
          <button className="mg-ask-send" onClick={() => send(draft)} disabled={busy || !draft.trim()}>
            Send
          </button>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { AskMsGramm });
