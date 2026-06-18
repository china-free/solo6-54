import { create } from 'zustand';
import type { Feature, HistoryRecord, Environment, FeatureWithInsights } from '../../shared/types.js';
import { api } from '../lib/api.js';

interface StoreState {
  features: Feature[];
  featureInsights: FeatureWithInsights[];
  selectedEnvironment: Environment;
  history: HistoryRecord[];
  stats: {
    total: number;
    byEnvironment: Record<Environment, {
      total: number;
      active: number;
      gradual: number;
      disabled: number;
    }>;
  } | null;
  dashboardStats: {
    totalFeatures: number;
    avgCompleteness: number;
    totalErrors: number;
    totalWarnings: number;
    totalReadyToRelease: number;
    byEnvironment: Record<Environment, {
      total: number;
      active: number;
      gradual: number;
      disabled: number;
      complete: number;
      partial: number;
      incomplete: number;
      errors: number;
      warnings: number;
      readyToRelease: number;
    }>;
    recentChanges: Array<{
      featureId: string;
      featureName: string;
      operation: 'create' | 'update' | 'delete';
      operator: string;
      timestamp: string;
      summary: string;
    }>;
  } | null;
  loading: boolean;
  error: string | null;

  setEnvironment: (env: Environment) => void;
  fetchFeatures: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchFeatureInsights: () => Promise<void>;
  fetchDashboardStats: () => Promise<void>;
  fetchHistory: (featureId?: string) => Promise<void>;
  createFeature: (data: any) => Promise<Feature>;
  updateFeature: (id: string, data: any) => Promise<Feature | null>;
  deleteFeature: (id: string) => Promise<boolean>;
}

export const useStore = create<StoreState>((set, get) => ({
  features: [],
  featureInsights: [],
  selectedEnvironment: 'production',
  history: [],
  stats: null,
  dashboardStats: null,
  loading: false,
  error: null,

  setEnvironment: (env) => set({ selectedEnvironment: env }),

  fetchFeatures: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.features.getAll();
      set({ features: response.data, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.features.getStats();
      set({ stats: response.data, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchFeatureInsights: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.features.getInsights();
      set({ featureInsights: response.data, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchDashboardStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.features.getDashboard();
      set({ dashboardStats: response.data, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchHistory: async (featureId?: string) => {
    set({ loading: true, error: null });
    try {
      const response = featureId
        ? await api.features.getHistory(featureId)
        : await api.history.getAll();
      set({ history: response.data, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createFeature: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.features.create(data);
      set((state) => ({
        features: [response.data, ...state.features],
        loading: false
      }));
      await Promise.all([
        get().fetchStats(),
        get().fetchFeatureInsights(),
        get().fetchDashboardStats()
      ]);
      return response.data;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateFeature: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.features.update(id, data);
      set((state) => ({
        features: state.features.map((f) =>
          f.id === id ? response.data : f
        ),
        loading: false
      }));
      await Promise.all([
        get().fetchStats(),
        get().fetchFeatureInsights(),
        get().fetchDashboardStats()
      ]);
      return response.data;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deleteFeature: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.features.delete(id);
      set((state) => ({
        features: state.features.filter((f) => f.id !== id),
        loading: false
      }));
      await Promise.all([
        get().fetchStats(),
        get().fetchFeatureInsights(),
        get().fetchDashboardStats()
      ]);
      return true;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      return false;
    }
  }
}));
