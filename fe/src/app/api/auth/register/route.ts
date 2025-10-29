import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    const resp = await fetch(`${backendUrl}/api/auth/reader/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await resp.text();
    let json: any;
    try { json = text ? JSON.parse(text) : {}; } catch { json = { message: text }; }

    if (!resp.ok) {
      return NextResponse.json(
        { error: json?.message || text || 'Registration failed' },
        { status: resp.status }
      );
    }

    return NextResponse.json(json, { status: resp.status });
  } catch (error) {
    console.error('Register API route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


