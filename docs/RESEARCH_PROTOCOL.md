# Research protocol and claim boundaries

PhiBioMesh is an educational, browser-only simulation. No measurements from plants, fungi, people, or the power grid are collected.

## What the simulation represents

- **Node**: a hypothetical plant-associated electronic sensor + battery + short-range digital radio. The plant itself does not perform packet switching.
- **Bio-signal**: a **synthetic**, unitless waveform from two sine waves and an illustrative stress response. AU means arbitrary units, not volts or physiological amplitude.
- **Energy**: **illustrative simulated millijoules per tick**, not calibrated readings or validated harvest rates. Solar and microbial terms are hypotheses for modeling, not proof of field viability.
- **Stress**: unitless environmental proxy based on moisture, sunlight, disturbance. It is not a diagnostic plant-health score.
- **Link**: undirected idealized radio adjacency if nodes are in range and have battery above a threshold. Does not model packet collisions, interference, duty cycle, RF propagation, or FCC constraints.
- **Routing**: breadth-first search (minimum number of hops) to synthetic gateway N05. Each transmission costs 0.32 model mJ at sender and 0.11 model mJ at receiver, subject to a minimum reserve.
- **Events and downloads**: simulation activity only. JSON export contains model controls, state, telemetry and provenance flag.

## Experiment suggestions

1. Set **radio reach** to 15 units. Observe delivered packets halt and dropped counter climb at each transmission cycle.
2. Restore to 39 units. Observe BFS packet delivery resume, with routes from distant nodes typically requiring multiple hops.
3. Set sunlight and moisture to zero; disable light. Pause or observe the modeled battery curve gradually decline, with no energy harvesting.
4. Increase disturbance and compare unitless stress and signal traces. No plant-health diagnosis should be inferred.
5. Export a snapshot and include its provenance label when sharing.

## Hardware experiments (not yet implemented)

Any future work should require informed human consent for human-connected measurements, non-damaging plant electrodes, environmental impact review, calibrated meters, a documented radio protocol, and isolation from mains power. Avoid linking human biometrics to identifiable persons.

## Background research directions

- Plant electrophysiology and environmental stress signaling
- Plant microbial fuel cells
- Low-power wireless sensor networks (LoRa, BLE Mesh, IEEE 802.15.4)
- Non-invasive bioelectrodes and sensor calibration
- Bioluminescence and low-power responsive illumination

The idea that a planet-wide resonant living biosphere could distribute utility-scale power is a speculative artistic vision, not an established physical mechanism.
