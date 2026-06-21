/* Ms. Gramm — Word entry (the heart of the breakdown)
 * One word, fully analysed. Plays in Study and Quiz modes.
 */

const { useState: useStateWE } = React;

const ruleLabels = {
  'fusions': 'Read about preposition fusions',
  'an-time': 'Read about an in time expressions',
  'separable-verbs': 'Read about separable verbs',
  'sie-vs-Sie': 'Read about sie, Sie, sie (plural)',
  'ein-word-endings': 'Read about ein-word endings',
  'dative-indirect': 'Read about dative as indirect object',
  'der-die-das': 'Read about definite articles',
  'ge-nouns': 'Read about Ge- nouns',
  'compound-gender': 'Read about compound noun gender',
};

function WordEntry({ word, filter, mode, hoveredId, setHoveredId, activeId, setActiveId, revealed, toggleReveal, revealAll }) {
  const filteredOut = filter !== 'all' && word.pos !== filter;
  const isHovered = hoveredId === word.id;
  const isActive = activeId === word.id;

  // Stable property order
  const propOrder = ['case', 'gender', 'number', 'tense', 'person', 'separable', 'attachesTo', 'position'];
  const propEntries = propOrder
    .filter((k) => word.props[k] != null)
    .map((k) => [k, word.props[k]]);

  const propLabel = {
    case: 'Case',
    gender: 'Gender',
    number: 'Number',
    tense: 'Tense',
    person: 'Person',
    separable: 'Separable',
    attachesTo: 'Attaches to',
    position: 'Position',
  };

  // Quiz mode: each value hidden behind a click; role + explain behind one reveal
  const isQuiz = mode === 'quiz';

  const isPropRevealed = (k) => !isQuiz || revealed[`${word.id}.${k}`];
  const isRoleRevealed = !isQuiz || revealed[`${word.id}.role`];

  // Render
  return (
    <article
      ref={(el) => { if (el) el.dataset.entryId = word.id; }}
      className="mg-entry"
      data-filtered-out={filteredOut}
      data-active={isHovered || isActive}
      onMouseEnter={() => setHoveredId(word.id)}
      onMouseLeave={() => setHoveredId(null)}
    >
      <div className="mg-entry-lead">
        <div className="mg-entry-num">
          <span>{String(word.id).padStart(2, '0')}</span>
          <span>·</span>
          <span className="pos">{word.posLabel}</span>
        </div>
        <div className="mg-entry-headline">
          <h2 className="mg-entry-word">{word.surface}</h2>
          <p className="mg-entry-gloss">"{word.gloss}"</p>
        </div>
        <div className="mg-entry-lemma">
          <span className="lem-key">Lemma</span>
          {word.lemma}
        </div>
      </div>

      <div className="mg-entry-body">
        {propEntries.length > 0 && (
          <div className="mg-props">
            {propEntries.map(([k, v]) => {
              const shown = isPropRevealed(k);
              return (
                <div className="mg-prop" key={k}>
                  <span className="mg-prop-key">{propLabel[k] || k}</span>
                  {shown ? (
                    <span className="mg-prop-value revealed">{v}</span>
                  ) : (
                    <button
                      className="mg-prop-value quiz"
                      onClick={() => toggleReveal(`${word.id}.${k}`)}
                      aria-label={`Reveal ${propLabel[k] || k}`}
                    >?</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {isRoleRevealed ? (
          <p className="mg-role">{word.role}</p>
        ) : (
          <p className="mg-role">
            <button className="quiz-cover" onClick={() => toggleReveal(`${word.id}.role`)}>
              What's it doing in this sentence? ↓
            </button>
          </p>
        )}

        {isRoleRevealed && word.note && (
          <p className="mg-note">{word.note}</p>
        )}

        {isRoleRevealed && word.trap && (
          <p className="mg-note" style={{ borderLeftColor: 'var(--gold)', color: 'var(--ink-90)' }}>
            <span style={{ fontFamily: 'var(--mono)', fontStyle: 'normal', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', display: 'block', marginBottom: 6 }}>
              Common slip
            </span>
            {word.trap}
          </p>
        )}

        {isRoleRevealed && word.ruleId && (
          <button className="mg-learn" onClick={() => {/* would open reference */}}>
            {ruleLabels[word.ruleId] || 'Learn more'}
          </button>
        )}

        {isQuiz && (Object.keys(word.props).some((k) => !revealed[`${word.id}.${k}`]) || !revealed[`${word.id}.role`]) && (
          <div className="mg-quiz-actions">
            <button
              className="mg-quiz-reveal-all"
              onClick={() => revealAll(word)}
            >Reveal all →</button>
          </div>
        )}
      </div>
    </article>
  );
}

Object.assign(window, { WordEntry });
