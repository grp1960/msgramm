/* Ms. Gramm — Insight + Grammar Trap */

function Insight({ data }) {
  return (
    <section className="mg-insight">
      <div className="mg-insight-eyebrow">The pattern</div>
      <h2 className="mg-insight-title">{data.insight.title}</h2>
      <p className="mg-insight-body">{data.insight.body}</p>
    </section>
  );
}

function Trap({ data }) {
  return (
    <section className="mg-trap">
      <div className="mg-trap-eyebrow">Grammar trap</div>
      <div className="mg-trap-grid">
        <div className="mg-trap-side wrong">
          <div className="lbl wrong">— What learners write</div>
          <div className="sentence">{data.trap.wrong}</div>
        </div>
        <div className="mg-trap-side">
          <div className="lbl">— What the grammar wants</div>
          <div className="sentence">{data.trap.right}</div>
        </div>
      </div>
      <p className="mg-trap-why">{data.trap.why}</p>
    </section>
  );
}

Object.assign(window, { Insight, Trap });
