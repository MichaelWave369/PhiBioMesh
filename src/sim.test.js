import { describe, expect, it } from 'vitest';
import {
  buildLinks, createInitialState, DEFAULT_CONTROLS, HUB_ID,
  MAX_CHARGE_MJ, shortestRoute, stepSimulation, summarize,
} from './sim.js';

describe('biosphere laboratory model', () => {
  it('starts with nine distinct nodes and finite energy budgets', () => {
    const state = createInitialState();
    expect(state.nodes).toHaveLength(9);
    expect(new Set(state.nodes.map(n => n.id)).size).toBe(9);
    expect(state.nodes.every(n => n.charge <= MAX_CHARGE_MJ)).toBe(true);
  });

  it('routes from a leaf node to the gateway over modeled links', () => {
    const state = createInitialState();
    const links = buildLinks(state.nodes, DEFAULT_CONTROLS.range);
    const path = shortestRoute(state.nodes, links, 'N01', HUB_ID);
    expect(path?.[0]).toBe('N01');
    expect(path?.at(-1)).toBe(HUB_ID);
    expect(path.length).toBeGreaterThan(1);
  });

  it('reports unreachable destinations when radio range is too small', () => {
    const state = createInitialState();
    const links = buildLinks(state.nodes, 2);
    expect(shortestRoute(state.nodes, links, 'N01', HUB_ID)).toBe(null);
  });

  it('does not create charge when harvest sources and lighting are disabled', () => {
    let state = createInitialState();
    const initial = summarize(state).stored;
    for (let i = 0; i < 6; i++) {
      state = stepSimulation(state, { ...DEFAULT_CONTROLS, sunlight: 0, moisture: 0, lighting: false });
    }
    expect(summarize(state).stored).toBeLessThan(initial);
    expect(state.harvested).toBe(0);
  });

  it('records drops when the mesh is disconnected and never invents delivery', () => {
    let state = createInitialState();
    for (let i = 0; i < 3; i++) state = stepSimulation(state, { ...DEFAULT_CONTROLS, range: 2 });
    expect(state.delivered).toBe(0);
    expect(state.dropped).toBe(8);
    expect(state.transmitted).toBe(8);
    expect(state.recentPackets).toHaveLength(0);
  });

  it('keeps signals, charge, and stress within their defined model bounds', () => {
    let state = createInitialState();
    for (let i = 0; i < 120; i++) {
      state = stepSimulation(state, { sunlight: 100, moisture: 0, disturbance: 100, range: 39, lighting: true });
    }
    for (const n of state.nodes) {
      expect(n.signal).toBeGreaterThanOrEqual(0);
      expect(n.signal).toBeLessThanOrEqual(100);
      expect(n.stress).toBeGreaterThanOrEqual(0);
      expect(n.stress).toBeLessThanOrEqual(100);
      expect(n.charge).toBeGreaterThanOrEqual(0);
      expect(n.charge).toBeLessThanOrEqual(MAX_CHARGE_MJ);
    }
    expect(state.delivered + state.dropped).toBe(state.transmitted);
  });
});
