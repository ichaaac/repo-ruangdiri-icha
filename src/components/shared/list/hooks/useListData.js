// src/components/list/hooks/useListData.js
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { studentListService, employeeListService } from "../services/listApiService"
import { useListStore } from "../stores/listStores"
import { sortData } from "../utils/sortUtils"
import useDebounce from "@/hooks/useDebounce"

/**
 * Main hook for list data management
 * @param {string} type - List type ('student' or 'employee')
 * @param {string} searchTerm - Search term
 * @returns {Object} List data and operations
 */
export const useListData = (type, searchTerm = "") => {
  const queryClient = useQueryClient()
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  
  // Get state from store
  const filters = useListStore(state => state.filters[type])
  const sortConfig = useListStore(state => state.sortConfig[type])
  const setLoadingState = useListStore(state => state.setLoadingState)
  const setError = useListStore(state => state.setError)

  // Get appropriate service
  const service = type === "student" ? studentListService : employeeListService

  // Infinite query for list data
  const infiniteQuery = useInfiniteQuery({
    queryKey: [`infinite${type}s`, debouncedSearchTerm, filters],
    queryFn: async ({ pageParam = 1 }) => {
      setLoadingState(type, true)
      
      try {
        const params = {
          page: pageParam,
          limit: type === "student" ? 30 : 10,
          search: debouncedSearchTerm,
          filters
        }
        
        let result
        if (type === "student") {
          result = await service.fetchStudents(params)
          setError(type, null)
          return {
            data: result.students,
            metadata: result.metadata,
            pageParam
          }
        } else {
          result = await service.fetchEmployees(params)
          setError(type, null)
          return {
            data: result.employees,
            metadata: result.metadata,
            pageParam
          }
        }
      } catch (error) {
        setError(type, error.message)
        throw error
      } finally {
        setLoadingState(type, false)
      }
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPage } = lastPage.metadata
      return page < totalPage ? page + 1 : undefined
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      if (type === "student") {
        return await service.updateStudent(id, data)
      } else {
        return await service.updateEmployee(id, data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries([`infinite${type}s`])
    },
    onError: (error) => {
      setError(type, error.message)
    }
  })

  // Process and sort data
  const processedData = useMemo(() => {
    const allItems = infiniteQuery.data?.pages.flatMap(page => page.data) || []
    
    // Apply client-side search for employees if needed
    let filteredItems = allItems
    if (type === "employee" && debouncedSearchTerm) {
      filteredItems = service.filterEmployeesClientSide(allItems, debouncedSearchTerm)
    }

    // Apply sorting
    return sortData(filteredItems, sortConfig)
  }, [infiniteQuery.data, debouncedSearchTerm, sortConfig, type, service])

  // Get metadata from first page
  const metadata = infiniteQuery.data?.pages[0]?.metadata

  return {
    // Data
    data: processedData,
    totalData: metadata?.totalData || 0,
    genderCounts: metadata?.byGender || { male: 0, female: 0 },
    
    // Loading states
    isLoading: infiniteQuery.isLoading,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    hasNextPage: infiniteQuery.hasNextPage,
    
    // Operations
    fetchNextPage: infiniteQuery.fetchNextPage,
    refetch: infiniteQuery.refetch,
    updateItem: updateMutation,
    
    // Error handling
    isError: infiniteQuery.isError,
    error: infiniteQuery.error,
  }
}

// src/components/list/hooks/useListFilters.js
import { useCallback, useMemo } from "react"
import { useListStore } from "../stores/listStore"
import { hasActiveFilters } from "../utils/filterUtils"

/**
 * Hook for filter management
 * @param {string} type - List type
 * @returns {Object} Filter state and operations
 */
export const useListFilters = (type) => {
  const filters = useListStore(state => state.filters[type])
  const setFilters = useListStore(state => state.setFilters)
  const clearFilters = useListStore(state => state.clearFilters)

  // Update specific filter
  const updateFilter = useCallback((filterType, value) => {
    // Special handling for dependent filters
    if (type === "student" && filterType === "classroom") {
      // Clear grade when classroom changes
      setFilters(type, { [filterType]: value, grade: null })
    } else {
      setFilters(type, { [filterType]: value })
    }
  }, [type, setFilters])

  // Toggle filter value
  const toggleFilter = useCallback((filterType, value) => {
    const currentValue = filters[filterType]
    updateFilter(filterType, currentValue === value ? null : value)
  }, [filters, updateFilter])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    clearFilters(type)
  }, [type, clearFilters])

  // Check if filters are active
  const areFiltersActive = useMemo(() => {
    return hasActiveFilters(filters)
  }, [filters])

  return {
    filters,
    updateFilter,
    toggleFilter,
    clearAllFilters,
    areFiltersActive
  }
}

// src/components/list/hooks/useListSort.js
import { useCallback } from "react"
import { useListStore } from "../stores/listStore"
import { getNextSortConfig, getSortIcon } from "../utils/sortUtils"

/**
 * Hook for sort management
 * @param {string} type - List type
 * @returns {Object} Sort state and operations
 */
export const useListSort = (type) => {
  const sortConfig = useListStore(state => state.sortConfig[type])
  const setSortConfig = useListStore(state => state.setSortConfig)

  // Request sort for column
  const requestSort = useCallback((key) => {
    const newConfig = getNextSortConfig(sortConfig.key, key, sortConfig.direction)
    setSortConfig(type, newConfig)
  }, [sortConfig, setSortConfig, type])

  // Get sort icon for column
  const getSortIconForColumn = useCallback((columnKey) => {
    return getSortIcon(columnKey, sortConfig)
  }, [sortConfig])

  // Clear sorting
  const clearSort = useCallback(() => {
    setSortConfig(type, { key: null, direction: null })
  }, [setSortConfig, type])

  return {
    sortConfig,
    requestSort,
    getSortIcon: getSortIconForColumn,
    clearSort
  }
}

// src/components/list/hooks/useListEdit.js
import { useCallback } from "react"
import { useEditStore } from "../stores/editStore"
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