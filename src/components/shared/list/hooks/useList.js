// src/components/list/hooks/useList.js
import { useListData } from "./useListData"
import { useListEdit } from "./useListData"
import { useListFilters } from "./useListData"
import { useListOptions } from "./useListOption"
import { useListSort } from "./useListData"
/**
 * Combined hook for complete list functionality
 * @param {string} type - List type
 * @param {string} searchTerm - Search term
 * @returns {Object} Complete list functionality
 */
export const useList = (type, searchTerm = "") => {
  const data = useListData(type, searchTerm)
  const filters = useListFilters(type)
  const sort = useListSort(type)
  const edit = useListEdit(type)
  const options = useListOptions(type)

  return {
    data,
    filters,
    sort,
    edit,
    options
  }
}