// src/components/list/hooks/useListData.js
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { studentListService, employeeListService } from "../services/listApiService"
import { useListStore } from "../stores/listStores"
import { sortData } from "../utils/sortUtils"

/**
 * Main hook for list data management (queries + mutations)
 * @param {string} type - List type (student/employee)
 * @param {string} searchTerm - Search term
 * @returns {Object} Complete data operations
 */
export const useListData = (type, searchTerm = "") => {
  const queryClient = useQueryClient()
  
  // Get filters and sort from store
  const filters = useListStore(state => state.filters[type])
  const sortConfig = useListStore(state => state.sortConfig[type])

  // Build query key
  const queryKey = [
    type === "student" ? "students" : "employees",
    { search: searchTerm, filters, sort: sortConfig }
  ]

  // Service selection
  const service = type === "student" ? studentListService : employeeListService
  const fetchMethod = type === "student" ? "fetchStudents" : "fetchEmployees"

  // ✅ INFINITE QUERY for pagination
  const infiniteQuery = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        page: pageParam,
        limit: type === "student" ? 30 : 10,
        search: searchTerm.trim(),
        filters
      }
      
      return await service[fetchMethod](params)
    },
    getNextPageParam: (lastPage) => {
      const metadata = lastPage.metadata
      return metadata?.hasNextPage ? metadata.page + 1 : undefined
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true
  })

  // ✅ UPDATE MUTATION with proper payload handling
  const updateItem = useMutation({
    mutationFn: async (payload) => {
      console.log("🔧 useListData updateItem.mutationFn called with:", payload)
      
      // Ensure payload structure: { id, field1, field2, ... }
      if (!payload.id) {
        console.error("❌ Missing ID in payload:", payload)
        throw new Error(`Missing ID in update payload for ${type}`)
      }

      console.log(`🚀 Updating ${type} with payload:`, payload) // Debug log

      if (type === "student") {
        return await studentListService.updateStudent(payload)
      } else if (type === "employee") {
        return await employeeListService.updateEmployee(payload)
      }
      throw new Error(`Unknown type: ${type}`)
    },
    onSuccess: (data, variables) => {
      console.log(`✅ Successfully updated ${type}:`, variables.id) // Debug log
      
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ 
        queryKey: [type === "student" ? "students" : "employees"] 
      })

      // Optional: Optimistic update for better UX
      queryClient.setQueryData(queryKey, (oldData) => {
        if (!oldData?.pages) return oldData
        
        return {
          ...oldData,
          pages: oldData.pages.map(page => ({
            ...page,
            [type === "student" ? "students" : "employees"]: 
              page[type === "student" ? "students" : "employees"]?.map(item => 
                item.id === variables.id 
                  ? { ...item, ...variables } // Apply flat changes
                  : item
              ) || []
          }))
        }
      })
    },
    onError: (error, variables) => {
      console.error(`❌ Failed to update ${type}:`, error, variables)
      // You can add toast notification here
    }
  })

  // ✅ Process and flatten data
  const processedData = useMemo(() => {
    if (!infiniteQuery.data?.pages) {
      return {
        data: [],
        totalData: 0,
        genderCounts: { male: 0, female: 0 },
        hasNextPage: false,
        isFetchingNextPage: false
      }
    }

    // Flatten all pages data
    const allItems = infiniteQuery.data.pages.flatMap(page => 
      page[type === "student" ? "students" : "employees"] || []
    )

    // Apply client-side sorting
    const sortedData = sortData(allItems, sortConfig)

    // Get metadata from first page
    const firstPageMetadata = infiniteQuery.data.pages[0]?.metadata
    
    return {
      data: sortedData,
      totalData: firstPageMetadata?.totalData || allItems.length,
      genderCounts: firstPageMetadata?.byGender || { male: 0, female: 0 },
      hasNextPage: infiniteQuery.hasNextPage,
      isFetchingNextPage: infiniteQuery.isFetchingNextPage
    }
  }, [infiniteQuery.data, sortConfig, type])

  return {
    // Data from query
    ...processedData,
    
    // Query states
    isLoading: infiniteQuery.isLoading,
    isError: infiniteQuery.isError,
    error: infiniteQuery.error,
    refetch: infiniteQuery.refetch,
    
    // Pagination
    fetchNextPage: infiniteQuery.fetchNextPage,
    
    // Mutations
    updateItem, // ✅ This is what SharedTable needs
    
    // Helper methods
    invalidateQueries: () => {
      queryClient.invalidateQueries({ 
        queryKey: [type === "student" ? "students" : "employees"] 
      })
    }
  }
}

/**
 * Legacy export for backward compatibility
 */
export const useListMutations = (type) => {
  console.warn("useListMutations is deprecated, use useListData instead")
  const { updateItem } = useListData(type)
  return { updateItem }
}