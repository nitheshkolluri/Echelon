
import { GoogleGenAI, Type } from "@google/genai";
import { Agent, MarketState } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-3-flash-preview';
const PRO_MODEL_NAME = 'gemini-3-pro-preview';

export const analyzeIdeaAndCreateMarket = async (idea: string, region: string): Promise<{
  agents: Partial<Agent>[];
  marketContext: {
    visitsPerMonth: number;
    sentiment: number;
    description: string;
  };
}> => {
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Analyze this local business idea: "${idea}" in the region of "${region}".
    Create a realistic market simulation based on real-world local competition.
    
    Provide a JSON response with:
    1. A list of 5 competitors (1 for the user's startup, 4 real or realistic local competitors).
    2. Typical 'visits per month' per customer for this industry.
    3. Initial market sentiment (0 to 1).

    Rules:
    - User's role is 'startup'.
    - Assign each agent an 'archetype': 'Budget Provider', 'Premium Leader', 'Value Specialist', 'High-End Boutique', or 'Rapid Expansionist'.
    - Use pricing that matches the region's economy.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          agents: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                role: { type: Type.STRING },
                archetype: { type: Type.STRING },
                description: { type: Type.STRING },
                strategyStyle: { type: Type.STRING },
                basePricing: { type: Type.NUMBER },
                quality: { type: Type.NUMBER },
                brandPower: { type: Type.NUMBER },
                budget: { type: Type.NUMBER },
              },
              required: ["name", "role", "archetype", "description", "strategyStyle", "basePricing", "quality", "brandPower", "budget"]
            }
          },
          marketContext: {
            type: Type.OBJECT,
            properties: {
              visitsPerMonth: { type: Type.NUMBER },
              sentiment: { type: Type.NUMBER },
              description: { type: Type.STRING }
            },
            required: ["visitsPerMonth", "sentiment", "description"]
          }
        },
        required: ["agents", "marketContext"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const getStrategicIntervention = async (marketState: MarketState): Promise<{
  updates: Array<{
    agentId: string;
    pricingChange: number;
    qualityAdjustment: number;
    newStrategy: string;
    reasoning: string;
  }>;
  marketEvent?: {
    title: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
  };
}> => {
  const agentsSummary = marketState.agents.map(a => ({
    name: a.name,
    archetype: a.archetype,
    share: a.marketShare,
    price: a.currentPricing,
    strategy: a.strategyStyle
  }));

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Month ${marketState.tick} Simulation Update for ${marketState.region}.
    Competitors: ${JSON.stringify(agentsSummary)}
    As a market expert, adjust pricing and strategies based on local competition trends.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          updates: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                agentId: { type: Type.STRING },
                pricingChange: { type: Type.NUMBER },
                qualityAdjustment: { type: Type.NUMBER },
                newStrategy: { type: Type.STRING },
                reasoning: { type: Type.STRING }
              },
              required: ["agentId", "pricingChange", "qualityAdjustment", "newStrategy", "reasoning"]
            }
          },
          marketEvent: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              impact: { type: Type.STRING }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export interface FinalReportData {
  feasibilityScore: number;
  verdict: string;
  summary: string;
  comparison: Array<{ attribute: string; user: number; leader: number }>;
  headToHead: {
    userRevenue: string;
    leaderRevenue: string;
    userMarketShare: string;
    leaderMarketShare: string;
    priceCompetitive: 'High' | 'Medium' | 'Low';
    qualityCompetitive: 'Superior' | 'Equal' | 'Inferior';
  };
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
  recommendation: string;
}

export const generateFinalAnalysis = async (marketState: MarketState): Promise<FinalReportData> => {
  const userAgent = marketState.agents.find(a => a.role === 'startup')!;
  const leaderAgent = [...marketState.agents].sort((a,b) => b.marketShare - a.marketShare)[0];
  
  const response = await ai.models.generateContent({
    model: PRO_MODEL_NAME,
    contents: `Create an elite, professional business feasibility report for ${marketState.region}.
    User Business (${userAgent.name}): ${(userAgent.marketShare * 100).toFixed(1)}% share, $${userAgent.revenue.toFixed(0)} total revenue.
    Market Leader (${leaderAgent.name}): ${(leaderAgent.marketShare * 100).toFixed(1)}% share, $${leaderAgent.revenue.toFixed(0)} revenue.
    
    Structure the response as JSON for an executive presentation. 
    "comparison" must compare User vs Leader on a 1-10 scale for: Pricing Strategy, Quality Standard, Brand Presence, Customer Loyalty, and Competitive Agility.
    "headToHead" should summarize the core financial and competitive deltas.`,
    config: {
      thinkingConfig: { thinkingBudget: 16000 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          feasibilityScore: { type: Type.NUMBER, description: "Percentage probability of long-term success (0-100)" },
          verdict: { type: Type.STRING },
          summary: { type: Type.STRING },
          comparison: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                attribute: { type: Type.STRING },
                user: { type: Type.NUMBER },
                leader: { type: Type.NUMBER }
              },
              required: ["attribute", "user", "leader"]
            }
          },
          headToHead: {
            type: Type.OBJECT,
            properties: {
              userRevenue: { type: Type.STRING },
              leaderRevenue: { type: Type.STRING },
              userMarketShare: { type: Type.STRING },
              leaderMarketShare: { type: Type.STRING },
              priceCompetitive: { type: Type.STRING },
              qualityCompetitive: { type: Type.STRING }
            },
            required: ["userRevenue", "leaderRevenue", "userMarketShare", "leaderMarketShare", "priceCompetitive", "qualityCompetitive"]
          },
          swot: {
            type: Type.OBJECT,
            properties: {
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
              threats: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["strengths", "weaknesses", "opportunities", "threats"]
          },
          recommendation: { type: Type.STRING }
        },
        required: ["feasibilityScore", "verdict", "summary", "comparison", "headToHead", "swot", "recommendation"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};
