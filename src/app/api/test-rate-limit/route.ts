import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';

export async function GET(req: NextRequest) {
    const results: string[] = [];
    const startTime = Date.now();

    console.log("🚀 Starting Rate Limit Test: 20 parallel requests");

    const tasks = Array.from({ length: 20 }).map((_, i) => {
        return (async () => {
            const id = i + 1;
            try {
                const response = await callGemini(`Hello Gemini, this is request #${id}. Reply with "Received #${id}"`, false, 1);
                console.log(`✅ Request #${id} finished`);
                return `Request #${id}: Success`;
            } catch (error: any) {
                console.error(`❌ Request #${id} failed:`, error.message);
                return `Request #${id}: Failed - ${error.message}`;
            }
        })();
    });

    const output = await Promise.all(tasks);
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    return NextResponse.json({
        duration: `${duration}s`,
        results: output
    });
}
