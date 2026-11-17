import { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BatteryCharging, BookOpen,
  CheckCircle2, CircleHelp, Cpu, Download, Droplets, ExternalLink, Flower2,
  GitBranch, HeartPulse, Leaf, Lightbulb, Link2, Moon, Network, Pause,
  Play, Radio, RotateCcw, ShieldCheck, SlidersHorizontal, Sparkles, Sprout,
  Sun, TreePine, Waves, Wind, Zap
} from 'lucide-react';
import {
  buildLinks, createInitialState, DEFAULT_CONTROLS, HUB_ID,
  MAX_CHARGE_MJ, stepSimulation, summarize
} from './sim.js';

const REPO = 'https://github.com/MichaelWave369/PhiBioMesh';
const WORLD = { width: 1000, height: 650 };
const point = node => ({ x: node.x * 10, y: node.y * 6.5 });
const one = value => Number(value).toFixed(1);
const pct = value => Math.round(value) + '%';

function Mark({ small = false }) {
  return <div className={'brand-mark' + (small ? ' brand-mark-small' : '')} aria-hidden="true">
    <span>Φ</span><i />
  </div>;
}

function MiniMetric({ icon: Icon, label, value, sub, tone = 'neutral' }) {
  return <div className="metric">
    <div className="metric-top"><span>{label}</span><Icon size={17} strokeWidth={1.8} /></div>
    <div className="metric-value">{value}</div>
    <div className={'metric-sub ' + tone}>{sub}</div>
  </div>;
}

function RangeControl({ icon: Icon, label, value, min, max, unit = '%', onChange, helper }) {
  return <label className="range-control">
    <span className="range-heading"><span className="range-name"><Icon size={15} /> {label}</span><strong>{value}{unit}</strong></span>
    <input type="range" min={min} max={max} step="1" value={value} onChange={event => onChange(Number(event.target.value))}
      style={{ '--progress': ((value - min) / (max - min) * 100) + '%' }} />
    {helper && <small>{helper}</small>}
  </label>;
}

function SignalChart({ history, id }) {
  const points = history.map((value, index) =>
    (index * 300 / Math.max(1, history.length - 1)).toFixed(1) + ',' + (108 - value).toFixed(1)
  ).join(' ');
  const fillPoints = '0,108 ' + points + ' 300,108';
  return <svg className="spark-chart" viewBox="0 0 300 116" preserveAspectRatio="none" role="img"
    aria-label={'Synthetic biosignal history for ' + id}>
    <defs><linearGradient id="signal-fill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#baff9b" stopOpacity=".25" />
      <stop offset="1" stopColor="#baff9b" stopOpacity="0" />
    </linearGradient></defs>
    {[22, 56, 90].map(y => <line key={y} x1="0" x2="300" y1={y} y2={y} className="chart-guide" />)}
    <polygon points={fillPoints} fill="url(#signal-fill)" />
    <polyline points={points} fill="none" stroke="#b7fda3" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

function NodeGlyph({ type }) {
  if (type === 'gateway') return <text className="glyph-phi" textAnchor="middle" dominantBaseline="middle">Φ</text>;
  if (type === 'flower') return <Flower2 x="-12" y="-12" width="24" height="24" strokeWidth="1.8" />;
  if (type === 'fern') return <Leaf x="-12" y="-12" width="24" height="24" strokeWidth="1.8" />;
  if (type === 'fungus') return <Sprout x="-12" y="-12" width="24" height="24" strokeWidth="1.8" />;
  return <TreePine x="-12" y="-12" width="24" height="24" strokeWidth="1.8" />;
}

function ForestMap({ nodes, links, selectedId, onSelect, recentPackets, step, lighting }) {
  const byId = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);
  const packetSegments = recentPackets.flatMap(packet => packet.path.slice(0, -1).map((from, i) => ({
    from: byId.get(from), to: byId.get(packet.path[i + 1]), key: packet.source + '-' + i
  })));
  const selected = byId.get(selectedId);
  return <div className="forest-scene">
    <div className="forest-watermark">BIOSPHERE / SECTOR 01</div>
    <svg viewBox={'0 0 ' + WORLD.width + ' ' + WORLD.height} className="forest-svg"
      role="group" aria-label="Interactive nine-node modeled forest network">
      <defs>
        <radialGradient id="forest-aura"><stop offset="0" stopColor="#1f7d59" stopOpacity=".22" />
          <stop offset=".67" stopColor="#0e3b2b" stopOpacity=".1" /><stop offset="1" stopColor="#06120e" stopOpacity="0" /></radialGradient>
        <radialGradient id="node-fill"><stop offset="0" stopColor="#1c4635" /><stop offset="1" stopColor="#10251c" /></radialGradient>
        <filter id="halo"><feGaussianBlur stdDeviation="10" /></filter>
        <pattern id="map-grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#335b4a" strokeWidth=".6" opacity=".25" />
        </pattern>
      </defs>
      <rect width="1000" height="650" fill="url(#forest-aura)" />
      <rect width="1000" height="650" fill="url(#map-grid)" />
      <g fill="none" stroke="#438568" strokeWidth="1" opacity=".11">
        <path d="M-90 160 Q190 -10 390 100 T1080 160" />
        <path d="M-90 193 Q190 23 390 133 T1080 193" />
        <path d="M-90 226 Q190 56 390 166 T1080 226" />
        <path d="M-90 529 Q160 350 460 485 T1110 455" />
        <path d="M-90 564 Q160 385 460 520 T1110 490" />
        <path d="M-90 598 Q160 420 460 554 T1110 524" />
      </g>
      <g className="canopy-shadows">
        <ellipse cx="230" cy="180" rx="154" ry="122" />
        <ellipse cx="700" cy="225" rx="220" ry="146" />
        <ellipse cx="415" cy="505" rx="275" ry="121" />
        <ellipse cx="835" cy="540" rx="135" ry="124" />
      </g>
      {selected && <circle className="selection-radius" cx={point(selected).x} cy={point(selected).y}
        r="103" fill="none" stroke="#b2e99f" strokeDasharray="5 10" />}
      {links.map(link => {
        const a = point(byId.get(link.from));
        const b = point(byId.get(link.to));
        const adjacent = link.from === selectedId || link.to === selectedId;
        return <line key={link.from + '-' + link.to} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
          className={'mesh-link' + (adjacent ? ' mesh-link-selected' : '')} />;
      })}
      {packetSegments.map(segment => {
        if (!segment.from || !segment.to) return null;
        const a = point(segment.from), b = point(segment.to);
        return <circle key={step - (step % 3) + '-' + segment.key} r="5" fill="#d2ffa8" className="packet-dot">
          <animateMotion dur="2.3s" fill="freeze" path={'M ' + a.x + ' ' + a.y + ' L ' + b.x + ' ' + b.y} />
        </circle>;
      })}
      {nodes.map(node => {
        const p = point(node);
        const active = node.charge > 1;
        const selectedNode = node.id === selectedId;
        const isGateway = node.id === HUB_ID;
        return <g key={node.id} role="button" tabIndex="0" aria-label={'Inspect ' + node.name + ', ' + node.id}
          onClick={() => onSelect(node.id)}
          onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(node.id); } }}
          className={'forest-node' + (selectedNode ? ' is-selected' : '') + (!active ? ' is-offline' : '')}
          transform={'translate(' + p.x + ' ' + p.y + ')'}>
          {lighting && active && <circle r={isGateway ? '67' : '54'} fill="#87eeb4" opacity={selectedNode ? '.2' : '.085'} filter="url(#halo)" />}
          {isGateway && <circle r="54" fill="none" stroke="#82e9bb" strokeDasharray="3 8" opacity=".45" />}
          {selectedNode && <circle className="node-ripple" r="44" fill="none" stroke="#c4ffac" />}
          <circle r={selectedNode ? '39' : '34'} fill="url(#node-fill)"
            stroke={active ? (selectedNode ? '#c0f99d' : '#58977d') : '#6b756a'} strokeWidth={selectedNode ? '2.5' : '1.4'} />
          <circle r="26" fill={active ? '#193d2a' : '#292d2a'} opacity=".95" />
          <g className="node-glyph" stroke={active ? '#d6ffbb' : '#8b9a8d'} fill="none">
            <NodeGlyph type={node.type} />
          </g>
          <circle cx="27" cy="-28" r="5.5" fill={active ? '#b5ff8e' : '#ff9b7f'} stroke="#071610" strokeWidth="3" />
          <text className="node-name" textAnchor="middle" y="61">{node.name}</text>
          <text className="node-id" textAnchor="middle" y="79">{node.id} · {Math.round(node.signal)} AU</text>
        </g>;
      })}
    </svg>
    <div className="map-overlay top-left"><span className="pulse-indicator" /> LIVE TOPOLOGY <span className="overlay-separator">/</span> 9 BIO-NODES</div>
    <div className="map-overlay top-right"><Radio size={13} /> RADIO MESH · SIMULATED</div>
    <div className="map-hint"><span className="hint-dot" /> SELECT A NODE TO INSPECT ITS SIGNAL</div>
    <div className="map-compass"><span>N</span><span className="compass-cross">✳</span><span>S</span></div>
  </div>;
}

function exportSnapshot(sim, controls) {
  const data = {
    schema: 'phibiomesh.snapshot.v1',
    exportedAt: new Date().toISOString(),
    provenance: 'SIMULATED — no live biological measurements or radio devices',
    controls, summary: summarize(sim, controls.range), simulation: sim,
  };
  const file = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'phibiomesh-sim-' + sim.step + '.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function App() {
  const [sim, setSim] = useState(createInitialState);
  const [controls, setControls] = useState(DEFAULT_CONTROLS);
  const [running, setRunning] = useState(true);
  const [selectedId, setSelectedId] = useState(HUB_ID);
  const [detailTab, setDetailTab] = useState('signal');
  const links = useMemo(() => buildLinks(sim.nodes, controls.range), [sim.nodes, controls.range]);
  const metrics = useMemo(() => summarize(sim, controls.range), [sim, controls.range]);
  const selected = sim.nodes.find(n => n.id === selectedId) || sim.nodes[4];

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => setSim(previous => stepSimulation(previous, controls)), 750);
    return () => window.clearInterval(timer);
  }, [running, controls]);

  const change = key => value => setControls(previous => ({ ...previous, [key]: value }));
  const presets = [
    { name: 'Equilibrium', icon: Leaf, settings: { sunlight: 68, moisture: 64, disturbance: 14, range: 39 } },
    { name: 'Drought', icon: Sun, settings: { sunlight: 92, moisture: 12, disturbance: 38, range: 39 } },
    { name: 'Interference', icon: Wind, settings: { sunlight: 44, moisture: 70, disturbance: 85, range: 27 } },
  ];
  const reset = () => { setSim(createInitialState()); setControls(DEFAULT_CONTROLS); setRunning(true); setSelectedId(HUB_ID); };
  const step = () => setSim(previous => stepSimulation(previous, controls));

  return <div className="app-shell">
    <header className="topbar">
      <div className="topbar-inner">
        <a href="#top" className="identity"><Mark /><span>ΦBIOMESH<small>RESONANT BIOSPHERE LAB</small></span></a>
        <nav aria-label="Main navigation" className="top-links">
          <a href="#laboratory" className="active-link">The laboratory</a>
          <a href="#methodology">The science</a>
          <a href="#roadmap">Roadmap</a>
        </nav>
        <a className="github-link" href={REPO} target="_blank" rel="noopener noreferrer"><GitBranch size={16} /> <span>GitHub repository</span><ExternalLink size={13} /></a>
      </div>
    </header>

    <main id="top">
      <section className="hero wrap">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> OPEN RESEARCH INITIATIVE <span className="eyebrow-index">/ 001</span></div>
          <h1>What if our networks <em>grew</em> with us?</h1>
          <p>A living-systems-inspired laboratory exploring biological signals, adaptive communication, and light that responds to the world around it.</p>
          <div className="hero-actions">
            <a href="#laboratory" className="primary-button"><Activity size={17} /> Enter live simulation <ArrowRight size={16} /></a>
            <a href="#methodology" className="text-button">Explore the science <ArrowUpRight size={16} /></a>
          </div>
          <div className="hero-footnote"><ShieldCheck size={14} /> No live organisms connected. All biosignals and energy budgets are simulated.</div>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit orbit-outer"/><div className="orbit orbit-mid"/><div className="orbit orbit-inner"/>
          <div className="orbit-core"><TreePine size={52} strokeWidth={1} /><span>Φ</span></div>
          <span className="orbit-point a"/><span className="orbit-point b"/><span className="orbit-point c"/><span className="orbit-point d"/>
          <div className="orbit-legend top">BIO / SIGNAL</div><div className="orbit-legend bottom">DATA / LIGHT</div>
        </div>
      </section>

      <section id="laboratory" className="lab-section wrap">
        <div className="section-heading">
          <div><div className="eyebrow">01 / INTERACTIVE FIELD LAB</div><h2>The forest is listening<span className="green-dot">.</span></h2><p>Watch a synthetic ecosystem exchange data across a low-power radio mesh.</p></div>
          <div className="lab-badges"><span className="lab-badge"><span className="blink" /> {running ? 'SIMULATION RUNNING' : 'SIMULATION PAUSED'}</span><span className="lab-badge neutral">MODEL v0.1</span></div>
        </div>
        <div className="metrics">
          <MiniMetric icon={Sprout} label="ACTIVE BIO-NODES" value={metrics.online + ' / ' + metrics.total} sub="Plant-associated sensor hosts" tone="good" />
          <MiniMetric icon={Radio} label="PACKETS DELIVERED" value={metrics.delivered.toLocaleString()} sub={one(metrics.success) + '% modeled delivery rate'} tone="good" />
          <MiniMetric icon={BatteryCharging} label="STORED MODEL ENERGY" value={Math.round(metrics.stored) + ' mJ'} sub="Across all nine virtual batteries" />
          <MiniMetric icon={Waves} label="CANOPY STRESS" value={pct(metrics.stress)} sub="Synthetic relative index" tone={metrics.stress > 55 ? 'warn' : 'good'} />
        </div>

        <div className="lab-layout">
          <div className="map-column">
            <div className="panel map-panel">
              <div className="panel-header"><div><span className="panel-kicker">NETWORK VISUALIZER</span><h3>Living canopy <span>/ Mesh topology</span></h3></div><div className="panel-actions"><button className="icon-button" onClick={() => setRunning(value => !value)} aria-label={running ? 'Pause simulation' : 'Resume simulation'} title={running ? 'Pause' : 'Resume'}>{running ? <Pause size={17} /> : <Play size={17} />}</button><button className="icon-button" onClick={reset} aria-label="Reset simulation" title="Reset all"><RotateCcw size={17} /></button></div></div>
              <ForestMap nodes={sim.nodes} links={links} selectedId={selectedId} onSelect={setSelectedId}
                recentPackets={sim.recentPackets} step={sim.step} lighting={controls.lighting} />
              <div className="map-footer"><div><span className="legend-link" /> Healthy radio connection <span className="legend-node" /> Sensor host <span className="legend-active" /> Active packet</div><span>{links.length} links · {sim.step} model ticks</span></div>
            </div>

            <div className="bottom-grid">
              <div className="panel inspection-panel">
                <div className="panel-header compact"><div><span className="panel-kicker">NODE INSPECTOR</span><h3>{selected.name}<span> / {selected.id}</span></h3></div><span className={'status-pill ' + (selected.charge > 1 ? 'online' : 'offline')}>{selected.charge > 1 ? 'ONLINE' : 'OFFLINE'}</span></div>
                <div className="inspector-meta"><span><Leaf size={14} /> {selected.species}</span><span><Radio size={14} /> {selected.type === 'gateway' ? 'Gateway + radio' : 'Sensor + radio'}</span></div>
                <div className="inspector-tabs" role="tablist" aria-label="Node inspection view">
                  <button role="tab" aria-selected={detailTab === 'signal'} className={detailTab === 'signal' ? 'selected' : ''} onClick={() => setDetailTab('signal')}>Bio-signal</button>
                  <button role="tab" aria-selected={detailTab === 'energy'} className={detailTab === 'energy' ? 'selected' : ''} onClick={() => setDetailTab('energy')}>Energy budget</button>
                </div>
                {detailTab === 'signal' ? <>
                  <div className="signal-head"><div><span>RELATIVE SIGNAL INTENSITY</span><strong>{selected.signal} <small>AU</small></strong></div><span className="signal-live"><Activity size={13} /> SYNTHETIC</span></div>
                  <SignalChart history={selected.history} id={selected.id} />
                  <div className="inspection-footer"><span>Recent model ticks →</span><span>Stress response {pct(selected.stress)}</span></div>
                </> : <>
                  <div className="energy-head"><span>VIRTUAL BATTERY CHARGE</span><strong>{one(selected.charge)} <small>/ {MAX_CHARGE_MJ} mJ</small></strong></div>
                  <div className="energy-track"><i style={{ width: (selected.charge / MAX_CHARGE_MJ * 100) + '%' }} /></div>
                  <div className="budget-grid"><div><span>HARVEST / TICK</span><strong>+{selected.harvest.toFixed(3)} mJ</strong></div><div><span>IDLE + LIGHT / TICK</span><strong>-{selected.load.toFixed(3)} mJ</strong></div></div>
                  <div className="budget-note">Transmission and reception draw additional modeled energy during radio cycles.</div>
                </>}
              </div>
              <div className="panel activity-panel">
                <div className="panel-header compact"><div><span className="panel-kicker">FIELD JOURNAL</span><h3>Recent activity</h3></div><span className="journal-pulse"><span /></span></div>
                <div className="event-list" aria-live="polite">
                  {sim.events.slice(0, 5).map((event, index) => <div className="event" key={event.step + '-' + index}>
                    <span className={'event-dot ' + event.type} /><div><p>{event.message}</p><small>TICK {String(event.step).padStart(4, '0')}</small></div>
                  </div>)}
                </div>
              </div>
            </div>
          </div>

          <aside className="panel controls-panel" aria-label="Experiment controls">
            <div className="control-title"><div className="panel-kicker">EXPERIMENT STATION</div><div className="control-title-row"><h3>Shape the environment</h3><SlidersHorizontal size={19} /></div><p>Change conditions and watch the modeled ecosystem respond.</p></div>
            <div className="preset-title">SCENARIO PRESETS</div>
            <div className="preset-row">
              {presets.map(preset => <button key={preset.name} className="preset" onClick={() => setControls(previous => ({ ...previous, ...preset.settings }))}>
                <preset.icon size={16}/><span>{preset.name}</span>
              </button>)}
            </div>
            <div className="control-divider" />
            <RangeControl icon={Sun} label="Sunlight intensity" value={controls.sunlight} min={0} max={100} onChange={change('sunlight')} helper="Affects modeled solar harvesting & heat response" />
            <RangeControl icon={Droplets} label="Soil moisture" value={controls.moisture} min={0} max={100} onChange={change('moisture')} helper="Affects modeled stress & bio-energy contribution" />
            <RangeControl icon={Waves} label="Environmental disturbance" value={controls.disturbance} min={0} max={100} onChange={change('disturbance')} helper="Perturbs the synthetic biosignal waveform" />
            <RangeControl icon={Radio} label="Radio reach" value={controls.range} min={15} max={58} unit=" units" onChange={change('range')} helper="Change connectivity and multi-hop packet delivery" />
            <div className="control-divider" />
            <div className="toggle-row"><div><div className="toggle-label"><Lightbulb size={17} /> Responsive light load</div><p>Include modeled illumination draw</p></div><button type="button" className={'switch ' + (controls.lighting ? 'on' : '')} role="switch" aria-checked={controls.lighting} aria-label="Responsive light load" onClick={() => change('lighting')(!controls.lighting)}><span /></button></div>
            <div className="control-actions"><button className="run-button" onClick={() => setRunning(value => !value)}>{running ? <Pause size={17} /> : <Play size={17} />}{running ? 'Pause experiment' : 'Resume experiment'}</button><button className="single-button" onClick={step} title="Advance one simulated tick" aria-label="Step simulation once"><ArrowRight size={17} /></button></div>
            <button className="export-button" onClick={() => exportSnapshot(sim, controls)}><Download size={16} /> Export simulation snapshot <ArrowUpRight size={14} /></button>
            <div className="ethics-note"><ShieldCheck size={18} /><p><strong>Protect the living.</strong> No real plants, people, or networks are connected. All energy and physiology values are illustrative.</p></div>
          </aside>
        </div>
      </section>

      <section id="methodology" className="method-section wrap">
        <div className="section-heading"><div><div className="eyebrow">02 / GROUNDED EXPLORATION</div><h2>Biology meets engineering<span className="green-dot">.</span></h2><p>Three real research directions. One honest experimental boundary.</p></div></div>
        <div className="method-grid">
          <article className="method-card"><div className="method-icon"><HeartPulse size={23} /></div><div className="method-number">01 / SENSING</div><h3>Biological signals</h3><p>Plants can exhibit electrical and chemical responses to changes in their environment. Future hardware could measure signals with non-invasive sensors.</p><span className="truth-label"><CheckCircle2 size={13} /> Real phenomenon · simulated here</span></article>
          <article className="method-card"><div className="method-icon"><Network size={23} /></div><div className="method-number">02 / COMMUNICATION</div><h3>Low-power mesh</h3><p>Packets move between modeled radio modules attached to sensor hosts. Trees and fungal roots are not assumed to function as digital packet networks.</p><span className="truth-label"><CheckCircle2 size={13} /> Established radio principle</span></article>
          <article className="method-card"><div className="method-icon"><Zap size={23} /></div><div className="method-number">03 / ENERGY</div><h3>Harvest and respond</h3><p>Solar and microbial energy harvesting motivate the model, while light has a cost. Model units are illustrative, not measured field performance.</p><span className="truth-label amber"><CircleHelp size={13} /> Feasibility depends on hardware</span></article>
        </div>
        <div className="boundary"><ShieldCheck size={21} /><div><strong>Research boundary</strong><p>ΦBioMesh does not claim trees are antennas, that fungi are an internet, that simulated waveforms are measured plant voltages, or that biological energy can replace the power grid. The aim is to design measurable experiments, not claim discoveries in advance.</p></div></div>
      </section>

      <section id="roadmap" className="roadmap-section wrap">
        <div className="roadmap-intro"><div className="eyebrow">03 / THE WAY FORWARD</div><h2>From simulation<br/>to living laboratory<span className="green-dot">.</span></h2><p>Build safely, test openly, measure honestly. Every phase should make the next claim more falsifiable.</p><a href={REPO} target="_blank" rel="noopener noreferrer" className="text-button">Collaborate on GitHub <ArrowUpRight size={16}/></a></div>
        <div className="roadmap-list">
          <div className="roadmap-item now"><div className="roadmap-marker">01</div><div><div className="roadmap-heading"><h3>The digital forest</h3><span>PHASE 1</span></div><p>Nine nodes, synthetic signals, route finding, virtual energy, and exportable telemetry.</p></div><CheckCircle2 size={20} className="roadmap-check" /></div>
          <div className="roadmap-item"><div className="roadmap-marker">02</div><div><div className="roadmap-heading"><h3>Repeatable experiments</h3><span>PHASE 2</span></div><p>Benchmark scenarios, interference models, graph comparisons, and verified unit conversions.</p></div></div>
          <div className="roadmap-item"><div className="roadmap-marker">03</div><div><div className="roadmap-heading"><h3>Non-invasive sensor bridge</h3><span>PHASE 3</span></div><p>Opt-in hardware adapter for plant sensors, ESP32 radios, and carefully measured power budgets.</p></div></div>
          <div className="roadmap-item"><div className="roadmap-marker">04</div><div><div className="roadmap-heading"><h3>Open ecological fieldwork</h3><span>PHASE 4</span></div><p>Community observations with consent, privacy, data provenance, and ecosystem protections.</p></div></div>
        </div>
      </section>
    </main>

    <footer className="footer"><div className="wrap footer-inner"><div className="footer-brand"><Mark small /><div><strong>ΦBIOMESH</strong><span>THE RESONANT BIOSPHERE LAB</span></div></div><p>Life is not the fuel to be consumed.<br/>Life is the environment the network must protect.</p><a href={REPO} target="_blank" rel="noopener noreferrer">OPEN SOURCE / MIT <ArrowUpRight size={15}/></a></div></footer>
  </div>;
}

export default App;
