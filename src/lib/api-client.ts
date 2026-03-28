export interface ApiErrorLike {
  ok?: boolean;
  code?: string;
  message?: string;
  error?: string;
  redirectTo?: string;
  requiresOtp?: boolean;
}

export async function readApiJson(response: Response): Promise<ApiErrorLike> {
  try {
    return (await response.json()) as ApiErrorLike;
  } catch {
    return {};
  }
}

export function getApiErrorMessage(payload: ApiErrorLike, fallback: string): string {
  const message = String(payload.message || payload.error || fallback).trim();
  const code = String(payload.code || '').trim();

  return code ? `${code}: ${message}` : message;
}