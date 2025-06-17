// src/components/shared/list/hooks/useList.js

import { useListData } from "./useListData" // ✅ ini wajib
import { useListFilters } from "./useListFilter"
import { useListSort } from "./useListSort"
import { useListEdit } from "./useListEdit"
import { useListOptions } from "./useListOption"

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
