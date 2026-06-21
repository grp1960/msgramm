/* Ms. Gramm — main app */

const { useState: useStateApp, useEffect: useEffectApp, useRef: useRefApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "spacious",
  "theme": "bone",
  "startMode": "study"
}/*EDITMODE-END*/;

function App() {
  const data = window.MS_GRAMM_DATA;

  const t = useTweaks(TWEAK_DEFAULTS);

  const [mode, setMode] = useStateApp(t.startMode || 'study');
  const [hoveredId, setHoveredId] = useStateApp(null);
  const [activeId, setActiveId] = useStateApp(null);
  const [filter, setFilter] = useStateApp('all');
  const [showContext, setShowContext] = useStateApp(false);
  const [showTranslation, setShowTranslation] = useStateApp(true);
  const [saved, setSaved] = useStateApp(false);
  const [askOpen, setAskOpen] = useStateApp(false);
  const [revealed, setRevealed] = useStateApp({});

  // Apply theme + density to body / shell
  useEffectApp(() => {
    document.body.dataset.theme = t.theme;
  }, [t.theme]);

  // Reset reveals when mode switches
  useEffectApp(() => {
    if (mode === 'study') setRevealed({});
  }, [mode]);

  const toggleReveal = (key) => {
    setRevealed((r) => ({ ...r, [key]: !r[key] }));
  };

  const revealAll = (word) => {
    const next = { ...revealed };
    Object.keys(word.props).forEach((k) => { next[`${word.id}.${k}`] = true; });
    next[`${word.id}.role`] = true;
    setRevealed(next);
  };

  const scrollToEntry = (wordId) => {
    setActiveId(wordId);
    const el = document.querySelector(`[data-entry-id="${wordId}"]`);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setTimeout(() => setActiveId(null), 1400);
  };

  return (
    <div className="mg-shell" data-density={t.density}>
      <Header mode={mode} setMode={setMode} sentence={data} />

      <Specimen
        data={data}
        hoveredId={hoveredId}
        setHoveredId={setHoveredId}
        activeId={activeId}
        scrollToEntry={scrollToEntry}
      />

      <Plaque
        data={data}
        saved={saved}
        setSaved={setSaved}
        showContext={showContext}
        setShowContext={setShowContext}
        showTranslation={showTranslation}
        setShowTranslation={setShowTranslation}
      />

      <Filters data={data} filter={filter} setFilter={setFilter} />

      <div className="mg-entries">
        {data.words.map((w) => (
          <WordEntry
            key={w.id}
            word={w}
            filter={filter}
            mode={mode}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
            activeId={activeId}
            setActiveId={setActiveId}
            revealed={revealed}
            toggleReveal={toggleReveal}
            revealAll={revealAll}
          />
        ))}
      </div>

      <Insight data={data} />
      <Trap data={data} />

      <AskMsGramm data={data} open={askOpen} setOpen={setAskOpen} />

      <MsGrammTweaks t={t} setTweak={t.setTweak} mode={mode} setMode={setMode} />
    </div>
  );
}

/* ─── Tweaks panel (uses TweaksPanel from starter) ─── */
function MsGrammTweaks({ t, setTweak, mode, setMode }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Mode">
        <TweakRadio
          label="Reading mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'study', label: 'Study' },
            { value: 'quiz', label: 'Quiz' },
          ]}
        />
      </TweakSection>

      <TweakSection title="Layout">
        <TweakRadio
          label="Density"
          value={t.density}
          onChange={(v) => setTweak('density', v)}
          options={[
            { value: 'spacious', label: 'Spacious' },
            { value: 'compact', label: 'Compact' },
          ]}
        />
        <TweakRadio
          label="Theme"
          value={t.theme}
          onChange={(v) => setTweak('theme', v)}
          options={[
            { value: 'bone', label: 'Bone' },
            { value: 'ink', label: 'Ink' },
          ]}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
