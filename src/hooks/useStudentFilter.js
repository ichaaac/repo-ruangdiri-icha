// src/hooks/useStudentFilter.js - Fixed with accurate counseling filter
import { useState, useEffect } from 'react';

export const useStudentFilters = () => {
  const [searchInput, setSearchInput] = useState("");
  const [appliedSortConfig, setAppliedSortConfig] = useState({ key: null, direction: null });

  const [filtersInput, setFiltersInput] = useState({
    classroom: null,
    grade: null,
    gender: null,
    screeningStatus: null,
    counselingStatus: null // null = all, true = sudah konseling, false = belum konseling
  });
  const [appliedFilters, setAppliedFilters] = useState({...filtersInput});
  const [showFilterModal, setShowFilterModal] = useState(false);

  useEffect(() => {
    if (!showFilterModal) {
      setFiltersInput({...appliedFilters});
    }
  }, [showFilterModal, appliedFilters]);

  const requestSort = (key) => {
    let newConfig = { key: null, direction: null };

    if (appliedSortConfig.key === key) {
      if (!appliedSortConfig.direction) {
        newConfig = { key, direction: "ascending" };
      } else if (appliedSortConfig.direction === "ascending") {
        newConfig = { key, direction: "descending" };
      } else {
        newConfig = { key: null, direction: null };
      }
    } else {
      newConfig = { key, direction: "ascending" };
    }

    setAppliedSortConfig(newConfig);
  };

  const getSortIcon = (key) => {
    if (appliedSortConfig.key !== key) return "sort";
    if (!appliedSortConfig.direction) return "sort";
    return appliedSortConfig.direction === "ascending" ? "arrow_upward" : "arrow_downward";
  };

  const handleFilterSelect = (filterType, value) => {
    if (filterType === 'grade' && !filtersInput.classroom) {
      return;
    }

    setFiltersInput(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? null : value,
      ...(filterType === 'classroom' && prev.classroom !== value ? { grade: null } : {})
    }));
  };

  const applyFilters = () => {
    setAppliedFilters({...filtersInput});
  };

  const clearFilters = () => {
    const emptyFilters = {
      classroom: null,
      grade: null,
      gender: null,
      screeningStatus: null,
      counselingStatus: null
    };
    setFiltersInput({...emptyFilters});
    setAppliedFilters({...emptyFilters});
  };

  const hasActiveFilters = Object.values(appliedFilters).some(v => v !== null);

  return {
    searchInput,
    setSearchInput,
    appliedSortConfig,
    requestSort,
    getSortIcon,
    filtersInput,
    setFiltersInput,
    appliedFilters,
    handleFilterSelect,
    applyFilters,
    clearFilters,
    hasActiveFilters,
    showFilterModal,
    setShowFilterModal
  };
};

// src/hooks/useEmployeeFilter.js - Fixed with accurate counseling filter
import { useState } from 'react';

export const useEmployeeFilters = () => {
  const [searchInput, setSearchInput] = useState("");
  const [sortConfigInput, setSortConfigInput] = useState({ key: null, direction: null });
  const [appliedSortConfig, setAppliedSortConfig] = useState({ key: null, direction: null });
  
  const [filtersInput, setFiltersInput] = useState({
    department: null,
    position: null,
    gender: null,
    screeningStatus: null,
    counselingStatus: null // null = all, true = sudah konseling, false = belum konseling
  });
  const [appliedFilters, setAppliedFilters] = useState(filtersInput);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const requestSort = (key) => {
    let newConfig = { key: null, direction: null };
    
    if (appliedSortConfig.key === key) {
      if (!appliedSortConfig.direction) {
        newConfig = { key, direction: "ascending" };
      } else if (appliedSortConfig.direction === "ascending") {
        newConfig = { key, direction: "descending" };
      } else {
        newConfig = { key: null, direction: null };
      }
    } else {
      newConfig = { key, direction: "ascending" };
    }
    
    setSortConfigInput(newConfig);
    setAppliedSortConfig(newConfig);
  };

  const getSortIcon = (key) => {
    if (appliedSortConfig.key !== key) {
      return "sort";
    }
    
    if (!appliedSortConfig.direction) {
      return "sort";
    }
    
    return appliedSortConfig.direction === "ascending" ? "arrow_upward" : "arrow_downward";
  };

  const handleFilterSelect = (filterType, value) => {
    setFiltersInput(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? null : value
    }));
  };

  const applyFilters = () => {
    setAppliedFilters(filtersInput);
  };

  const clearFilters = () => {
    const empty = {
      department: null,
      position: null,
      gender: null,
      screeningStatus: null,
      counselingStatus: null
    };
    setFiltersInput(empty);
    setAppliedFilters(empty);
  };

  const hasActiveFilters = Object.values(appliedFilters).some(v => v !== null);

  return {
    searchInput,
    setSearchInput,
    sortConfigInput,
    appliedSortConfig,
    requestSort,
    getSortIcon,
    filtersInput,
    appliedFilters,
    handleFilterSelect,
    applyFilters,
    clearFilters,
    hasActiveFilters,
    showFilterModal,
    setShowFilterModal
  };
};