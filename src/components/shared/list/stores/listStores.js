// src/components/shared/list/stores/listStore.js
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

/**
 * Main list store for global state management
 */
export const useListStore = create(
  subscribeWithSelector((set, get) => ({
    // Filter state for each type
    filters: {
      student: {
        classroom: null,
        grade: null,
        gender: null,
        screeningStatus: null,
        counselingStatus: null
      },
      employee: {
        department: null,
        position: null,
        gender: null,
        screeningStatus: null,
        counselingStatus: null
      }
    },

    // Sort state for each type
    sortConfig: {
      student: { key: null, direction: null },
      employee: { key: null, direction: null }
    },

    // Search terms for each type
    searchTerms: {
      student: "",
      employee: ""
    },

    // Loading states
    loadingStates: {
      student: false,
      employee: false
    },

    // Error states
    errors: {
      student: null,
      employee: null
    },

    // Actions
    setFilters: (type, newFilters) => set((state) => ({
      filters: {
        ...state.filters,
        [type]: { ...state.filters[type], ...newFilters }
      }
    })),

    clearFilters: (type) => set((state) => ({
      filters: {
        ...state.filters,
        [type]: type === 'student' ? {
          classroom: null,
          grade: null,
          gender: null,
          screeningStatus: null,
          counselingStatus: null
        } : {
          department: null,
          position: null,
          gender: null,
          screeningStatus: null,
          counselingStatus: null
        }
      }
    })),

    setSortConfig: (type, config) => set((state) => ({
      sortConfig: {
        ...state.sortConfig,
        [type]: config
      }
    })),

    setSearchTerm: (type, term) => set((state) => ({
      searchTerms: {
        ...state.searchTerms,
        [type]: term
      }
    })),

    setLoadingState: (type, loading) => set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        [type]: loading
      }
    })),

    setError: (type, error) => set((state) => ({
      errors: {
        ...state.errors,
        [type]: error
      }
    })),

    // Reset all state for a type
    resetListState: (type) => set((state) => ({
      filters: {
        ...state.filters,
        [type]: type === 'student' ? {
          classroom: null,
          grade: null,
          gender: null,
          screeningStatus: null,
          counselingStatus: null
        } : {
          department: null,
          position: null,
          gender: null,
          screeningStatus: null,
          counselingStatus: null
        }
      },
      sortConfig: {
        ...state.sortConfig,
        [type]: { key: null, direction: null }
      },
      searchTerms: {
        ...state.searchTerms,
        [type]: ""
      },
      loadingStates: {
        ...state.loadingStates,
        [type]: false
      },
      errors: {
        ...state.errors,
        [type]: null
      }
    }))
  }))
)