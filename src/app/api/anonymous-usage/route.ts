import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json({ ok: false, error: '匿名试用已关闭，请注册后使用', blocked: true, remaining: 0 });
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ ok: false, error: '匿名试用已关闭', blocked: true, remaining: 0 });
}