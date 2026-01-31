"use server";

import { GoogleGenAI } from "@google/genai";
import { Agent, type MarketState } from "./types";
export type { MarketState };

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const MODEL_NAME = 'gemini-2.0-flash';
const PRO_MODEL_NAME = 'gemini-2.0-flash';

/**
 * GEMINI GUARD: A robust, production-grade Request Manager
 * Implements: Token Bucket (Rate Limiting), Exponential Backoff with Jitter, and Circuit Breaker logic.
 */
class GeminiGuard {
    private tokens: number;
    private maxTokens: number;
    private refillRate: number; // tokens per second
    private lastRefill: number;
    private queue: { resolve: () => void; priority: number }[] = [];

    // Circuit Breaker State
    private failureCount: number = 0;
    private lastFailureTime: number = 0;
    private isOpen: boolean = false;
    private readonly FAILURE_THRESHOLD = 5;
    private readonly COOL_DOWN_PERIOD = 30000; // 30s

    constructor(rpm: number = 10) { // Default to a conservative 10 RPM for experimental
        this.maxTokens = Math.max(1, rpm / 6); // Allow small bursts
        this.tokens = this.maxTokens;
        this.refillRate = rpm / 60;
        this.lastRefill = Date.now();
    }

    private refill() {
        const now = Date.now();
        const delta = (now - this.lastRefill) / 1000;
        this.tokens = Math.min(this.maxTokens, this.tokens + delta * this.refillRate);
        this.lastRefill = now;
    }

    private checkCircuit() {
        if (this.isOpen) {
            if (Date.now() - this.lastFailureTime > this.COOL_DOWN_PERIOD) {
                this.isOpen = false;
                this.failureCount = 0;
                console.log("🛡️ Gemini Guard: Circuit closing (re-enabling requests)");
            } else {
                throw new Error("🚨 Circuit Breaker is OPEN. Gemini API is currently cooling down due to repeated failures.");
            }
        }
    }

    async acquire(priority: number = 1) {
        this.checkCircuit();
        this.refill();

        if (this.tokens >= 1 && this.queue.length === 0) {
            this.tokens -= 1;
            return;
        }

        return new Promise<void>((resolve) => {
            this.queue.push({ resolve, priority });
            this.queue.sort((a, b) => b.priority - a.priority); // High priority first
            this.processQueue();
        });
    }

    private processQueue() {
        if (this.queue.length === 0) return;

        this.refill();
        if (this.tokens >= 1) {
            const next = this.queue.shift();
            if (next) {
                this.tokens -= 1;
                next.resolve();
                // Schedule next process with a small delay to avoid sub-second bursts
                setTimeout(() => this.processQueue(), 100);
            }
        } else {
            // Calculate wait time based on next token availability
            const waitTime = ((1 - this.tokens) / this.refillRate) * 1000;
            setTimeout(() => this.processQueue(), Math.max(100, waitTime));
        }
    }

    recordFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.failureCount >= this.FAILURE_THRESHOLD) {
            this.isOpen = true;
            console.warn("🚨 Gemini Guard: Circuit opened due to excessive failures.");
        }
    }

    recordSuccess() {
        this.failureCount = 0;
        this.isOpen = false;
    }
}

const guard = new GeminiGuard(12); // Guarding at 12 RPM

export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 5, priority = 1): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            await guard.acquire(priority);
            const result = await fn();
            guard.recordSuccess();
            return result;
        } catch (error: any) {
            lastError = error;
            const isRateLimit = error?.message?.includes("429") || error?.status === 429;

            if (isRateLimit) {
                guard.recordFailure(); // Rate limits count as failures for circuit breaking
                const jitter = Math.random() * 1000;
                const delay = (3000 * Math.pow(2, attempt)) + jitter;
                console.log(`⏳ Rate limit detected. Backing off for ${Math.round(delay)}ms...`);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }

            // For other errors, maybe don't retry if they are terminal (e.g. 400 Bad Request)
            if (error?.status === 400) throw error;

            throw error;
        }
    }
    throw lastError;
}

/**
 * Generic helper to call Gemini with retry logic
 */
export const callGemini = async (prompt: string, isPro = false, priority = 1): Promise<string> => {
    return withRetry(async () => {
        try {
            const response = await (ai as any).models.generateContent({
                model: isPro ? PRO_MODEL_NAME : MODEL_NAME,
                contents: prompt
            });
            const text = response.text;
            return typeof text === 'function' ? text() : text;
        } catch (error: any) {
            console.error(`❌ Gemini API Error [${isPro ? 'PRO' : 'FLASH'}]:`, error.message);
            throw error;
        }
    }, 5, priority);
};

export const analyzeIdeaAndCreateMarket = async (idea: string, region: string): Promise<{
    agents: Partial<Agent>[];
    marketContext: { visitsPerMonth: number; sentiment: number; description: string; };
}> => {
    const prompt = `Analyze this idea: "${idea}" in "${region}". Return JSON with 5 competitors (1 user, 4 real), visitsPerMonth, sentiment (0-1).`;
    const txt = await callGemini(prompt, false, 3); // Priority 3 for initialization
    return JSON.parse(txt);
};

export const getStrategicIntervention = async (marketState: MarketState): Promise<any> => {
    const prompt = `Simulate month ${marketState.tick} for ${marketState.region}. Update strategy.`;
    const txt = await callGemini(prompt, false, 1); // Priority 1 for updates
    return JSON.parse(txt);
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
    const winner = marketState.agents.reduce((prev, curr) =>
        curr.revenue > prev.revenue ? curr : prev
    );

    const prompt = `You are a high-level business strategy consultant. Analyze this market simulation:
Region: ${marketState.region}
Final Results: ${JSON.stringify(marketState.agents.map(a => ({ name: a.name, share: a.marketShare, revenue: a.revenue })))}

Return a strict JSON object with this structure:
{
  "feasibilityScore": number (1-10),
  "verdict": "Sustain | Pivot | Exit | Scape",
  "summary": "2-3 sentence strategic executive summary",
  "comparison": [
    { "attribute": "Pricing", "user": number (1-10), "leader": number (1-10) },
    { "attribute": "Quality", "user": number (1-10), "leader": number (1-10) },
    { "attribute": "Brand", "user": number (1-10), "leader": number (1-10) },
    { "attribute": "Speed", "user": number (1-10), "leader": number (1-10) }
  ],
  "successDrivers": [
    { "factor": "Market Penetration", "score": number (0-100) },
    { "factor": "Cost Leadership", "score": number (0-100) },
    { "factor": "Innovation", "score": number (0-100) }
  ],
  "swot": {
    "strengths": ["string"],
    "weaknesses": ["string"],
    "opportunities": ["string"],
    "threats": ["string"]
  },
  "recommendation": "Final strategic advice"
}`;
    const txt = await callGemini(prompt, true, 2);
    const jsonMatch = txt.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid report format");
    return JSON.parse(jsonMatch[0]);
};
