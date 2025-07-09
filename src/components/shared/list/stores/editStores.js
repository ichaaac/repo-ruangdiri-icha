// src/components/list/stores/editStore.js
import { create } from "zustand"

export const useEditStore = create((set, get) => ({
    // Currently editing items by type
    editingItems: {
      student: null,
      employee: null
    },
    // Edit data for each type
    editData: {
      student: {},
      employee: {}
    },
    // Validation errors
    validationErrors: {
      student: {},
      employee: {}
    },
    // Dirty state (unsaved changes)
    isDirty: {
      student: false,
      employee: false
    },

    // Actions
    startEditing: (type, itemId, initialData) => set((state) => ({
      editingItems: {
        ...state.editingItems,
        [type]: itemId
      },
      editData: {
        ...state.editData,
        [type]: { ...initialData }
      },
      validationErrors: {
        ...state.validationErrors,
        [type]: {}
      },
      isDirty: {
        ...state.isDirty,
        [type]: false
      }
    })),

    stopEditing: (type) => set((state) => ({
      editingItems: {
        ...state.editingItems,
        [type]: null
      },
      editData: {
        ...state.editData,
        [type]: {}
      },
      validationErrors: {
        ...state.validationErrors,
        [type]: {}
      },
      isDirty: {
        ...state.isDirty,
        [type]: false
      }
    })),

    updateEditData: (type, field, value) => set((state) => ({
      editData: {
        ...state.editData,
        [type]: {
          ...state.editData[type],
          [field]: value
        }
      },
      isDirty: {
        ...state.isDirty,
        [type]: true
      }
    })),

    setValidationErrors: (type, errors) => set((state) => ({
      validationErrors: {
        ...state.validationErrors,
        [type]: errors
      }
    })),

    clearValidationErrors: (type) => set((state) => ({
      validationErrors: {
        ...state.validationErrors,
        [type]: {}
      }
    })),

    // Helper methods
    isEditing: (type, itemId) => {
      const { editingItems } = get()
      return editingItems[type] === itemId
    },

    getEditData: (type) => {
      const { editData } = get()
      return editData[type]
    },

    hasUnsavedChanges: (type) => {
      const { isDirty } = get()
      return isDirty[type]
    },

    // ✅ ACTION BARU UNTUK MERESET SEMUA STATE EDIT UNTUK TIPE TERTENTU
    resetEditState: (type) => set((state) => ({
      editingItems: {
        ...state.editingItems,
        [type]: null
      },
      editData: {
        ...state.editData,
        [type]: {}
      },
      validationErrors: {
        ...state.validationErrors,
        [type]: {}
      },
      isDirty: {
        ...state.isDirty,
        [type]: false
      },
    })),
}))