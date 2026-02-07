import type { SimulationRecord } from "./types";

const globalForSims = global as unknown as { simulations: Record<string, SimulationRecord> };

if (!globalForSims.simulations) {
    globalForSims.simulations = {};
}

export const simulations = globalForSims.simulations;
