/**
 * Field Operations Ledger style: editorial sustainability mission control.
 * Uses field-paper surfaces, moss ink, provenance labels, and chartreuse only
 * as an operational signal. Numerical outputs are explicit modeled estimates.
 */
import React, { useRef, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  Check,
  ChevronRight,
  CircleGauge,
  CloudSun,
  Database,
  Droplets,
  Leaf,
  MoveRight,
  Radar,
  Recycle,
  ShieldCheck,
  TriangleAlert,
  Zap,
} from "lucide-react";
import EcoSphereMark from "@/components/EcoSphereMark";

const stages = [
  { id: "monitor", label: "Monitor", title: "Start with a trusted reading.", copy: "The implemented platform foundation persists authenticated meter readings with source, unit, and provenance evidence.", icon: Activity, proof: "Registry + ingestion" },
  { id: "detect", label: "Detect", title: "Make unusual movement visible.", copy: "The server-side monitoring worker turns validated baseline deviation into persisted anomaly and alert evidence.", icon: Radar, proof: "Worker: anomaly → alert" },
  { id: "predict", label: "Predict", title: "Read the short-term direction.", copy: "The protected analytics workspace compares bounded forecast candidates and preserves the selected method with its evidence.", icon: CircleGauge, proof: "Deterministic forecast" },
  { id: "simulate", label: "Simulate", title: "Test the intervention before the budget.", copy: "The protected scenario workspace calculates a versioned, server-authoritative model from explicit assumptions and retained evidence.", icon: Calculator, proof: "Server calculation" },
  { id: "recommend", label: "Recommend", title: "Give the team a practical next move.", copy: "Evidence-linked recommendations expose their rule basis and limits. Explanatory AI must never create environmental numbers.", icon: ShieldCheck, proof: "Evidence-linked action" },
  { id: "act", label: "Act", title: "Close the gap in the real campus.", copy: "The pilot focuses attention on a small set of high-value resource streams and interventions.", icon: Zap, proof: "Pilot-ready scope" },
  { id: "measure", label: "Measure", title: "Return to the same baseline.", copy: "Saved targets, baselines, actions, and later readings make measurement-after-action inspectable; realized savings still require a live pilot.", icon: Activity, proof: "Evidence follow-through" },
];

const evidence = [
  { label: "DATA LINEAGE", value: "PROVENANCED", note: "Demo fixtures are explicitly simulated. Protected readings retain source, unit, and lineage evidence.", icon: Database },
  { label: "NUMERICAL AUTHORITY", value: "SERVER", note: "Protected scenario, score, and monitoring calculations are deterministic and versioned on the server.", icon: Calculator },
  { label: "AI BOUNDARY", value: "CONSTRAINED", note: "Explanatory AI may frame recorded evidence but never supplies numerical authority.", icon: ShieldCheck },
];

const interventions = [
  { id: "hvac", title: "Smart HVAC controls", detail: "Prioritize the biggest energy signal first.", score: "1", icon: Zap, tone: "moss", energy: 18, renewable: 0, water: 0, waste: 0, recycling: 0, investment: 400000 },
  { id: "led", title: "LED upgrade", detail: "Reduce controllable lighting load.", score: "2", icon: CloudSun, tone: "paper", energy: 12, renewable: 0, water: 0, waste: 0, recycling: 0, investment: 300000 },
  { id: "solar", title: "Rooftop solar", detail: "Add renewable contribution in stages.", score: "3", icon: Leaf, tone: "charcoal", energy: 3, renewable: 35, water: 0, waste: 0, recycling: 0, investment: 800000 },
  { id: "water", title: "Water-saving systems", detail: "Tighten consumption at the meter.", score: "4", icon: Droplets, tone: "sand", energy: 0, renewable: 0, water: 25, waste: 10, recycling: 10, investment: 250000 },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Home() {
  const [activeStage, setActiveStage] = useState("detect");
  const [selectedIntervention, setSelectedIntervention] = useState<string | null>(null);
  const [processingPreset, setProcessingPreset] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState("Ready to model an intervention.");
  const stageRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const processingTimer = useRef<number | null>(null);

  const active = stages.find((stage) => stage.id === activeStage) ?? stages[1];
  const ActiveIcon = active.icon;

  function activateStage(index: number) {
    setActiveStage(stages[index].id);
    stageRefs.current[index]?.focus();
  }

  function handleStageKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % stages.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + stages.length) % stages.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = stages.length - 1;
    if (event.key === "Enter" || event.key === " ") nextIndex = index;
    if (nextIndex !== null) {
      event.preventDefault();
      activateStage(nextIndex);
    }
  }

  function applyIntervention(intervention: (typeof interventions)[number]) {
    if (processingPreset) return;
    if (processingTimer.current) window.clearTimeout(processingTimer.current);
    setProcessingPreset(intervention.id);
    setProcessingStatus(`Reviewing ${intervention.title} as a public scenario choice…`);
    processingTimer.current = window.setTimeout(() => {
      setSelectedIntervention(intervention.id);
      setProcessingPreset(null);
      setProcessingStatus(`${intervention.title} selected. Open the protected workspace to calculate using tenant evidence and the server model.`);
      processingTimer.current = null;
    }, 720);
    requestAnimationFrame(() => document.getElementById("simulator")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <main className="site-shell">
      <header className="site-header">
        <a href="/narrative" className="brand-link" aria-label="EcoSphere AI public narrative">
          <EcoSphereMark />
        </a>
        <nav className="top-nav" aria-label="Primary navigation">
          <a href="#loop">The loop</a>
          <a href="#simulator">Scenario engine</a>
          <a href="#pilot">Pilot scope</a>
          <a href="/explore">Workspace map</a>
        </nav>
        <a className="header-cta" href="/">
          Open workspace <ArrowDownRight size={16} />
        </a>
      </header>

      <section id="top" className="hero-section">
        <div className="hero-rail" aria-hidden="true">
          <span>AIEM CAMPUS · 2026</span>
          <i />
          <span>FIELD REPORT 01</span>
        </div>
        <div className="hero-copy">
          <div className="eyebrow"><span className="signal-dot" /> AI-POWERED SUSTAINABILITY MISSION CONTROL</div>
          <h1>Make the next climate action <em>easier to see.</em></h1>
          <p className="hero-lede">
            EcoSphere AI turns campus resource signals into a traceable operations loop—from measurement and anomaly detection to a modeled intervention and its next practical action.
          </p>
          <div className="hero-actions">
            <a className="button button--ink" href="/">
              Open mission control <MoveRight size={18} />
            </a>
            <button className="text-button" onClick={() => scrollToSection("loop")}>
              Explore the pilot narrative <ChevronRight size={17} />
            </button>
          </div>
          <div className="hero-footnote">
            <span>SIMULATED AIEM FIXTURE</span>
            <span>DETERMINISTIC NUMERICAL ENGINE</span>
          </div>
        </div>

        <div className="hero-dossier">
          <img
            src="/manus-storage/ecosphere-hero-mission-control_79db0674.jpg"
            alt="Art-directed mission-control visual of a campus sustainability model"
            className="hero-art"
          />
          <div className="hero-art-overlay" />
          <div className="dossier-topline"><span>LIVE DEMO VIEW</span><span className="dossier-pill">SIMULATED</span></div>
          <div className="dossier-focus">
            <div className="alert-seal"><TriangleAlert size={20} /></div>
            <div>
              <span className="micro-label">DETECTED SIGNAL</span>
              <strong>HVAC load moved outside its baseline band.</strong>
            </div>
          </div>
          <div className="dossier-grid">
            <div><span>RESOURCE</span><b>ENERGY</b></div>
            <div><span>ENGINE</span><b>TRACEABLE</b></div>
            <div><span>NEXT STEP</span><b>REVIEW HVAC</b></div>
          </div>
          <div className="dossier-ticker"><span className="ticker-pulse" /> TARGET: WORKER INDEPENDENT FROM BROWSER</div>
        </div>
      </section>

      <section className="evidence-strip" aria-label="Product truth boundary">
        <div className="evidence-strip__intro">
          <span className="eyebrow">WHY IT IS TRUSTWORTHY</span>
          <p>Numbers are calculated. Language is constrained.</p>
        </div>
        {evidence.map((item) => {
          const Icon = item.icon;
          return (
            <article className="evidence-card" key={item.label}>
              <Icon size={19} strokeWidth={1.7} />
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.note}</p>
            </article>
          );
        })}
      </section>

      <section id="loop" className="loop-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE CLOSED LOOP</span>
            <h2>One signal. A more useful decision.</h2>
          </div>
          <p>EcoSphere treats sustainability management as an observable operating loop, not a static reporting exercise. The readiness workspace marks each production capability honestly.</p>
        </div>

        <div className="process-tape" role="tablist" aria-label="EcoSphere sustainability loop">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const selected = stage.id === activeStage;
            return (
              <button
                key={stage.id}
                className={`process-stop ${selected ? "process-stop--active" : ""}`}
                ref={(node) => { stageRefs.current[index] = node; }}
                onClick={() => setActiveStage(stage.id)}
                onKeyDown={(event) => handleStageKeyDown(event, index)}
                role="tab"
                aria-selected={selected}
                aria-controls="stage-detail"
                tabIndex={selected ? 0 : -1}
              >
                <span className="process-index">0{index + 1}</span>
                <Icon size={18} strokeWidth={1.7} />
                <span>{stage.label}</span>
              </button>
            );
          })}
        </div>

        <div id="stage-detail" className="stage-detail" role="tabpanel">
          <div className="stage-visual"><ActiveIcon size={35} strokeWidth={1.45} /><span>{active.proof}</span></div>
          <div>
            <span className="micro-label">ACTIVE STEP · {active.label.toUpperCase()}</span>
            <h3>{active.title}</h3>
          </div>
          <p>{active.copy}</p>
          <button className="round-action" onClick={() => scrollToSection("simulator")} aria-label="Open the scenario engine"><ArrowDownRight size={22} /></button>
        </div>
      </section>

      <section className="signal-section">
        <div className="signal-photo-wrap">
          <img src="/manus-storage/ecosphere-campus-signal_5a5a962b.jpg" alt="Campus landscape with sustainability infrastructure" />
          <div className="photo-stamp">SOURCE PATH / AIEM CAMPUS PILOT</div>
        </div>
        <div className="signal-copy">
          <span className="eyebrow">NOT ANOTHER REPORTING LAYER</span>
          <h2>From a meter event to an accountable next move.</h2>
          <p>The pilot begins with four high-value streams: HVAC electricity, lighting and plug load, main water, and mixed waste. The scope is intentionally small enough to validate—and specific enough to act on.</p>
          <div className="mini-route">
            <div><Zap size={18}/><span>HVAC<br/><b>electricity</b></span></div>
            <div><CloudSun size={18}/><span>Lighting<br/><b>load</b></span></div>
            <div><Droplets size={18}/><span>Main<br/><b>water</b></span></div>
            <div><Recycle size={18}/><span>Mixed<br/><b>waste</b></span></div>
          </div>
          <div className="signal-quote"><span>“</span><p>The product does not hide its assumptions. It makes the route from signal to action inspectable.</p></div>
        </div>
      </section>

      <section id="simulator" className="simulator-section">
        <div className="simulator-heading">
          <div>
            <span className="eyebrow eyebrow--light">THE SCENARIO ENGINE</span>
            <h2>Test an action before you fund it.</h2>
          </div>
          <p>Choose an intervention to understand the decision path. Numerical outputs are intentionally reserved for the protected server-authoritative scenario workspace, where tenant evidence and factor versions are retained.</p>
        </div>
        <div className="simulator-grid">
          <aside className="control-panel">
            <div className="panel-label"><span>PUBLIC CHOICE</span><span>NO NUMBERS</span></div>
            <div className="slider-row"><span><b>1. Select an intervention</b></span><small>Choose a common campus intervention from the decision queue.</small></div>
            <div className="slider-row"><span><b>2. Authenticate the workspace</b></span><small>Open the tenant-scoped Scenario Workspace with a configured organization.</small></div>
            <div className="slider-row"><span><b>3. Set or apply a baseline</b></span><small>Use explicit model inputs or an accepted-reading meter window; the product does not silently annualize evidence.</small></div>
            <div className="slider-row"><span><b>4. Calculate on the server</b></span><small>Save the calculation version, factor disclosure, modeled SDG contribution, and decision context.</small></div>
            <a className="button button--paper" href="/app/scenarios">Open the verified Scenario Workspace <MoveRight size={17} /></a>
            <div className="control-note"><ShieldCheck size={16} /> Numerical authority: <b>protected server calculation only</b></div>
          </aside>

          <div className="scenario-output">
            <div className="output-topline"><span>CHOICE → EVIDENCE → DECISION</span><span className="simulated-tag">WORKSPACE-GATED</span></div>
            <div className={`scenario-live-status ${processingPreset ? "scenario-live-status--processing" : ""}`} role="status" aria-live="polite" aria-atomic="true">
              <span>{processingPreset ? <><i className="processing-spinner" aria-hidden="true" /> PREPARING CHOICE</> : selectedIntervention ? `SELECTED / ${interventions.find((item) => item.id === selectedIntervention)?.title.toUpperCase()}` : "AWAITING INTERVENTION"}</span>
              <b>{processingPreset ? processingStatus : selectedIntervention ? "Ready for a tenant-evidence calculation." : "Select an intervention; no public numeric result is shown."}</b>
            </div>
            <div className="carbon-bar-wrap">
              <div className="carbon-values"><span>ACCEPTED READING EVIDENCE</span><ArrowDownRight size={18}/><strong>VERSIONED SERVER RESULT</strong></div>
              <div className="carbon-bar"><span style={{ width: "58%" }} /></div>
              <p><b>Why no public number?</b> A carbon, savings, ROI, or payback result is shown only after the protected workspace records the selected inputs, factor set, and modeled-evidence boundary.</p>
            </div>
            <div className="output-stat-grid">
              <div><span>INPUTS</span><strong>Explicit <small>operator-entered</small></strong></div>
              <div><span>BASELINE</span><strong>Accepted <small>reading evidence</small></strong></div>
              <div><span>FACTORS</span><strong>Versioned <small>disclosed</small></strong></div>
              <div><span>CARBON</span><strong>Modeled <small>not certified</small></strong></div>
              <div><span>SAVINGS</span><strong>Estimated <small>not guaranteed</small></strong></div>
              <div><span>DECISION</span><strong>Traceable <small>saved context</small></strong></div>
            </div>
            <div className="sdg-line"><span>PRIMARY OUTCOME</span><b>SDG 13 · Climate Action</b><i /> <span>SUPPORTING</span><b>7 · 9 · 11 · 12 · modeled in workspace</b></div>
          </div>
        </div>
      </section>

      <section className="interventions-section">
        <div className="interventions-copy">
          <span className="eyebrow">INTERVENTION QUEUE</span>
          <h2>Compare the action, not the slogans.</h2>
          <p>For the AIEM pilot, intervention cards start a decision path rather than rank a public mock calculation. Protected scenarios use server-authoritative calculations and retained evidence before actions are considered.</p>
          <img src="/manus-storage/ecosphere-scenario-table_022e21f9.jpg" alt="Field-journal workspace for an intervention scenario review" />
        </div>
        <div className="intervention-list">
          {interventions.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                className={`intervention-card intervention-card--${item.tone} ${selectedIntervention === item.id ? "intervention-card--selected" : ""}`}
                key={item.title}
                onClick={() => applyIntervention(item)}
                disabled={Boolean(processingPreset)}
                aria-pressed={selectedIntervention === item.id}
                aria-busy={processingPreset === item.id}
                aria-label={`Apply ${item.title} scenario preset`}
              >
                <div className="rank">0{item.score}</div>
                <Icon size={23} strokeWidth={1.7} />
                <div><h3>{item.title}</h3><p>{item.detail}</p></div>
                <ArrowUpRight size={20} />
              </button>
            );
          })}
        </div>
      </section>

      <section id="pilot" className="pilot-section">
        <div className="pilot-rail"><span>TRUST THE BOUNDARY</span><i /><span>THEN BUILD THE PILOT</span></div>
        <div className="pilot-layout">
          <div>
            <span className="eyebrow">AIEM CAMPUS PILOT</span>
            <h2>A credible prototype knows where its evidence ends.</h2>
          </div>
          <div className="pilot-notes">
            <p><Check size={17}/> Today’s public narrative uses explicitly simulated visual fixtures and does not produce public numerical sustainability claims.</p>
            <p><Check size={17}/> The protected platform implements tenant registry, audit events, validated meter-reading ingestion, server monitoring, scenarios, targets, and evidence reports.</p>
            <p><Check size={17}/> It is not yet presented as a certified reporting system, live Odoo integration, monitored production tenant system, or guarantee of savings.</p>
            <p><Check size={17}/> The next campus phase adds verified meters or connectors, deployed schedule proof, and measurement-after-action evidence.</p>
          </div>
        </div>
        <div className="closing-statement">
          <EcoSphereMark inverse compact />
          <p>“EcoSphere AI connects persisted resource evidence to server-side monitoring, scenarios, and accountable next actions—without asking a language model to invent environmental numbers.”</p>
        </div>
      </section>

      <footer className="site-footer">
        <EcoSphereMark />
        <p>AIEM IDEAS 2026 · SUSTAINABILITY OPERATIONS PILOT</p>
        <a href="#top">Back to top <ArrowUpRight size={15}/></a>
      </footer>
    </main>
  );
}
