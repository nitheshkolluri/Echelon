import { callGemini, generateFinalAnalysis } from "@/lib/gemini";
import type { Agent, MarketState, MarketEvent } from "@/lib/types";
import { AgentRole } from "@/lib/types";
import type { FinalReportData } from "@/lib/reportTypes";

interface SimulationParams {
  idea: string;
  region: string;
  population: number;
  sentiment: number;
  duration: number; // months
}

interface SimulationResult {
  agents: Agent[];
  marketState: MarketState;
  events: MarketEvent[];
  report: FinalReportData;
}

type GeminiStrategyUpdate = {
  agentId: string; // can match agent.id OR agent.name
  pricingChange?: number; // -0.1 to 0.1
  qualityAdjustment?: number; // -0.1 to 0.1
  newStrategy?: string;
  reasoning?: string;
};

export class SimulationEngine {
  private params: SimulationParams;
  private state!: MarketState;

  constructor(params: SimulationParams) {
    this.params = params;
  }

  /**
   * Run the full simulation with progress callbacks
   */
  async run(onProgress: (progress: number) => Promise<void>): Promise<SimulationResult> {
    console.log("🚀 Starting simulation:", this.params.idea);

    // Step 1: Analyze idea and generate agents (5% progress)
    await onProgress(5);
    const agents = await this.generateAgents();

    // Step 2: Initialize market state (10% progress)
    await onProgress(10);
    this.state = this.initializeMarketState(agents);

    // Step 3: Run simulation loop (10% - 90% progress)
    const checkpointInterval = 6; // Every 6 months
    const totalTicks = this.params.duration;

    for (let tick = 0; tick < totalTicks; tick++) {
      // Run local simulation tick
      this.state = this.runSimulationTick(this.state);

      // Gemini checkpoint every 6 months
      if (tick > 0 && tick % checkpointInterval === 0) {
        const updates = await this.getGeminiStrategyUpdates();
        this.state = this.applyGeminiUpdates(this.state, updates);

        // IMPORTANT: MarketEvent shape must match types.ts
        this.state.events.push({
          tick,
          title: "Strategy Update",
          description: "Agents adjusted their strategies",
          impact: "neutral",
        });
      }

      // Progress: 10% + (tick / totalTicks * 80%)
      const progress = 10 + Math.floor((tick / totalTicks) * 80);
      await onProgress(progress);
    }

    // Step 4: Generate final report (90% - 100% progress)
    await onProgress(90);
    const report = await this.generateFinalReport();
    await onProgress(100);

    console.log("✅ Simulation completed");

    return {
      agents: this.state.agents,
      marketState: this.state,
      events: this.state.events,
      report,
    };
  }

  /**
   * Generate competitor agents using Gemini
   */
  private async generateAgents(): Promise<Agent[]> {
    const prompt = `You are a market analyst. Generate 4-5 realistic competitor agents for this business idea:

**Idea**: ${this.params.idea}
**Region**: ${this.params.region}
**Market Size**: ${this.params.population} people

Generate diverse competitors with different strategies (e.g., budget provider, premium leader, disruptor).

Return ONLY valid JSON array:
[
  {
    "id": "unique-id",
    "name": "Company Name",
    "role": "competitor|incumbent|disruptor|startup",
    "archetype": "Budget Provider|Premium Leader|Value Specialist|High-End Boutique|Rapid Expansionist",
    "description": "Brief description",
    "strategyStyle": "Their strategic approach",
    "basePricing": number (realistic price point),
    "quality": number (0.1 to 1.0),
    "brandPower": number (0.1 to 1.0),
    "budget": number (realistic budget)
  }
]`;

    try {
      const text = await callGemini(prompt, false, 3);

      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("Failed to parse agents from Gemini response");

      const raw = JSON.parse(jsonMatch[0]) as Array<{
        id: string;
        name: string;
        role: string;
        archetype: Agent["archetype"];
        description: string;
        strategyStyle: string;
        basePricing: number;
        quality: number;
        brandPower: number;
        budget: number;
      }>;

      const toAgentRole = (role: string): AgentRole => {
        const r = (role || "").toLowerCase();
        if (r === "startup") return AgentRole.STARTUP;
        if (r === "incumbent") return AgentRole.INCUMBENT;
        if (r === "disruptor") return AgentRole.DISRUPTOR;
        return AgentRole.COMPETITOR;
      };

      return raw.map((agent) => ({
        id: agent.id,
        name: agent.name,
        role: toAgentRole(agent.role),
        archetype: agent.archetype,
        description: agent.description,
        strategyStyle: agent.strategyStyle,
        basePricing: agent.basePricing,
        quality: agent.quality,
        brandPower: agent.brandPower,
        budget: agent.budget,

        // Runtime fields required by Agent type
        currentPricing: agent.basePricing,
        marketShare: 1 / raw.length,
        revenue: 0,
        profit: 0,
        growthRate: 0,
        reasoning: "",
        history: [],
      }));
    } catch (error) {
      console.error("Error generating agents:", error);
      return this.generateMockAgents();
    }
  }

  /**
   * Initialize market state (MUST match MarketState type)
   */
  private initializeMarketState(agents: Agent[]): MarketState {
    return {
      region: this.params.region,
      populationScale: this.params.population,
      visitsPerMonth: 2.5,
      marketSentiment: this.params.sentiment,
      volatility: 0.15,
      tick: 0,
      maxTicks: this.params.duration,
      agents,
      events: [],
    };
  }

  /**
   * Run a single simulation tick (local math, no Gemini)
   */
  private runSimulationTick(state: MarketState): MarketState {
    const { agents, marketSentiment, populationScale, visitsPerMonth } = state;

    // Calculate attractiveness weights
    const weights = agents.map((agent) => {
      const normalizedPrice = Math.max(0.1, agent.currentPricing);
      const priceRatio = normalizedPrice / Math.max(0.1, agent.basePricing);
      const utility = (agent.quality * 1.5 + agent.brandPower) / Math.max(0.5, priceRatio);
      return Math.max(0.01, utility);
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    const updatedAgents = agents.map((agent, i) => {
      const targetShare = weights[i] / totalWeight;
      const inertia = 0.85;
      const actualShare = agent.marketShare * inertia + targetShare * (1 - inertia);

      const marketPotential = populationScale * marketSentiment;
      const totalTransactions = marketPotential * visitsPerMonth;
      const monthlyVariance = 1 + (Math.random() * 0.1 - 0.05);
      const transactionsForAgent = totalTransactions * actualShare * monthlyVariance;

      const revenueThisMonth = transactionsForAgent * agent.currentPricing;
      const profitThisMonth = revenueThisMonth * 0.25;

      const newRevenue = agent.revenue + revenueThisMonth;
      const prevRevenue =
        agent.history.length > 0 ? agent.history[agent.history.length - 1].revenue : 0;

      const growthRate = prevRevenue > 0 ? (newRevenue - prevRevenue) / prevRevenue : 0;

      return {
        ...agent,
        marketShare: actualShare,
        revenue: newRevenue,
        profit: agent.profit + profitThisMonth,
        growthRate,
        history: [
          ...agent.history,
          {
            tick: state.tick,
            share: actualShare,
            revenue: newRevenue,
            pricing: agent.currentPricing,
          },
        ],
      };
    });

    return {
      ...state,
      tick: state.tick + 1,
      agents: updatedAgents,
    };
  }

  /**
   * Get strategy updates from Gemini (batched)
   */
  private async getGeminiStrategyUpdates(): Promise<GeminiStrategyUpdate[]> {
    const prompt = `You are a strategic AI advisor. Analyze this market simulation and suggest strategy updates for each agent.

**Current State** (Month ${this.state.tick}):
${JSON.stringify(
  this.state.agents.map((a) => ({
    name: a.name,
    marketShare: (a.marketShare * 100).toFixed(1) + "%",
    revenue: a.revenue.toFixed(0),
    pricing: a.currentPricing,
    quality: a.quality,
  })),
  null,
  2
)}

Return ONLY valid JSON array with strategic adjustments:
[
  {
    "agentId": "agent name",
    "pricingChange": number (-0.1 to 0.1, e.g., -0.05 = 5% price cut),
    "qualityAdjustment": number (-0.1 to 0.1),
    "newStrategy": "Updated strategy description",
    "reasoning": "Why this change makes sense"
  }
]`;

    try {
      const text = await callGemini(prompt, false, 1);
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];
      return JSON.parse(jsonMatch[0]) as GeminiStrategyUpdate[];
    } catch (error) {
      console.error("Error getting strategy updates:", error);
      return [];
    }
  }

  /**
   * Apply Gemini strategy updates to agents
   */
  private applyGeminiUpdates(state: MarketState, updates: GeminiStrategyUpdate[]): MarketState {
    const updatedAgents = state.agents.map((agent) => {
      const update = updates.find((u) => u.agentId === agent.id || u.agentId === agent.name);
      if (!update) return agent;

      const pricingChange = update.pricingChange ?? 0;
      const qualityAdjustment = update.qualityAdjustment ?? 0;

      return {
        ...agent,
        currentPricing: agent.currentPricing * (1 + pricingChange),
        quality: Math.min(1, Math.max(0.1, agent.quality + qualityAdjustment)),
        strategyStyle: update.newStrategy || agent.strategyStyle,
        reasoning: update.reasoning || agent.reasoning,
      };
    });

    return {
      ...state,
      agents: updatedAgents,
    };
  }

  /**
   * Generate final report using Gemini
   */
  private async generateFinalReport(): Promise<FinalReportData> {
    try {
      return await generateFinalAnalysis(this.state);
    } catch (error) {
      console.error("Error generating report:", error);

      // Typed fallback (must match FinalReportData)
      return {
        feasibilityScore: 7,
        verdict: "Review",
        summary: "Simulation completed. Strategic data is being processed.",
        comparison: [],
        successDrivers: [{ factor: "Observation", score: 70 }],
        swot: { strengths: ["Operational"], weaknesses: [], opportunities: [], threats: [] },
        recommendation: "Continue market monitoring.",
      };
    }
  }

  /**
   * Fallback: Generate mock agents if Gemini fails
   */
  private generateMockAgents(): Agent[] {
    return [
      {
        id: "agent-1",
        name: "Market Leader Inc",
        role: AgentRole.INCUMBENT,
        archetype: "Premium Leader",
        description: "Established market leader with strong brand",
        strategyStyle: "Premium positioning with high quality",
        basePricing: 100,
        quality: 0.9,
        brandPower: 0.9,
        budget: 1000000,

        currentPricing: 100,
        marketShare: 0.25,
        revenue: 0,
        profit: 0,
        growthRate: 0,
        reasoning: "",
        history: [],
      },
      {
        id: "agent-2",
        name: "Budget Solutions Co",
        role: AgentRole.COMPETITOR,
        archetype: "Budget Provider",
        description: "Low-cost provider targeting price-sensitive customers",
        strategyStyle: "Cost leadership and volume",
        basePricing: 50,
        quality: 0.6,
        brandPower: 0.5,
        budget: 500000,

        currentPricing: 50,
        marketShare: 0.25,
        revenue: 0,
        profit: 0,
        growthRate: 0,
        reasoning: "",
        history: [],
      },
      {
        id: "agent-3",
        name: "Innovation Labs",
        role: AgentRole.DISRUPTOR,
        archetype: "High-End Boutique",
        description: "Innovative disruptor with unique value proposition",
        strategyStyle: "Differentiation through innovation",
        basePricing: 120,
        quality: 0.95,
        brandPower: 0.7,
        budget: 750000,

        currentPricing: 120,
        marketShare: 0.25,
        revenue: 0,
        profit: 0,
        growthRate: 0,
        reasoning: "",
        history: [],
      },
      {
        id: "agent-4",
        name: "Value Experts",
        role: AgentRole.COMPETITOR,
        archetype: "Value Specialist",
        description: "Balanced approach offering good value",
        strategyStyle: "Value optimization",
        basePricing: 75,
        quality: 0.75,
        brandPower: 0.65,
        budget: 600000,

        currentPricing: 75,
        marketShare: 0.25,
        revenue: 0,
        profit: 0,
        growthRate: 0,
        reasoning: "",
        history: [],
      },
    ];
  }
}