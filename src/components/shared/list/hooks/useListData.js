// src/components/list/hooks/useListData.js
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { studentListService, employeeListService } from "../services/listApiService"
import { sortData } from "../utils/sortUtils"
import useDebounce from "@/hooks/useDebounce"
import { useListStore } from "../stores/listStores"

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

