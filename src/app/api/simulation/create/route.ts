import { NextRequest, NextResponse } from 'next/server';
import { SimulationEngine } from '@/lib/SimulationEngine';
import { simulations } from '@/lib/store';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { idea, region, population, sentiment, duration } = body;

        if (!process.env.GEMINI_API_KEY) {
            console.warn("⚠️ GEMINI_API_KEY is missing. Simulation will use fallback mock agents.");
        }

        const simulationId = crypto.randomUUID();

        // Initialize record
        simulations[simulationId] = {
            id: simulationId,
            status: 'PENDING',
            progress: 0,
            idea,
            region,
            createdAt: new Date().toISOString()
        };

        // Run simulation in background
        (async () => {
            try {
                simulations[simulationId].status = 'RUNNING';

                const engine = new SimulationEngine({
                    idea,
                    region,
                    population,
                    sentiment,
                    duration
                });

                const result = await engine.run(async (progress: number) => {
                    simulations[simulationId].progress = progress;
                });

                simulations[simulationId] = {
                    ...simulations[simulationId],
                    status: 'COMPLETED',
                    progress: 100,
                    marketState: result.marketState,
                    agents: result.agents,
                    events: result.events,
                    report: result.report,
                    completedAt: new Date().toISOString()
                };
            } catch (err) {
                console.error("Simulation background error:", err);
                simulations[simulationId].status = 'FAILED';
            }
        })();

        return NextResponse.json({
            success: true,
            data: { simulationId }
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { message: error.message } },
            { status: 500 }
        );
    }
}

// Handler for GET /api/simulation/:id is handled in the dynamic route
