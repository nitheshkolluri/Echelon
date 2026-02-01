
import type { MarketState, Agent } from "./types";

export const runSimulationTick = (state: MarketState): MarketState => {
    const { agents, marketSentiment, populationScale, visitsPerMonth } = state;

    // 1. Attractiveness Model
    // Utility = (Quality * 0.6 + BrandPower * 0.4) / (Price / Baseline)
    const weights = agents.map(agent => {
        // Avoid division by zero
        const normalizedPrice = Math.max(0.1, agent.currentPricing);
        const priceRatio = normalizedPrice / Math.max(0.1, agent.basePricing);
        const utility = (agent.quality * 1.5 + agent.brandPower) / Math.max(0.5, priceRatio);
        return Math.max(0.01, utility);
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    // 2. Compute Market Share & Realistic Revenue
    // Revenue = (Population * Sentiment * VisitsPerMonth) * Share * Price
    const updatedAgents = agents.map((agent, i) => {
        const targetShare = weights[i] / totalWeight;
        const inertia = 0.85; // 85% of customers stay loyal per month
        const actualShare = (agent.marketShare * inertia) + (targetShare * (1 - inertia));

        // Revenue Calculation
        const marketPotential = populationScale * marketSentiment;
        const totalTransactions = marketPotential * visitsPerMonth;

        // Variance in monthly spending
        const monthlyVariance = 1 + (Math.random() * 0.1 - 0.05);
        const transactionsForAgent = totalTransactions * actualShare * monthlyVariance;
        const revenueThisMonth = transactionsForAgent * agent.currentPricing;
        const profitThisMonth = revenueThisMonth * 0.25; // Standard 25% profit margin

        return {
            ...agent,
            marketShare: actualShare,
            revenue: agent.revenue + revenueThisMonth,
            profit: agent.profit + profitThisMonth,
            history: [...agent.history, {
                tick: state.tick,
                share: actualShare,
                revenue: agent.revenue + revenueThisMonth,
                pricing: agent.currentPricing
            }]
        };
    });

    return {
        ...state,
        tick: state.tick + 1,
        agents: updatedAgents,
    };
};

export const applyGeminiUpdates = (state: MarketState, updates: any[]): MarketState => {
    const updatedAgents = state.agents.map(agent => {
        const update = updates.find(u => u.agentId === agent.id || u.agentId === agent.name);
        if (!update) return agent;

        return {
            ...agent,
            currentPricing: agent.currentPricing * (1 + (update.pricingChange || 0)),
            quality: Math.min(1, Math.max(0.1, agent.quality + (update.qualityAdjustment || 0))),
            strategyStyle: update.newStrategy || agent.strategyStyle,
            reasoning: update.reasoning || agent.reasoning
        };
    });

    return {
        ...state,
        agents: updatedAgents
    };
};
