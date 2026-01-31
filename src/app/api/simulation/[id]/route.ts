import { NextRequest, NextResponse } from 'next/server';
import { simulations } from '@/lib/store';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const simulation = simulations[id];

    if (!simulation) {
        return NextResponse.json(
            { success: false, error: { message: 'Simulation not found' } },
            { status: 404 }
        );
    }

    return NextResponse.json({
        success: true,
        data: simulation
    });
}
