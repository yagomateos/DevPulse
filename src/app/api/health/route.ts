import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({ status: 'ok', dataSource: process.env.DATA_SOURCE ?? 'memory', time: new Date().toISOString() });
}
