import { NextResponse } from 'next/server';

const RESPONSE = {
  error: 'Feature removed',
  code: 'FEATURE_REMOVED',
  message: 'This housing endpoint has been retired. Use client portal and CRM music/workshop flows.',
};

export function GET() {
  return NextResponse.json(RESPONSE, { status: 410 });
}

export function POST() {
  return NextResponse.json(RESPONSE, { status: 410 });
}

export function PUT() {
  return NextResponse.json(RESPONSE, { status: 410 });
}

export function PATCH() {
  return NextResponse.json(RESPONSE, { status: 410 });
}

export function DELETE() {
  return NextResponse.json(RESPONSE, { status: 410 });
}
