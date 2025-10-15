import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value;
    
    // if (!token) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const backendUrl = process.env.BACKEND_API_BASE || 'http://localhost:8080';
    const response = await fetch(`${backendUrl}/api/users`, {
      method: 'GET'
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const users = await response.json();
    return NextResponse.json(users);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const backendUrl = process.env.BACKEND_API_BASE || 'http://localhost:8080';
    
    const response = await fetch(`${backendUrl}/api/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const newUser = await response.json();
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
