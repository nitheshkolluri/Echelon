import { NextRequest, NextResponse } from "next/server";
import { SimulationEngine } from "@/lib/SimulationEngine";
import { simulations } from "@/lib/store";
import type { SimulationRecord } from "@/lib/store";

type CreateSimulationBody = {
  idea?: unknown;
  region?: unknown;
  population?: unknown;
  sentiment?: unknown;
  duration?: unknown;
};

type CreateSimulationSuccess = {
  success: true;
  data: { simulationId: string };
};

type CreateSimulationFail = {
  success: false;
  error: { message: string };
};

const IDEA_MAX_LEN = 2000;
const REGION_MAX_LEN = 120;

const POPULATION_MIN = 1000;
const POPULATION_MAX = 5_000_000;

const SENTIMENT_MIN = 0;
const SENTIMENT_MAX = 1;

const DURATION_MIN = 1;
const DURATION_MAX = 60;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function asTrimmedString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length ? s : null;
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim().length) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function badRequest(message: string) {
  return NextResponse.json<CreateSimulationFail>(
    { success: false, error: { message } },
    { status: 400 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const raw = (await req.json()) as unknown;

    if (!isRecord(raw)) {
      return badRequest("Invalid request body.");
    }

    const body = raw as CreateSimulationBody;

    const ideaRaw = asTrimmedString(body.idea);
    const regionRaw = asTrimmedString(body.region);

    if (!ideaRaw) return badRequest("Idea is required.");
    if (!regionRaw) return badRequest("Region is required.");

    const idea = ideaRaw.slice(0, IDEA_MAX_LEN);
    const region = regionRaw.slice(0, REGION_MAX_LEN);

    const populationNum = asNumber(body.population);
    const sentimentNum = asNumber(body.sentiment);
    const durationNum = asNumber(body.duration);

    // Safe defaults (so UI doesn’t break if a field is missing)
    const population = clamp(
      populationNum ?? 20000,
      POPULATION_MIN,
      POPULATION_MAX
    );

    const sentiment = clamp(sentimentNum ?? 0.65, SENTIMENT_MIN, SENTIMENT_MAX);

    const duration = clamp(durationNum ?? 24, DURATION_MIN, DURATION_MAX);

    if (!process.env.GEMINI_API_KEY) {
      // No key is fine for hackathon demo (fallback agents), but don't crash.
      console.warn(
        "⚠️ GEMINI_API_KEY is missing. Simulation will use fallback mock agents."
      );
    }

    const simulationId = crypto.randomUUID();

    // Initialize record (typed)
    const createdAt = new Date().toISOString();
    const initial: SimulationRecord = {
      id: simulationId,
      status: "PENDING",
      progress: 0,
      idea,
      region,
      createdAt,
    };

    simulations[simulationId] = initial;

    // Run simulation in background
    (async () => {
      try {
        const record = simulations[simulationId];
        if (!record) return;

        record.status = "RUNNING";

        const engine = new SimulationEngine({
          idea,
          region,
          population,
          sentiment,
          duration,
        });

        const result = await engine.run(async (progress: number) => {
          const current = simulations[simulationId];
          if (!current) return;
          current.progress = clamp(progress, 0, 100);
        });

        const completedAt = new Date().toISOString();
        simulations[simulationId] = {
          ...simulations[simulationId],
          status: "COMPLETED",
          progress: 100,
          marketState: result.marketState,
          agents: result.agents,
          events: result.events,
          report: result.report,
          completedAt,
        };
      } catch (err) {
        console.error("Simulation background error:", err);
        const current = simulations[simulationId];
        if (current) {
          current.status = "FAILED";
          current.progress = Math.min(current.progress ?? 0, 99);
        }
      }
    })();

    return NextResponse.json<CreateSimulationSuccess>({
      success: true,
      data: { simulationId },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json<CreateSimulationFail>(
      { success: false, error: { message } },
      { status: 500 }
    );
  }
}