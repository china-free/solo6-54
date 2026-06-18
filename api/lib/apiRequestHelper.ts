export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface ApiRequestOptions extends Omit<RequestInit, 'method' | 'body' | 'headers'> {
  method?: HttpMethod;
  body?: any;
  headers?: Record<string, string> | Headers | string[][];
  timeout?: number;
  skipJsonBody?: boolean;
}

export interface ApiResponse<T = any> {
  status: number;
  ok: boolean;
  data: T;
  headers: Headers;
  raw: Response;
}

export class ApiRequestError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.data = data;
  }
}

function normalizeHeaders(headers?: Record<string, string> | Headers | string[][]): Headers {
  const result = new Headers();

  if (!headers) return result;

  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      result.set(key, value);
    });
  } else if (Array.isArray(headers)) {
    for (const [key, value] of headers) {
      result.set(key, value);
    }
  } else if (typeof headers === 'object') {
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined && value !== null) {
        result.set(key, String(value));
      }
    }
  }

  return result;
}

function shouldHaveBody(method: HttpMethod): boolean {
  return ['POST', 'PUT', 'PATCH'].includes(method);
}

export function buildApiRequest(
  url: string,
  options: ApiRequestOptions = {}
): { url: string; init: RequestInit } {
  const {
    method = 'GET',
    body,
    headers,
    timeout,
    skipJsonBody = false,
    ...restOptions
  } = options;

  const normalizedHeaders = normalizeHeaders(headers);

  let processedBody = body;
  const hasBody = shouldHaveBody(method) && body !== undefined && body !== null;

  if (hasBody && !skipJsonBody) {
    if (typeof body !== 'string' && !(body instanceof FormData) && !(body instanceof URLSearchParams) && !(body instanceof Blob) && !(body instanceof ArrayBuffer)) {
      if (!normalizedHeaders.has('Content-Type')) {
        normalizedHeaders.set('Content-Type', 'application/json');
      }
      const ct = normalizedHeaders.get('Content-Type') || '';
      if (ct.includes('application/json')) {
        processedBody = JSON.stringify(body);
      }
    } else if (typeof body === 'string' && !normalizedHeaders.has('Content-Type')) {
      normalizedHeaders.set('Content-Type', 'application/json');
    }
  }

  normalizedHeaders.set('Accept', 'application/json');

  const init: RequestInit = {
    method,
    headers: normalizedHeaders,
    ...restOptions
  };

  if (hasBody) {
    init.body = processedBody as BodyInit;
  }

  if (timeout !== undefined) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    init.signal = controller.signal;
  }

  return { url, init };
}

export async function apiRequest<T = any>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const { url: finalUrl, init } = buildApiRequest(url, options);

  const response = await fetch(finalUrl, init);

  let data: any;
  const contentType = response.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || `HTTP ${response.status}`;
    throw new ApiRequestError(errorMessage, response.status, data);
  }

  return {
    status: response.status,
    ok: response.ok,
    data: data as T,
    headers: response.headers,
    raw: response
  };
}

export function createApiClient(baseUrl: string) {
  return {
    get: <T = any>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
      apiRequest<T>(`${baseUrl}${path}`, { ...options, method: 'GET' }),

    post: <T = any>(path: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
      apiRequest<T>(`${baseUrl}${path}`, { ...options, method: 'POST', body }),

    put: <T = any>(path: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
      apiRequest<T>(`${baseUrl}${path}`, { ...options, method: 'PUT', body }),

    delete: <T = any>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
      apiRequest<T>(`${baseUrl}${path}`, { ...options, method: 'DELETE' }),

    patch: <T = any>(path: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
      apiRequest<T>(`${baseUrl}${path}`, { ...options, method: 'PATCH', body }),

    request: <T = any>(path: string, options?: ApiRequestOptions) =>
      apiRequest<T>(`${baseUrl}${path}`, options)
  };
}
