/**
 * Field Operations Ledger style: editorial sustainability mission control.
 * Uses field-paper surfaces, moss ink, provenance labels, and chartreuse only
 * as an operational signal. Numerical outputs are explicit modeled estimates.
 */
import { useMemo, useRef, useState } from "react";
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
  { id: "detect", label: "Detect", title: "Make unusual movement visible.", copy: "The next monitoring service will turn validated baseline deviation into an operational event and alert.", icon: Radar, proof: "Planned: anomaly → alert" },
  { id: "predict", label: "Predict", title: "Read the short-term direction.", copy: "The planned analytics service will provide a bounded forecast with visible assumptions and factor versions.", icon: CircleGauge, proof: "Planned: bounded forecast" },
  { id: "simulate", label: "Simulate", title: "Test the intervention before the budget.", copy: "The public prototype shows transparent modeled inputs; a server-authoritative scenario service is tracked in the readiness workspace.", icon: Calculator, proof: "Prototype scenario" },
  { id: "recommend", label: "Recommend", title: "Give the team a practical next move.", copy: "The planned recommendation service will cite recorded evidence. AI explanations must never create environmental numbers.", icon: ShieldCheck, proof: "Planned: evidence-linked action" },
  { id: "act", label: "Act", title: "Close the gap in the real campus.", copy: "The pilot focuses attention on a small set of high-value resource streams and interventions.", icon: Zap, proof: "Pilot-ready scope" },
  { id: "measure", label: "Measure", title: "Return to the same baseline.", copy: "The operational loop is designed to compare modeled action with later measured evidence once a monitoring worker is deployed.", icon: Activity, proof: "Measurement-after-action" },
];

const evidence = [
  { label: "DATA LINEAGE", value: "SIMULATED", note: "AIEM Campus fixture. The new data foundation records source, unit, and provenance for live inputs.", icon: Database },
  { label: "NUMERICAL AUTHORITY", value: "ENGINE", note: "The prototype calculations are deterministic; authoritative server calculations remain tracked work.", icon: Calculator },
  { label: "AI BOUNDARY", value: "CONSTRAINED", note: "Planned AI explanations will frame recorded evidence and will not invent environmental numbers.", icon: ShieldCheck },
];

const interventions = [
  { id: "hvac", title: "Smart HVAC controls", detail: "Prioritize the biggest energy signal first.", score: "1", icon: Zap, tone: "moss", energy: 18, renewable: 0, water: 0, waste: 0, recycling: 0, investment: 400000 },
  { id: "led", title: "LED upgrade", detail: "Reduce controllable lighting load.", score: "2", icon: CloudSun, tone: "paper", energy: 12, renewable: 0, water: 0, waste: 0, recycling: 0, investment: 300000 },
  { id: "solar", title: "Rooftop solar", detail: "Add renewable contribution in stages.", score: "3", icon: Leaf, tone: "charcoal", energy: 3, renewable: 35, water: 0, waste: 0, recycling: 0, investment: 800000 },
  { id: "water", title: "Water-saving systems", detail: "Tighten consumption at the meter.", score: "4", icon: Droplets, tone: "sand", energy: 0, renewable: 0, water: 25, waste: 10, recycling: 10, investment: 250000 },
];

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Home() {
  const [activeStage, setActiveStage] = useState("detect");
  const [energyReduction, setEnergyReduction] = useState(15);
  const [renewableShare, setRenewableShare] = useState(20);
  const [waterReduction, setWaterReduction] = useState(10);
  const [wasteReduction, setWasteReduction] = useState(10);
  const [recyclingRate, setRecyclingRate] = useState(25);
  const [investment, setInvestment] = useState(500000);
  const [selectedIntervention, setSelectedIntervention] = useState("custom");
  const [processingPreset, setProcessingPreset] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState("Ready to model an intervention.");
  const stageRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const processingTimer = useRef<number | null>(null);

  const active = stages.find((stage) => stage.id === activeStage) ?? stages[1];
  const ActiveIcon = active.icon;

  const model = useMemo(() => {
    const baseline = { energy: 9780, water: 1270, waste: 985, carbon: 6420 };
    const annualEnergySaved = baseline.energy * (energyReduction / 100);
    const electricityCarbon = baseline.carbon * 0.72;
    const waterCarbon = baseline.carbon * 0.12;
    const wasteCarbon = baseline.carbon * 0.16;
    const directReduction = electricityCarbon * (energyReduction / 100);
    const renewableReduction = electricityCarbon * (1 - energyReduction / 100) * (renewableShare / 100);
    const waterCarbonReduction = waterCarbon * (waterReduction / 100);
    const wasteCarbonReduction = wasteCarbon * (wasteReduction / 100);
    const recyclingCarbonReduction = wasteCarbon * (1 - wasteReduction / 100) * (recyclingRate / 100);
    const carbonReduction = directReduction + renewableReduction + waterCarbonReduction + wasteCarbonReduction + recyclingCarbonReduction;
    const projectedCarbon = Math.max(0, baseline.carbon - carbonReduction);
    const annualWaterSaved = baseline.water * (waterReduction / 100);
    const divertedWaste = baseline.waste * (1 - wasteReduction / 100) * (recyclingRate / 100);
    const avoidedWaste = baseline.waste * (wasteReduction / 100) + divertedWaste;
    const annualSavings = annualEnergySaved * 9.2 + annualWaterSaved * 56 + avoidedWaste * 4.2 + renewableShare * 1450;
    const payback = annualSavings > 0 ? investment / annualSavings : 0;
    const roi = investment > 0 ? ((annualSavings * 3 - investment) / investment) * 100 : 0;

    return {
      ...baseline,
      annualEnergySaved,
      annualWaterSaved,
      avoidedWaste,
      projectedCarbon,
      carbonReduction,
      annualSavings,
      payback,
      roi,
    };
  }, [energyReduction, renewableShare, waterReduction, wasteReduction, recyclingRate, investment]);

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
    setProcessingStatus(`Processing ${intervention.title} against the AIEM Campus baseline…`);
    processingTimer.current = window.setTimeout(() => {
      setEnergyReduction(intervention.energy);
      setRenewableShare(intervention.renewable);
      setWaterReduction(intervention.water);
      setWasteReduction(intervention.waste);
      setRecyclingRate(intervention.recycling);
      setInvestment(intervention.investment);
      setSelectedIntervention(intervention.id);
      setProcessingPreset(null);
      setProcessingStatus(`${intervention.title} preset applied. Modeled outputs updated.`);
      processingTimer.current = null;
    }, 720);
    requestAnimationFrame(() => document.getElementById("simulator")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function setScenarioValue(setter: (value: number) => void, value: number) {
    setter(value);
    setSelectedIntervention("custom");
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
          <p>Adjust the transparent assumptions. The output below is a browser-side representation of the pilot’s deterministic scenario logic, not a guarantee of realized impact.</p>
        </div>
        <div className="simulator-grid">
          <aside className="control-panel">
            <div className="panel-label"><span>SCENARIO / A</span><span>MODELED</span></div>
            <label className="slider-row">
              <span><b>Energy reduction</b><output>{energyReduction}%</output></span>
              <input type="range" min="0" max="35" value={energyReduction} onChange={(event) => setScenarioValue(setEnergyReduction, Number(event.target.value))} />
              <small>Demand-side action against energy baseline</small>
            </label>
            <label className="slider-row">
              <span><b>Renewable contribution</b><output>{renewableShare}%</output></span>
              <input type="range" min="0" max="50" value={renewableShare} onChange={(event) => setScenarioValue(setRenewableShare, Number(event.target.value))} />
              <small>Modeled share of remaining electricity emissions</small>
            </label>
            <label className="slider-row">
              <span><b>Water reduction</b><output>{waterReduction}%</output></span>
              <input type="range" min="0" max="40" value={waterReduction} onChange={(event) => setScenarioValue(setWaterReduction, Number(event.target.value))} />
              <small>Demand-side action against main-water baseline</small>
            </label>
            <label className="slider-row">
              <span><b>Waste reduction</b><output>{wasteReduction}%</output></span>
              <input type="range" min="0" max="40" value={wasteReduction} onChange={(event) => setScenarioValue(setWasteReduction, Number(event.target.value))} />
              <small>Modeled source reduction before disposal</small>
            </label>
            <label className="slider-row">
              <span><b>Recycling contribution</b><output>{recyclingRate}%</output></span>
              <input type="range" min="0" max="60" value={recyclingRate} onChange={(event) => setScenarioValue(setRecyclingRate, Number(event.target.value))} />
              <small>Modeled share of remaining waste diverted from disposal</small>
            </label>
            <label className="slider-row">
              <span><b>Investment</b><output>{formatINR(investment)}</output></span>
              <input type="range" min="100000" max="1500000" step="50000" value={investment} onChange={(event) => setScenarioValue(setInvestment, Number(event.target.value))} />
              <small>Transparent scenario input, not a procurement quote</small>
            </label>
            <div className="control-note"><ShieldCheck size={16} /> Numerical source: <b>scenario calculation engine</b></div>
          </aside>

          <div className="scenario-output">
            <div className="output-topline"><span>BEFORE → AFTER</span><span className="simulated-tag">SIMULATED RESULT</span></div>
            <div className={`scenario-live-status ${processingPreset ? "scenario-live-status--processing" : ""}`} role="status" aria-live="polite" aria-atomic="true">
              <span>{processingPreset ? <><i className="processing-spinner" aria-hidden="true" /> PROCESSING PRESET</> : selectedIntervention === "custom" ? "CUSTOM SCENARIO" : `PRESET / ${interventions.find((item) => item.id === selectedIntervention)?.title.toUpperCase()}`}</span>
              <b>{processingPreset ? processingStatus : `${Math.round(model.carbonReduction).toLocaleString()} kgCO₂e modeled reduction`}</b>
            </div>
            <div className="carbon-bar-wrap">
              <div className="carbon-values"><span>{model.carbon.toLocaleString()} kgCO₂e</span><ArrowDownRight size={18}/><strong>{Math.round(model.projectedCarbon).toLocaleString()} kgCO₂e</strong></div>
              <div className="carbon-bar"><span style={{ width: `${Math.min(100, (model.projectedCarbon / model.carbon) * 100)}%` }} /></div>
              <p><b>{Math.round(model.carbonReduction).toLocaleString()} kgCO₂e</b> modeled reduction from the selected inputs.</p>
            </div>
            <div className="output-stat-grid">
              <div><span>ENERGY AVOIDED</span><strong>{Math.round(model.annualEnergySaved).toLocaleString()} <small>kWh/yr</small></strong></div>
              <div><span>WATER AVOIDED</span><strong>{Math.round(model.annualWaterSaved).toLocaleString()} <small>m³/yr</small></strong></div>
              <div><span>WASTE AVOIDED</span><strong>{Math.round(model.avoidedWaste).toLocaleString()} <small>kg/yr</small></strong></div>
              <div><span>ANNUAL SAVINGS</span><strong>{formatINR(model.annualSavings)}</strong></div>
              <div><span>PAYBACK</span><strong>{model.payback > 0 ? `${model.payback.toFixed(1)} yrs` : "—"}</strong></div>
              <div><span>3-YEAR ROI</span><strong>{Math.round(model.roi)}<small>%</small></strong></div>
            </div>
            <div className="sdg-line"><span>PRIMARY OUTCOME</span><b>SDG 13 · Climate Action</b><i /> <span>SUPPORTING</span><b>7 · 9 · 11 · 12</b></div>
          </div>
        </div>
      </section>

      <section className="interventions-section">
        <div className="interventions-copy">
          <span className="eyebrow">INTERVENTION QUEUE</span>
          <h2>Compare the action, not the slogans.</h2>
          <p>For the AIEM pilot, intervention cards are ranked as a decision-support view. The current browser model is illustrative; production actions require server-authoritative calculations and recorded evidence.</p>
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
            <p><Check size={17}/> Today’s public demo uses deterministic simulated readings and a transparent browser-side calculation model.</p>
            <p><Check size={17}/> The protected platform foundation now adds identity, tenant registry, audit events, and validated meter-reading ingestion.</p>
            <p><Check size={17}/> It is not yet presented as a certified reporting system, live Odoo integration, monitored production tenant system, or guarantee of savings.</p>
            <p><Check size={17}/> The next campus phase adds verified meters, factors, durable analytics workers, alerts, and measurement-after-action.</p>
          </div>
        </div>
        <div className="closing-statement">
          <EcoSphereMark inverse compact />
          <p>“EcoSphere AI now secures the path to persisted resource data; its next services detect change, run server-side scenarios, and explain the next action—without asking a language model to invent environmental numbers.”</p>
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
