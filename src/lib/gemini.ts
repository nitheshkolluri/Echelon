"use server";

import { GoogleGenAI } from "@google/genai";
// Fallback if SchemaType is missing, we define SchemaTypeAny assuming standard enum values or just strings.
// Since we can't import SchemaType (it might be missing in this version), we mock it.
const SchemaTypeAny = { OBJECT: "OBJECT", ARRAY: "ARRAY", STRING: "STRING", NUMBER: "NUMBER", BOOLEAN: "BOOLEAN" };

import { Agent, MarketState } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const MODEL_NAME = 'gemini-2.0-flash-exp';
const PRO_MODEL_NAME = 'gemini-2.0-flash-exp';

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            if (error?.message?.includes("429") && attempt < maxRetries - 1) {
                await new Promise((resolve) => setTimeout(resolve, 2000 * Math.pow(2, attempt)));
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}

export const analyzeIdeaAndCreateMarket = async (idea: string, region: string): Promise<{
    agents: Partial<Agent>[];
    marketContext: { visitsPerMonth: number; sentiment: number; description: string; };
}> => {
    return withRetry(async () => {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Analyze this idea: "${idea}" in "${region}". Return JSON with 5 competitors (1 user, 4 real), visitsPerMonth, sentiment (0-1).`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaTypeAny.OBJECT,
                    properties: {
                        agents: {
                            type: SchemaTypeAny.ARRAY,
                            items: {
                                type: SchemaTypeAny.OBJECT,
                                properties: {
                                    name: { type: SchemaTypeAny.STRING },
                                    role: { type: SchemaTypeAny.STRING },
                                    archetype: { type: SchemaTypeAny.STRING },
                                    description: { type: SchemaTypeAny.STRING },
                                    strategyStyle: { type: SchemaTypeAny.STRING },
                                    basePricing: { type: SchemaTypeAny.NUMBER },
                                    quality: { type: SchemaTypeAny.NUMBER },
                                    brandPower: { type: SchemaTypeAny.NUMBER },
                                    budget: { type: SchemaTypeAny.NUMBER },
                                }
                            }
                        },
                        marketContext: {
                            type: SchemaTypeAny.OBJECT,
                            properties: {
                                visitsPerMonth: { type: SchemaTypeAny.NUMBER },
                                sentiment: { type: SchemaTypeAny.NUMBER },
                                description: { type: SchemaTypeAny.STRING }
                            }
                        }
                    }
                }
            }
        });
        const txt = (response as any).text;
        return JSON.parse(typeof txt === 'function' ? txt() : txt);
    });
};

export const getStrategicIntervention = async (marketState: MarketState): Promise<any> => {
    return withRetry(async () => {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Simulate month ${marketState.tick} for ${marketState.region}. Update strategy.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaTypeAny.OBJECT,
                    properties: {
                        updates: {
                            type: SchemaTypeAny.ARRAY,
                            items: {
                                type: SchemaTypeAny.OBJECT,
                                properties: {
                                    agentId: { type: SchemaTypeAny.STRING },
                                    pricingChange: { type: SchemaTypeAny.NUMBER },
                                    qualityAdjustment: { type: SchemaTypeAny.NUMBER },
                                    newStrategy: { type: SchemaTypeAny.STRING },
                                    reasoning: { type: SchemaTypeAny.STRING }
                                }
                            }
                        },
                        marketEvent: {
                            type: SchemaTypeAny.OBJECT,
                            properties: {
                                title: { type: SchemaTypeAny.STRING },
                                description: { type: SchemaTypeAny.STRING },
                                impact: { type: SchemaTypeAny.STRING }
                            }
                        }
                    }
                }
            }
        });
        const txt = (response as any).text;
        return JSON.parse(typeof txt === 'function' ? txt() : txt);
    });
};

export interface FinalReportData {
    feasibilityScore: number;
    verdict: string;
    summary: string;
    comparison: any[];
    positioningMap: any[];
    successDrivers: any[];
    headToHead: any;
    swot: any;
    recommendation: string;
}

export const generateFinalAnalysis = async (marketState: MarketState): Promise<FinalReportData> => {
    return withRetry(async () => {
        const response = await ai.models.generateContent({
            model: PRO_MODEL_NAME,
            contents: `Generate final report for ${marketState.region}. Return JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaTypeAny.OBJECT,
                    properties: {
                        feasibilityScore: { type: SchemaTypeAny.NUMBER },
                        verdict: { type: SchemaTypeAny.STRING },
                        summary: { type: SchemaTypeAny.STRING },
                        comparison: { type: SchemaTypeAny.ARRAY, items: { type: SchemaTypeAny.OBJECT, properties: { attribute: { type: SchemaTypeAny.STRING }, user: { type: SchemaTypeAny.NUMBER }, leader: { type: SchemaTypeAny.NUMBER } } } },
                        positioningMap: { type: SchemaTypeAny.ARRAY, items: { type: SchemaTypeAny.OBJECT, properties: { name: { type: SchemaTypeAny.STRING }, quality: { type: SchemaTypeAny.NUMBER }, price: { type: SchemaTypeAny.NUMBER }, isUser: { type: SchemaTypeAny.BOOLEAN } } } },
                        successDrivers: { type: SchemaTypeAny.ARRAY, items: { type: SchemaTypeAny.OBJECT, properties: { factor: { type: SchemaTypeAny.STRING }, score: { type: SchemaTypeAny.NUMBER } } } },
                        headToHead: { type: SchemaTypeAny.OBJECT, properties: { userRevenue: { type: SchemaTypeAny.STRING }, leaderRevenue: { type: SchemaTypeAny.STRING }, userMarketShare: { type: SchemaTypeAny.STRING }, leaderMarketShare: { type: SchemaTypeAny.STRING }, priceCompetitive: { type: SchemaTypeAny.STRING }, qualityCompetitive: { type: SchemaTypeAny.STRING } } },
                        swot: { type: SchemaTypeAny.OBJECT, properties: { strengths: { type: SchemaTypeAny.ARRAY, items: { type: SchemaTypeAny.STRING } }, weaknesses: { type: SchemaTypeAny.ARRAY, items: { type: SchemaTypeAny.STRING } }, opportunities: { type: SchemaTypeAny.ARRAY, items: { type: SchemaTypeAny.STRING } }, threats: { type: SchemaTypeAny.ARRAY, items: { type: SchemaTypeAny.STRING } } } },
                        recommendation: { type: SchemaTypeAny.STRING }
                    }
                }
            }
        });
        const txt = (response as any).text;
        return JSON.parse(typeof txt === 'function' ? txt() : txt);
    });
};
