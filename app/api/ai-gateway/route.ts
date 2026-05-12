import { NextResponse } from 'next/server';
import mockAiInsights from '@/data/mock-ai-insights.json';

export async function GET() {
  // Simulate AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return NextResponse.json(mockAiInsights);
}
