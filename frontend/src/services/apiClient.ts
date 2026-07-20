import type { ApiErrorDto } from '../types/dto';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly payload?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

function getApiUrl(pathname: string): string {
  return `${apiBaseUrl}${pathname}`;
}

function parseErrorMessage(payload: unknown, fallbackCode: string): string {
  const maybeObj = payload as { error?: ApiErrorDto | string; message?: string } | undefined;

  if (typeof maybeObj?.error === 'string') {
    return maybeObj.error;
  }

  if (maybeObj?.error && typeof maybeObj.error === 'object' && maybeObj.error.message) {
    return maybeObj.error.message;
  }

  if (typeof maybeObj?.message === 'string') {
    return maybeObj.message;
  }

  return fallbackCode;
}

export async function fetchJson<T>(pathname: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(getApiUrl(pathname), {
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiClientError(parseErrorMessage(payload, 'request_failed'), response.status, payload);
  }

  return payload as T;
}

export async function postMultipart<T>(pathname: string, formData: FormData): Promise<T> {
  const response = await fetch(getApiUrl(pathname), {
    method: 'POST',
    body: formData
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiClientError(parseErrorMessage(payload, 'upload_failed'), response.status, payload);
  }

  return payload as T;
}
