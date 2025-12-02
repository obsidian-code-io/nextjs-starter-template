import { create } from "zustand";

interface LoadingState {
  loadingItems: Set<string>;
  setLoading: (key: string, isLoading: boolean) => void;
  isLoading: (key: string) => boolean;
  clearAll: () => void;
}

export const useLoadingStore = create<LoadingState>((set, get) => ({
  loadingItems: new Set<string>(),

  setLoading: (key: string, isLoading: boolean) => {
    set((state) => {
      const newSet = new Set(state.loadingItems);
      if (isLoading) {
        newSet.add(key);
      } else {
        newSet.delete(key);
      }
      return { loadingItems: newSet };
    });
  },

  isLoading: (key: string) => {
    return get().loadingItems.has(key);
  },

  clearAll: () => {
    set({ loadingItems: new Set() });
  },
}));
