/* Ms. Gramm — Header, Specimen, Plaque, Filters
 * Reads window.MS_GRAMM_DATA, calls back into App via props.
 */

const { useState } = React;

/* ─── Header ─── */
function Header({ mode, setMode, sentence }) {
  return (
    <header className="mg-header">
      <div className="mg-wordmark">
        Ms<span className="dot"></span> Gramm
      </div>

      <div className="mg-header-meta">
        <span>{sentence.language}</span>
        <span>{sentence.words.length} words</span>
      </div>

      <div className="mg-mode-toggle" role="tablist" aria-label="Mode">
        <button
          aria-pressed={mode === 'study'}
          onClick={() => setMode('study')}
        >Study</button>
        <button
          aria-pressed={mode === 'quiz'}
          onClick={() => setMode('quiz')}
        >Quiz</button>
      </div>
    </header>
  );
}

/* ─── Specimen ─── */
function Specimen({ data, hoveredId, setHoveredId, activeId, scrollToEntry }) {
  // Split sentence into word tokens + punctuation.
  // Greedy: walk through the sentence string, consuming each word in order.
  const tokens = [];
  let cursor = 0;
  const s = data.sentence;
  data.words.forEach((w) => {
    const idx = s.indexOf(w.surface, cursor);
    if (idx > cursor) tokens.push({ kind: 'gap', text: s.slice(cursor, idx) });
    tokens.push({ kind: 'word', word: w });
    cursor = idx + w.surface.length;
  });
  if (cursor < s.length) tokens.push({ kind: 'gap', text: s.slice(cursor) });

  return (
    <section className="mg-specimen-block">
      <div className="mg-eyebrow">A sentence, broken down</div>

      <p className="mg-specimen" onMouseLeave={() => setHoveredId(null)}>
        {tokens.map((t, i) => {
          if (t.kind === 'gap') return <span key={i}>{t.text}</span>;
          const w = t.word;
          const isHovered = hoveredId === w.id;
          const isActive = activeId === w.id;
          return (
            <span
              key={i}
              className="mg-word"
              data-hovered={isHovered}
              data-active={isActive}
              onMouseEnter={() => setHoveredId(w.id)}
              onClick={() => scrollToEntry(w.id)}
            >
              <span className="mg-word-num">{String(w.id).padStart(2, '0')}</span>
              {w.surface}
            </span>
          );
        })}
      </p>
    </section>
  );
}

/* ─── Plaque (metadata strip + actions) ─── */
function Plaque({ data, saved, setSaved, showContext, setShowContext, showTranslation, setShowTranslation }) {
  // Compute stats
  const cases = new Set();
  const genders = new Set();
  data.words.forEach((w) => {
    if (w.props.case) cases.add(w.props.case);
    if (w.props.gender) genders.add(w.props.gender);
  });

  return (
    <>
      <div className="mg-plaque">
        <div className="mg-plaque-stats">
          <span><strong>{data.language}</strong></span>
          <span><strong>{data.words.length}</strong> words</span>
          <span><strong>{cases.size}</strong> cases</span>
          <span><strong>{genders.size}</strong> genders</span>
        </div>
        <div className="mg-plaque-actions">
          <button
            className="mg-action"
            aria-pressed={showTranslation}
            onClick={() => setShowTranslation((v) => !v)}
          >Translate</button>
          <button
            className="mg-action"
            aria-pressed={showContext}
            onClick={() => setShowContext((v) => !v)}
          >In paragraph</button>
          <button
            className="mg-action"
            aria-pressed={saved}
            onClick={() => setSaved((v) => !v)}
          >{saved ? 'Saved' : 'Save'}</button>
        </div>
      </div>

      {showTranslation && (
        <p className="mg-translation">"{data.translation}"</p>
      )}

      {showContext && (
        <div className="mg-context">
          {data.context.paragraph.split(data.sentence).map((part, i, arr) => (
            <React.Fragment key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className="focus">{data.sentence}</span>
              )}
            </React.Fragment>
          ))}
          <span className="en">{data.context.paragraphEn}</span>
        </div>
      )}
    </>
  );
}

/* ─── Filters ─── */
function Filters({ data, filter, setFilter }) {
  const types = [
    { key: 'all', label: 'All' },
    { key: 'noun', label: 'Nouns' },
    { key: 'verb', label: 'Verbs' },
    { key: 'article', label: 'Articles' },
    { key: 'pronoun', label: 'Pronouns' },
    { key: 'contraction', label: 'Fusions' },
    { key: 'particle', label: 'Particles' },
  ];
  const counts = {};
  data.words.forEach((w) => {
    counts[w.pos] = (counts[w.pos] || 0) + 1;
  });
  counts.all = data.words.length;

  return (
    <div className="mg-filters">
      <span className="mg-filters-label">Filter</span>
      {types.map((t) => {
        if (t.key !== 'all' && !counts[t.key]) return null;
        return (
          <button
            key={t.key}
            className="mg-filter"
            aria-pressed={filter === t.key}
            onClick={() => setFilter(t.key)}
          >
            {t.label}<span className="count">{counts[t.key] || 0}</span>
          </button>
        );
      })}
    </div>
  );
}

Object.assign(window, { Header, Specimen, Plaque, Filters });
