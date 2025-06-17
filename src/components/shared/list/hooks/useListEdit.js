// src/components/list/hooks/useListEdit.js
import { useCallback } from "react"
import { useEditStore } from "../stores/editStores"
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
  const stopEditing = useEditStore(state => state.stopEditing)
  const updateEditData = useEditStore(state => state.updateEditData)
  const setValidationErrors = useEditStore(state => state.setValidationErrors)
  const clearValidationErrors = useEditStore(state => state.clearValidationErrors)
  const isEditing = useEditStore(state => state.isEditing)
  const getEditData = useEditStore(state => state.getEditData)
  const hasUnsavedChanges = useEditStore(state => state.hasUnsavedChanges)

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

  // Stop editing
  const handleStopEditing = useCallback(() => {
    stopEditing(type)
  }, [stopEditing, type])

  // Update edit field
  const handleUpdateField = useCallback((field, value) => {
    let processedValue = value

    // Process specific fields
    if (field === "fullName") {
      processedValue = value.substring(0, 70)
    } else if (type === "student" && field === "iqScore") {
      processedValue = value.replace(/[^0-9]/g, "").substring(0, 3)
    } else if (type === "employee" && (field === "age" || field === "yearsOfService")) {
      processedValue = value.replace(/[^0-9]/g, "").substring(0, 2)
    }

    updateEditData(type, field, processedValue)
    
    // Clear validation errors for this field
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

  return {
    editingItemId: editingItems,
    editData,
    validationErrors,
    isDirty,
    startEditing: handleStartEditing,
    stopEditing: handleStopEditing,
    updateField: handleUpdateField,
    validateData: validateCurrentData,
    getChanges,
    isEditingItem,
    hasUnsavedChanges: () => hasUnsavedChanges(type),
    clearErrors: () => clearValidationErrors(type)
  }
}