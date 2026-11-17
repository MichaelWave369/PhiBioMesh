/**
 * ΦBioMesh illustrative simulation.
 * All quantities are synthetic model values, NOT measured plant electrophysiology,
 * sensor power draw, antenna performance, or fuel-cell output.
 * Each node represents a plant-associated sensor/radio, not a biological modem.
 */
export const MAX_CHARGE_MJ = 120;
export const HUB_ID = 'N05';

export const SEEDS = [
  { id: 'N01', name: 'Elder Oak', species: 'Quercus', type: 'tree', x: 21, y: 19 },
  { id: 'N02', name: 'Silver Birch', species: 'Betula', type: 'tree', x: 51, y: 15 },
  { id: 'N03', name: 'Sunflower', species: 'Helianthus', type: 'flower', x: 78, y: 23 },
  { id: 'N04', name: 'Willow', species: 'Salix', type: 'tree', x: 13, y: 49 },
  { id: 'N05', name: 'Heartwood', species: 'Forest gateway', type: 'gateway', x: 49, y: 49 },
  { id: 'N06', name: 'Wildflower', species: 'Meadow mix', type: 'flower', x: 86, y: 53 },
  { id: 'N07', name: 'Fern Colony', species: 'Polypodiopsida', type: 'fern', x: 21, y: 79 },
  { id: 'N08', name: 'Mycelium', species: 'Fungal root zone', type: 'fungus', x: 52, y: 83 },
  { id: 'N09', name: 'Young Maple', species: 'Acer', type: 'tree', x: 81, y: 80 },
];

export const DEFAULT_CONTROLS = Object.freeze({
  sunlight: 68,
  moisture: 64,
  disturbance: 14,
  range: 39,
  lighting: true,
});

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function buildLinks(nodes, range = 39) {
  const result = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance <= range && a.charge > 1 && b.charge > 1) {
        result.push({ from: a.id, to: b.id, distance: Math.round(distance * 10) / 10 });
      }
    }
  }
  return result;
}

export function shortestRoute(nodes, links, source, target = HUB_ID) {
  const active = new Set(nodes.filter(n => n.charge > 1).map(n => n.id));
  if (!active.has(source) || !active.has(target)) return null;
  if (source === target) return [source];
  const adjacency = new Map(nodes.map(n => [n.id, []]));
  for (const link of links) {
    adjacency.get(link.from)?.push(link.to);
    adjacency.get(link.to)?.push(link.from);
  }
  const queue = [[source]];
  const visited = new Set([source]);
  while (queue.length) {
    const path = queue.shift();
    const current = path[path.length - 1];
    for (const next of adjacency.get(current) || []) {
      if (visited.has(next)) continue;
      const candidate = [...path, next];
      if (next === target) return candidate;
      visited.add(next);
      queue.push(candidate);
    }
  }
  return null;
}

export function createInitialState() {
  return {
    step: 0,
    nodes: SEEDS.map((seed, i) => ({
      ...seed,
      charge: 76 + (i % 4) * 8,
      signal: 36 + (i * 7) % 28,
      stress: 15,
      harvest: 0,
      load: 0,
      history: Array.from({ length: 25 }, (_, k) =>
        39 + 10 * Math.sin(k * 0.34 + i * 0.7)
      ),
    })),
    delivered: 0,
    dropped: 0,
    transmitted: 0,
    harvested: 0,
    consumed: 0,
    recentPackets: [],
    events: [
      { step: 0, type: 'info', message: 'Nine synthetic biosignal nodes initialized' },
      { step: 0, type: 'success', message: 'Gateway N05 listening for radio packets' },
    ],
  };
}

function computeNode(node, index, step, controls) {
  const { sunlight, moisture, disturbance, lighting } = controls;
  const dryStress = (100 - moisture) * 0.52;
  const heatStress = Math.max(0, sunlight - 76) * 0.23;
  const stress = Math.round(clamp(dryStress + heatStress + disturbance * 0.47, 0, 100));
  // Synthetic waveform and stress response, not a calibrated physiological model.
  const oscillation = 15 * Math.sin(step * 0.45 + index * 0.85)
    + 7 * Math.sin(step * 0.13 + index * 1.8);
  const signal = Math.round(clamp(43 + oscillation + stress * 0.34, 0, 100));
  // Illustrative energy budget, in simulated millijoules per time step.
  const solarFactor = node.type === 'fungus' ? 0.05 : node.type === 'gateway' ? 0.3 : 0.22;
  const harvest = solarFactor * sunlight / 100
    + (node.type === 'fungus' ? 0.1 : 0.045) * moisture / 100;
  const load = 0.055 + (lighting ? 0.035 : 0);
  return {
    ...node,
    signal,
    stress,
    harvest,
    load,
    charge: clamp(node.charge + harvest - load, 0, MAX_CHARGE_MJ),
    history: [...node.history.slice(-39), signal],
  };
}

function appendEvent(events, event) {
  return [event, ...events].slice(0, 9);
}

export function stepSimulation(previous, options = DEFAULT_CONTROLS) {
  const controls = { ...DEFAULT_CONTROLS, ...options };
  const step = previous.step + 1;
  const nodes = previous.nodes.map((n, index) => computeNode(n, index, step, controls));
  const links = buildLinks(nodes, controls.range);
  let harvested = nodes.reduce((sum, n) => sum + n.harvest, 0);
  let consumed = nodes.reduce((sum, n) => sum + n.load, 0);
  let delivered = previous.delivered;
  let dropped = previous.dropped;
  let transmitted = previous.transmitted;
  let events = previous.events;
  let recentPackets = [];

  if (step % 3 === 0) {
    let cycleDelivered = 0;
    let cycleDropped = 0;
    for (const node of nodes) {
      if (node.id === HUB_ID) continue;
      transmitted++;
      const path = shortestRoute(nodes, links, node.id, HUB_ID);
      if (!path) {
        dropped++;
        cycleDropped++;
        continue;
      }
      // Charge the sender for TX and receiver for RX at every modeled radio hop.
      const costs = new Map();
      for (let i = 0; i < path.length - 1; i++) {
        costs.set(path[i], (costs.get(path[i]) || 0) + 0.32);
        costs.set(path[i + 1], (costs.get(path[i + 1]) || 0) + 0.11);
      }
      if ([...costs].some(([id, cost]) => nodes.find(n => n.id === id).charge < cost + 1)) {
        dropped++;
        cycleDropped++;
        continue;
      }
      for (const [id, cost] of costs) {
        const recipient = nodes.find(n => n.id === id);
        recipient.charge -= cost;
        consumed += cost;
      }
      delivered++;
      cycleDelivered++;
      recentPackets.push({ source: node.id, target: HUB_ID, path, step, hops: path.length - 1 });
    }
    events = appendEvent(events, {
      step,
      type: cycleDropped ? 'warning' : 'success',
      message: cycleDropped
        ? `Radio cycle: ${cycleDelivered} received, ${cycleDropped} dropped`
        : `Radio cycle complete: ${cycleDelivered} delivered to N05`,
    });
  }
  if (step % 10 === 0) {
    const meanStress = Math.round(nodes.reduce((sum, n) => sum + n.stress, 0) / nodes.length);
    events = appendEvent(events, {
      step,
      type: meanStress > 55 ? 'warning' : 'info',
      message: `Canopy model: ${meanStress}% relative stress · ${links.length} radio links`,
    });
  }

  return {
    step, nodes, delivered, dropped, transmitted,
    harvested: previous.harvested + harvested,
    consumed: previous.consumed + consumed,
    recentPackets, events,
  };
}

export function summarize(state, range = DEFAULT_CONTROLS.range) {
  const online = state.nodes.filter(n => n.charge > 1).length;
  const totalEnergy = state.nodes.reduce((sum, n) => sum + n.charge, 0);
  const avgStress = state.nodes.reduce((sum, n) => sum + n.stress, 0) / state.nodes.length;
  return {
    online, total: state.nodes.length,
    links: buildLinks(state.nodes, range).length,
    delivered: state.delivered,
    dropped: state.dropped,
    success: state.transmitted ? 100 * state.delivered / state.transmitted : 100,
    stored: totalEnergy,
    stress: avgStress,
  };
}
