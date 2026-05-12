import { NextResponse } from 'next/server';
import mockUserData from '@/data/mock-user.json';

export async function GET() {
  // Simulate a slight delay for realism
  await new Promise((resolve) => setTimeout(resolve, 500));
  return NextResponse.json(mockUserData);
}
