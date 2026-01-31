const globalForSims = global as unknown as { simulations: Record<string, any> };

if (!globalForSims.simulations) {
    globalForSims.simulations = {};
}

export const simulations = globalForSims.simulations;
