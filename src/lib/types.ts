
export enum AgentRole {
    STARTUP = 'startup',
    COMPETITOR = 'competitor',
    INCUMBENT = 'incumbent',
    DISRUPTOR = 'disruptor'
}

export type AgentArchetype = 'Budget Provider' | 'Premium Leader' | 'Value Specialist' | 'High-End Boutique' | 'Rapid Expansionist';

export type Agent = {
    id: string;
    name: string;
    role: AgentRole;
    archetype: AgentArchetype;
    description: string;
    strategyStyle: string;
    basePricing: number;
    quality: number; // 0 to 1
    brandPower: number; // 0 to 1
    budget: number;
    currentPricing: number;
    marketShare: number; // 0 to 1
    revenue: number;
    profit: number;
    growthRate: number;
    reasoning: string;
    history: Array<{
        tick: number;
        share: number;
        revenue: number;
        pricing: number;
    }>;
}

export type MarketState = {
    region: string;
    populationScale: number; // Instead of TAM, we use potential customers
    visitsPerMonth: number; // How often a person buys this product/service
    marketSentiment: number; // 0 to 1
    volatility: number;
    tick: number;
    maxTicks: number;
    agents: Agent[];
    events: MarketEvent[];
}

export type MarketEvent = {
    tick: number;
    title: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
}

export type SimulationRecord = {
    id: string;
    status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
    progress: number;
    idea: string;
    region: string;
    createdAt: string;
    completedAt?: string;
    marketState?: MarketState;
    agents?: Agent[];
    events?: MarketEvent[];
    report?: any;
    error?: string;
};
