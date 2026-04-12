import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://nowis.store',
  'https://www.nowis.store',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/$/, '');
}

function parseEnvOrigins() {
  const raw = [process.env.SITE_ORIGIN, process.env.CORS_ALLOWED_ORIGINS]
    .filter(Boolean)
    .join(',');

  if (!raw) return [];

  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map(normalizeOrigin);
}

export function getAllowedOrigins() {
  return Array.from(new Set([...DEFAULT_ALLOWED_ORIGINS, ...parseEnvOrigins()]));
}

export function resolveAllowedOrigin(request: NextRequest) {
  const requestOrigin = normalizeOrigin(request.headers.get('origin') || '');
  if (!requestOrigin) return '';

  return getAllowedOrigins().includes(requestOrigin) ? requestOrigin : '';
}

interface CorsOptions {
  methods?: string;
  headers?: string;
  credentials?: boolean;
}

export function applyCorsHeaders(response: NextResponse, request: NextRequest, options: CorsOptions = {}) {
  const allowedOrigin = resolveAllowedOrigin(request);
  if (!allowedOrigin) return response;

  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Vary', 'Origin');
  response.headers.set('Access-Control-Allow-Methods', options.methods || 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', options.headers || 'Content-Type, Authorization');

  if (options.credentials !== false) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

export function buildCorsPreflightResponse(request: NextRequest, options: CorsOptions = {}) {
  const response = new NextResponse(null, { status: 204 });
  return applyCorsHeaders(response, request, options);
}
