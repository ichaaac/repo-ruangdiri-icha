// src/components/list/hooks/useListEdit.js
import { useCallback, useEffect } from "react" // ✅ Tambah useEffect
import { useEditStore } from "../stores/editStores"
import { useListStore } from "../stores/listStores"
// ✅ ADD: Import validation functions
import { validateStudentData, validateEmployeeData, getChangedFields } from "../utils/validationUtils"

/**
 * Hook for inline editing
 * @param {string} type - List type
 * @returns {Object} Edit state and operations
 */
export const useListEdit = (type) => {
  const editingItems = useEditStore(state => state.editingItems[type])
  const editData = useEditStore(state => state.editData[type])
  const validationErrors = useEditStore(state => state.validationErrors[type])
  const isDirty = useEditStore(state => state.isDirty[type])

  const startEditing = useEditStore(state => state.startEditing)
  const stopEditingFromStore = useEditStore(state => state.stopEditing) // Rename untuk kejelasan
  const updateEditData = useEditStore(state => state.updateEditData)
  const setValidationErrors = useEditStore(state => state.setValidationErrors)
  const clearValidationErrors = useEditStore(state => state.clearValidationErrors)
  const isEditing = useEditStore(state => state.isEditing)
  const getEditData = useEditStore(state => state.getEditData)
  const hasUnsavedChangesFromStore = useEditStore(state => state.hasUnsavedChanges) // Rename
  const resetEditState = useEditStore(state => state.resetEditState) // ✅ Ambil action resetEditState

  // Start editing an item
  const handleStartEditing = useCallback((itemId, originalData) => {
    const initialData = type === "student"
      ? {
          fullName: originalData.fullName || "",
          classroom: originalData.classroom || "",
          grade: originalData.grade || "",
          gender: originalData.gender || "",
          nis: originalData.nis || "",
          iqScore: originalData.iqScore || 0,
        }
      : {
          fullName: originalData.fullName || "",
          department: originalData.department || "",
          position: originalData.position || "",
          gender: originalData.gender || "",
          age: originalData.age || 0,
          yearsOfService: originalData.yearsOfService || 0,
        }

    startEditing(type, itemId, initialData)
  }, [startEditing, type])

  // Stop editing (ini yang dipanggil di UI, misalnya tombol Cancel/Save)
  const handleStopEditing = useCallback(() => {
    stopEditingFromStore(type)
  }, [stopEditingFromStore, type])

  // Update edit field
  const handleUpdateField = useCallback((field, value) => {
    let processedValue = value

    if (field === "fullName") {
      processedValue = value.substring(0, 70)
    } else if (type === "student" && field === "iqScore") {
      processedValue = value.replace(/[^0-9]/g, "").substring(0, 3)
    } else if (type === "employee" && (field === "age" || field === "yearsOfService")) {
      processedValue = value.replace(/[^0-9]/g, "").substring(0, 2)
    }

    updateEditData(type, field, processedValue)

    if (validationErrors[field]) {
      const newErrors = { ...validationErrors }
      delete newErrors[field]
      setValidationErrors(type, newErrors)
    }
  }, [updateEditData, type, validationErrors, setValidationErrors])

  // Validate current edit data
  const validateCurrentData = useCallback(() => {
    const currentData = getEditData(type)
    const errors = type === "student"
      ? validateStudentData(currentData)
      : validateEmployeeData(currentData)

    setValidationErrors(type, errors)
    return Object.keys(errors).length === 0
  }, [getEditData, setValidationErrors, type])

  // Get changed fields only
  const getChanges = useCallback((originalData) => {
    const currentData = getEditData(type)
    return getChangedFields(originalData, currentData)
  }, [getEditData, type])

  // Check if currently editing specific item
  const isEditingItem = useCallback((itemId) => {
    return isEditing(type, itemId)
  }, [isEditing, type])

  // ✅ INI BAGIAN TERPENTING: Reset state edit saat komponen unmount
  useEffect(() => {
    return () => {
      // Panggil resetEditState dari Zustand saat SharedListPage (yang menggunakan useList) di-unmount
      console.log(`Resetting edit state for type: ${type}`); // Buat ngecek di console
      resetEditState(type);
    };
  }, [type, resetEditState]); // Pastikan type dan resetEditState ada di dependency array

  return {
    editingItemId: editingItems,
    editData,
    validationErrors,
    isDirty,
    startEditing: handleStartEditing,
    stopEditing: handleStopEditing, // Yang ini dipanggil di komponen UI
    updateField: handleUpdateField,
    validateData: validateCurrentData,
    getChanges,
    isEditingItem,
    hasUnsavedChanges: () => hasUnsavedChangesFromStore(type),
    clearErrors: () => clearValidationErrors(type)
  }
}