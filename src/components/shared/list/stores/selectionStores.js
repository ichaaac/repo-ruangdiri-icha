// src/components/shared/list/stores/selectionStore.js
export const useSelectionStore = create((set, get) => ({
    // Selected items by type
    selectedItems: {
      student: new Set(),
      employee: new Set()
    },
  
    // Bulk selection mode
    bulkSelectionMode: {
      student: false,
      employee: false
    },
  
    // Select all state
    selectAllState: {
      student: false,
      employee: false
    },
  
    // Actions
    selectItem: (type, itemId) => set((state) => {
      const newSelectedItems = new Set(state.selectedItems[type])
      newSelectedItems.add(itemId)
      return {
        selectedItems: {
          ...state.selectedItems,
          [type]: newSelectedItems
        }
      }
    }),
  
    deselectItem: (type, itemId) => set((state) => {
      const newSelectedItems = new Set(state.selectedItems[type])
      newSelectedItems.delete(itemId)
      return {
        selectedItems: {
          ...state.selectedItems,
          [type]: newSelectedItems
        }
      }
    }),
  
    toggleItem: (type, itemId) => {
      const { selectedItems } = get()
      if (selectedItems[type].has(itemId)) {
        get().deselectItem(type, itemId)
      } else {
        get().selectItem(type, itemId)
      }
    },
  
    selectAll: (type, itemIds) => set((state) => ({
      selectedItems: {
        ...state.selectedItems,
        [type]: new Set(itemIds)
      },
      selectAllState: {
        ...state.selectAllState,
        [type]: true
      }
    })),
  
    deselectAll: (type) => set((state) => ({
      selectedItems: {
        ...state.selectedItems,
        [type]: new Set()
      },
      selectAllState: {
        ...state.selectAllState,
        [type]: false
      }
    })),
  
    setBulkSelectionMode: (type, enabled) => set((state) => ({
      bulkSelectionMode: {
        ...state.bulkSelectionMode,
        [type]: enabled
      }
    })),
  
    clearSelections: (type) => set((state) => ({
      selectedItems: {
        ...state.selectedItems,
        [type]: new Set()
      },
      bulkSelectionMode: {
        ...state.bulkSelectionMode,
        [type]: false
      },
      selectAllState: {
        ...state.selectAllState,
        [type]: false
      }
    })),
  
    // Helper methods
    getSelectionInfo: (type) => {
      const { selectedItems } = get()
      return {
        count: selectedItems[type].size,
        items: Array.from(selectedItems[type])
      }
    }
  }))