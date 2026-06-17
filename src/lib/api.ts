import type {
  Feature,
  FeatureRequest,
  HistoryRecord,
  EvaluateResponse,
  Environment
} from '../../shared/types.js';

const API_BASE = '/api';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export interface ApiResponse<T> {
  data: T;
  pagination?: {
    limit: number;
    offset: number;
    total: number;
  };
}

export const api = {
  features: {
    getAll: () =>
      request<ApiResponse<Feature[]>>('/features'),

    getById: (id: string) =>
      request<ApiResponse<Feature>>(`/features/${id}`),

    getStats: () =>
      request<ApiResponse<{
        total: number;
        byEnvironment: Record<Environment, {
          total: number;
          active: number;
          gradual: number;
          disabled: number;
        }>;
      }>>('/features/stats'),

    getHistory: (id: string, limit = 50, offset = 0) =>
      request<ApiResponse<HistoryRecord[]>>(
        `/features/${id}/history?limit=${limit}&offset=${offset}`
      ),

    create: (data: FeatureRequest) =>
      request<ApiResponse<Feature>>('/features', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'X-Operator': 'admin'
        }
      }),

    update: (id: string, data: Partial<FeatureRequest>) =>
      request<ApiResponse<Feature>>(`/features/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'X-Operator': 'admin'
        }
      }),

    delete: (id: string) =>
      request<{ message: string }>(`/features/${id}`, {
        method: 'DELETE',
        headers: {
          'X-Operator': 'admin'
        }
      })
  },

  evaluate: {
    evaluate: (featureKey: string, userId: string, environment: Environment) =>
      request<ApiResponse<EvaluateResponse>>(
        `/evaluate?featureKey=${featureKey}&userId=${userId}&environment=${environment}`
      ),

    evaluateBatch: (featureKeys: string[], userId: string, environment: Environment) =>
      request<ApiResponse<EvaluateResponse[]>>(
        `/evaluate/batch?featureKeys=${featureKeys.join(',')}&userId=${userId}&environment=${environment}`
      ),

    evaluateAll: (userId: string, environment: Environment) =>
      request<ApiResponse<EvaluateResponse[]>>(
        `/evaluate/all?userId=${userId}&environment=${environment}`
      ),

    getBucket: (userId: string, featureKey: string) =>
      request<ApiResponse<{ bucket: number; featureKey: string }>>(
        `/evaluate/bucket?userId=${userId}&featureKey=${featureKey}`
      ),

    simulate: (featureKey: string, percentage: number, sampleSize = 1000) =>
      request<ApiResponse<{
        enabled: number;
        disabled: number;
        percentage: number;
      }>>(
        `/evaluate/simulate?featureKey=${featureKey}&percentage=${percentage}&sampleSize=${sampleSize}`
      )
  },

  history: {
    getAll: (limit = 50, offset = 0, operation?: string, environment?: Environment) => {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset)
      });
      if (operation) params.append('operation', operation);
      if (environment) params.append('environment', environment);
      return request<ApiResponse<HistoryRecord[]>>(`/history?${params.toString()}`);
    }
  }
};
