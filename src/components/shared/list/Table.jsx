// src/components/shared/list/Table.jsx - Complete Shared Table Component
import React, { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Transition } from '@headlessui/react';
import { useNavigate } from "react-router-dom";
import clsx from 'clsx';

// Reusable Custom Dropdown Component
const CustomDropdown = ({ name, value, onChange, options, className = "", disabled = false }) => {
  const currentOption = options.find(opt => (opt.value !== undefined ? opt.value : opt) === value);
  const displayValue = currentOption?.label || currentOption || value;

  const handleSelect = (optionValue) => {
    onChange({ 
      target: { name, value: optionValue },
      synthetic: true
    });
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        disabled={disabled}
        className={clsx(
          "w-full text-left px-2 sm:px-3 py-1.5 text-xs sm:text-sm border rounded-md",
          "flex items-center justify-between gap-1 sm:gap-2",
          "transition-[border-color,box-shadow] duration-150 ease-in-out",
          disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
            : "bg-white hover:border-[#488BBE] border-gray-300 focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE]",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="truncate">{displayValue}</span>
        <span className="material-icons text-gray-400 text-xs sm:text-sm">expand_more</span>
      </Menu.Button>

      <Transition
        as={React.Fragment}
        enter="transition duration-100 ease-out"
        enterFrom="transform opacity-0 scale-95 translate-y-1"
        enterTo="transform opacity-100 scale-100 translate-y-0"
        leave="transition duration-75 ease-in"
        leaveFrom="transform opacity-100 scale-100 translate-y-0"
        leaveTo="transform opacity-0 scale-95 translate-y-1"
      >
        <Menu.Items
          modal={false}
          className="absolute z-50 mt-2 w-full bg-white rounded-md shadow-lg border border-gray-200 py-1 focus:outline-none max-h-60 overflow-y-auto"
        >
          {options.map((option) => {
            const optionValue = option.value !== undefined ? option.value : option;
            const optionLabel = option.label || option;
            const isSelected = optionValue === value;

            return (
              <Menu.Item key={optionValue}>
                {({ active }) => (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(optionValue);
                    }}
                    className={clsx(
                      "w-full text-left px-2 sm:px-3 py-2 text-xs sm:text-sm flex items-center justify-between",
                      "transition-colors duration-100",
                      active && "bg-[#E2F9FF]",
                      isSelected && "bg-[#E2F9FF] text-[#488BBE] font-medium"
                    )}
                  >
                    <span>{optionLabel}</span>
                    {isSelected && (
                      <span className="material-icons text-[#488BBE] text-xs sm:text-sm">check</span>
                    )}
                  </button>
                )}
              </Menu.Item>
            );
          })}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

// Enhanced Custom Scrollbar Component
const CustomScrollbar = ({ contentRef, className = "" }) => {
  const scrollbarRef = useRef(null);
  const thumbRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scrollRatio, setScrollRatio] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [thumbWidth, setThumbWidth] = useState(20);

  const updateScrollbar = useCallback(() => {
    if (!contentRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = contentRef.current;
    const maxScroll = scrollWidth - clientWidth;
    
    setIsVisible(maxScroll > 0);
    if (maxScroll > 0) {
      setScrollRatio(scrollLeft / maxScroll);
      const visibleRatio = clientWidth / scrollWidth;
      setThumbWidth(Math.max(visibleRatio * 100, 15));
    }
  }, [contentRef]);

  const handleScrollbarClick = useCallback((e) => {
    if (!contentRef.current || !scrollbarRef.current || e.target === thumbRef.current) return;
    
    const rect = scrollbarRef.current.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    const maxScroll = contentRef.current.scrollWidth - contentRef.current.clientWidth;
    
    contentRef.current.scrollLeft = percentage * maxScroll;
  }, [contentRef]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    
    const startX = e.clientX;
    const startScrollLeft = contentRef.current.scrollLeft;
    const scrollbarWidth = scrollbarRef.current.offsetWidth;
    const maxScroll = contentRef.current.scrollWidth - contentRef.current.clientWidth;
    
    const handleMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const percentage = deltaX / scrollbarWidth;
      contentRef.current.scrollLeft = startScrollLeft + (percentage * maxScroll);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [contentRef]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    
    content.addEventListener('scroll', updateScrollbar);
    updateScrollbar();
    
    const resizeObserver = new ResizeObserver(updateScrollbar);
    resizeObserver.observe(content);
    
    return () => {
      content.removeEventListener('scroll', updateScrollbar);
      resizeObserver.disconnect();
    };
  }, [contentRef, updateScrollbar]);

  if (!isVisible) return null;

  return (
    <div className={clsx("relative w-full h-3 px-2 sm:px-4 mb-2", className)}>
      <div 
        ref={scrollbarRef}
        className="relative h-1 bg-gray-200 rounded-full cursor-pointer"
        onClick={handleScrollbarClick}
      >
        <div 
          ref={thumbRef}
          className={clsx(
            "absolute h-full bg-[#488BBE] rounded-full transition-opacity",
            isDragging ? "opacity-100" : "opacity-80 hover:opacity-100"
          )}
          style={{ 
            width: `${thumbWidth}%`,
            left: `${scrollRatio * (100 - thumbWidth)}%`,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          onMouseDown={handleMouseDown}
        />
      </div>
    </div>
  );
};

// Help Tooltip Component
const HelpTooltip = ({ helpIconRef, showHelpTooltip }) => (
  <AnimatePresence>
    {showHelpTooltip && (
      <motion.div 
        className="fixed bg-[#00000080] text-white text-xs rounded-md p-2.5 shadow-lg z-[1000]"
        style={{ 
          width: "150px",
          top: helpIconRef.current?.getBoundingClientRect().top - 80,
          left: helpIconRef.current?.getBoundingClientRect().left + 20,
        }}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
      >
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center">
            <span className="material-icons text-red-500 text-sm mr-1.5">warning</span>
            <span>Berisiko</span>
          </div>
          <div className="flex items-center">
            <span className="material-icons text-yellow-500 text-sm mr-1.5">error</span>
            <span>Pengawasan</span>
          </div>
          <div className="flex items-center">
            <span className="material-icons text-green-500 text-sm mr-1.5">check_circle</span>
            <span>Stabil</span>
          </div>
          <div className="flex items-center">
            <span className="material-icons text-sm font-bold text-[#535353] mr-2">remove</span>
            <span>Belum Skrining</span>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

/**
 * Complete Shared Table Component for Student and Employee
 */
const SharedTable = ({
  type = "student",
  data = [],
  searchInput = "",
  getSortIcon,
  requestSort,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  updateItem,
  optionsData = {},
  resetEditMode,
  filtersChanged,
  isLoading = false
}) => {
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const [hoveredStatus, setHoveredStatus] = useState(null);
  const [showEditTooltip, setShowEditTooltip] = useState(null);
  const [activatedNames, setActivatedNames] = useState(new Set());
  const helpIconRef = useRef(null);
  const observerRef = useRef(null);
  const contentRef = useRef(null);

  // Configure table based on type
  const tableConfig = {
    student: {
      minWidth: 1000,
      emptyIcon: 'school',
      emptyText: 'Tidak ada data siswa.',
      columns: [
        { key: 'fullName', label: 'NAMA', sortable: true, searchable: true, clickable: true },
        { key: 'classroom', label: 'KELAS', compound: true },
        { key: 'gender', label: 'JENIS KELAMIN', mobileLabel: 'GENDER', dropdown: true },
        { key: 'nis', label: 'NIS', sortable: true, searchable: true },
        { key: 'screeningStatus', label: 'SKRINING', status: true, hasHelp: true },
        { key: 'counselingStatus', label: 'KONSELING', boolean: true },
        { key: 'iqScore', label: 'SKOR IQ', mobileLabel: 'IQ', sortable: true, number: true }
      ]
    },
    employee: {
      minWidth: 1000,
      emptyIcon: 'business_center',
      emptyText: 'Tidak ada data karyawan.',
      columns: [
        { key: 'fullName', label: 'NAMA', sortable: true, searchable: true },
        { key: 'department', label: 'DEPARTEMEN', dropdown: true },
        { key: 'position', label: 'JABATAN', dropdown: true },
        { key: 'gender', label: 'JENIS KELAMIN', mobileLabel: 'GENDER', dropdown: true },
        { key: 'age', label: 'USIA', sortable: true, number: true, suffix: 'Thn' },
        { key: 'yearsOfService', label: 'LAMA BEKERJA', mobileLabel: 'MASA KERJA', sortable: true, number: true, suffix: 'Thn' },
        { key: 'screeningStatus', label: 'SKRINING', status: true, hasHelp: true },
        { key: 'counselingStatus', label: 'KONSELING', boolean: true }
      ]
    }
  };

  const config = tableConfig[type];

  // Reset edit mode when filters change
  useEffect(() => {
    if (filtersChanged && editingId) {
      setEditingId(null);
      setEditData({});
    }
  }, [filtersChanged, editingId]);

  // Expose reset function to parent via ref
  useEffect(() => {
    if (resetEditMode && resetEditMode.current !== null) {
      resetEditMode.current = () => {
        setEditingId(null);
        setEditData({});
        setActivatedNames(new Set());
      };
    }
  }, [resetEditMode]);

  // Infinite scroll observer
  const lastItemElementRef = useCallback(node => {
    if (observerRef.current) observerRef.current.disconnect();
    if (isFetchingNextPage || !hasNextPage) return;
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
    }, { threshold: 0.1, rootMargin: '0px 0px 100px 0px' });
    
    if (node) observerRef.current.observe(node);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  // Handle name click for navigation (students only)
  const handleNameClick = (id, e) => {
    if (type !== "student") return;
    
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (editingId !== null) return;
    
    if (activatedNames.has(id)) {
      navigate(`/organization/school/student/${id}`);
      setActivatedNames(new Set());
    } else {
      setActivatedNames(new Set([id]));
      setTimeout(() => {
        setActivatedNames(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }, 3000);
    }
  };

  // Start editing
  const startEditing = (id, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (editingId) return;
    const item = data.find(d => d.id === id);
    if (!item) return;
    
    setEditingId(id);
    
    // Initialize edit data based on type
    if (type === "student") {
      setEditData({
        fullName: item.fullName || "",
        classroom: item.classroom || "",
        grade: item.grade || "",
        gender: item.gender || "",
        nis: item.nis || "",
        iqScore: item.iqScore || 0
      });
    } else {
      setEditData({
        fullName: item.fullName || "",
        department: item.department || "",
        position: item.position || "",
        gender: item.gender || "",
        age: item.age || 0,
        yearsOfService: item.yearsOfService || 0
      });
    }
  };

  // Cancel editing
  const cancelEditing = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setEditingId(null);
    setEditData({});
  };

  // Save editing
  const saveEditing = (id) => {
    // Validation based on type
    if (type === "student") {
      if (!editData.fullName?.trim()) {
        alert('Nama tidak boleh kosong!');
        return;
      }
      if (!editData.nis?.trim()) {
        alert('NIS tidak boleh kosong!');
        return;
      }
      if (!editData.iqScore || editData.iqScore.toString().trim() === '' || parseInt(editData.iqScore) <= 0) {
        alert('Skor IQ tidak boleh kosong dan harus lebih dari 0!');
        return;
      }
    } else {
      if (!editData.fullName?.trim()) {
        alert('Nama tidak boleh kosong!');
        return;
      }
    }
    
    try {
      const processedData = { ...editData };
      
      // Process numeric fields
      if (type === "student") {
        processedData.fullName = processedData.fullName.trim();
        processedData.nis = processedData.nis.trim();
        processedData.iqScore = parseInt(processedData.iqScore) || 0;
      } else {
        processedData.fullName = processedData.fullName.trim();
        if (processedData.age) processedData.age = parseInt(processedData.age) || 0;
        if (processedData.yearsOfService) processedData.yearsOfService = parseInt(processedData.yearsOfService) || 0;
      }
      
      updateItem.mutate({ id, data: processedData });
      setEditingId(null);
    } catch (error) {
      console.error("Error saving item:", error);
    }
  };

  // Handle edit change
  const handleEditChange = (e) => {
    if (e.stopPropagation && !e.synthetic) {
      e.stopPropagation();
    }
    
    const name = e.target?.name;
    const value = e.target?.value;
    
    if (!name) return;
    
    let processedValue = value;
    
    // Process numeric fields
    if ((type === "student" && name === 'iqScore') || 
        (type === "employee" && (name === 'age' || name === 'yearsOfService'))) {
      const maxLength = name === 'iqScore' ? 3 : 2;
      processedValue = value.replace(/[^0-9]/g, '').substring(0, maxLength);
    }
    
    setEditData(prev => ({ ...prev, [name]: processedValue }));
  };

  // Helper functions
  const getScreeningStatusUI = (status) => {
    const statusMap = {
      'at_risk': { bg: 'bg-red-100', icon: 'warning', color: 'text-red-500' },
      'monitored': { bg: 'bg-yellow-100', icon: 'error', color: 'text-yellow-500' },
      'stable': { bg: 'bg-green-100', icon: 'check_circle', color: 'text-green-500' }
    };
    return statusMap[status] || statusMap.stable;
  };

  const highlightText = (text) => {
    if (!searchInput || !text) return text;
    
    const parts = text.split(new RegExp(`(${searchInput})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchInput.toLowerCase() ? 
        <span key={i} className="font-bold bg-yellow-200">{part}</span> : part
    );
  };

  const formatClassroomDisplay = (classroom, grade) => {
    if (!classroom) return "-";
    if (!grade) return classroom;
    return `${classroom} - ${grade}`;
  };

  // Check if there are changes
  const hasChanges = editingId && Object.keys(editData).some(key => {
    const original = data.find(item => item.id === editingId);
    return original && editData[key] !== original[key];
  });

  // Render cell content
  const renderCell = (item, column, isEditing) => {
    const value = item[column.key];
    
    if (isEditing) {
      if (column.compound && type === "student") {
        // Classroom-Grade compound field
        return (
          <div className="flex gap-1 justify-center" onClick={(e) => e.stopPropagation()}>
            <CustomDropdown
              name="classroom"
              value={editData.classroom}
              onChange={handleEditChange}
              options={optionsData.classrooms || []}
              className="min-w-[50px] sm:min-w-[70px]"
            />
            <div className="flex items-center text-xs">-</div>
            <CustomDropdown
              name="grade"
              value={editData.grade}
              onChange={handleEditChange}
              options={["A", "B", "C", "D"]}
              className="min-w-[35px] sm:min-w-[50px]"
            />
          </div>
        );
      } else if (column.dropdown) {
        let options = [];
        if (column.key === 'gender') {
          options = [
            { value: 'male', label: 'L' },
            { value: 'female', label: 'P' }
          ];
        } else if (column.key === 'department') {
          options = optionsData.departments || [];
        } else if (column.key === 'position') {
          options = optionsData.positions || [];
        }
        
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <CustomDropdown
              name={column.key}
              value={editData[column.key]}
              onChange={handleEditChange}
              options={options}
              className={column.key === 'gender' ? "w-[60px] sm:w-[80px] mx-auto" : "min-w-[80px] sm:min-w-[120px]"}
            />
          </div>
        );
      } else if (column.number) {
        return (
          <div className="flex items-center justify-center gap-1">
            <input
              type="text"
              name={column.key}
              value={editData[column.key]}
              onChange={handleEditChange}
              onClick={(e) => e.stopPropagation()}
              className={clsx(
                "text-xs sm:text-sm border rounded-md px-1 sm:px-2 py-1 text-center transition-[border-color,box-shadow] duration-150 focus:outline-none",
                column.key === 'iqScore' ? "w-10 sm:w-12 md:w-16" : "w-8 sm:w-12",
                (column.key === 'iqScore' && (!editData[column.key] || parseInt(editData[column.key]) <= 0))
                  ? "border-red-300 hover:border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400"
                  : "border-gray-300 hover:border-[#488BBE] focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE]"
              )}
              maxLength={column.key === 'iqScore' ? "3" : "2"}
              inputMode="numeric"
              required={column.key === 'iqScore'}
            />
            {column.suffix && <span className="text-[10px] sm:text-xs text-gray-600">{column.suffix}</span>}
          </div>
        );
      } else {
        // Regular text input
        return (
          <input
            type="text"
            name={column.key}
            value={editData[column.key]}
            onChange={handleEditChange}
            onClick={(e) => e.stopPropagation()}
            className={clsx(
              "text-xs sm:text-sm font-medium border rounded-md px-2 py-1.5 w-full transition-[border-color,box-shadow] duration-150 focus:outline-none",
              column.key === 'fullName' ? "min-w-[120px] sm:min-w-[180px]" : "max-w-[80px] sm:max-w-[100px]",
              (!editData[column.key] || !editData[column.key].toString().trim())
                ? "border-red-300 hover:border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400"
                : "border-gray-300 hover:border-[#488BBE] focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE]"
            )}
            required
          />
        );
      }
    }
    
    // Display mode
    if (column.clickable && type === "student") {
      return (
        <div 
          className={clsx(
            "text-xs sm:text-sm font-medium cursor-pointer transition-colors max-w-[120px] sm:max-w-[180px] truncate",
            activatedNames.has(item.id) 
              ? "text-[#488BBE] underline" 
              : "text-gray-900 hover:text-[#488BBE] hover:underline"
          )}
          title={value}
          onClick={(e) => handleNameClick(item.id, e)}
        >
          {column.searchable ? highlightText(value) : value}
        </div>
      );
    } else if (column.compound && type === "student") {
      return (
        <div className="text-xs sm:text-sm text-gray-600 text-center">
          {formatClassroomDisplay(item.classroom, item.grade)}
        </div>
      );
    } else if (column.status) {
      const statusUI = getScreeningStatusUI(value || 'stable');
      return (
        <span
          className={clsx(
            "inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full cursor-pointer",
            statusUI.bg
          )}
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setHoveredStatus({
              status: value || 'stable',
              x: rect.right + 10,
              y: rect.top + rect.height / 2
            });
          }}
          onMouseLeave={() => setHoveredStatus(null)}
        >
          <span className={clsx("material-icons text-xs sm:text-sm md:text-base", statusUI.color)}>
            {statusUI.icon}
          </span>
        </span>
      );
    } else if (column.boolean) {
      return (
        <span className={clsx("text-xs sm:text-sm", value ? "text-[#6DAF31]" : "text-[#EE4266]")}>
          {value ? "Sudah" : "Belum"}
        </span>
      );
    } else if (column.dropdown && column.key === 'gender') {
      return (
        <div className="text-xs sm:text-sm text-gray-600 text-center">
          {value === 'male' ? 'L' : 'P'}
        </div>
      );
    } else if (column.number) {
      return (
        <div className="text-xs sm:text-sm text-gray-600">
          {value || "-"}{column.suffix && ` ${column.suffix}`}
        </div>
      );
    } else {
      return (
        <div className={clsx(
          "text-xs sm:text-sm text-gray-600",
          column.key === 'fullName' && "font-medium text-gray-900 max-w-[120px] sm:max-w-[180px] truncate"
        )}>
          {column.searchable ? highlightText(value) : value}
        </div>
      );
    }
  };

  return (
    <div className="relative w-full">
      <CustomScrollbar contentRef={contentRef} className="mb-2" />
      
      <div ref={contentRef} className="overflow-x-auto scrollbar-hide">
        <table className="w-full" style={{ minWidth: `${config.minWidth}px` }}>
          <thead className="bg-[#E2F9FF]">
            <tr>
              {config.columns.map((column) => (
                <th 
                  key={column.key}
                  className={clsx(
                    "px-2 sm:px-4 py-3 text-[10px] sm:text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap",
                    column.key === 'fullName' ? 'text-left' : 'text-center',
                    column.sortable && 'cursor-pointer'
                  )}
                  onClick={column.sortable ? () => requestSort(column.key) : undefined}
                >
                  <div className={clsx(
                    "flex items-center gap-1",
                    column.key === 'fullName' ? 'justify-start' : 'justify-center'
                  )}>
                    <span className={column.mobileLabel ? "hidden sm:inline" : ""}>
                      {column.label}
                    </span>
                    {column.mobileLabel && (
                      <span className="sm:hidden">{column.mobileLabel}</span>
                    )}
                    
                    {column.sortable && (
                      <span className="material-icons text-xs sm:text-sm hover:text-[#3399e9]">
                        {getSortIcon(column.key)}
                      </span>
                    )}
                    
                    {column.hasHelp && (
                      <>
                        <span 
                          className="material-icons text-xs sm:text-sm ml-1 text-gray-400 cursor-help opacity-70 hover:opacity-100 transition-opacity" 
                          ref={helpIconRef}
                          onMouseEnter={() => setShowHelpTooltip(true)}
                          onMouseLeave={() => setShowHelpTooltip(false)}
                        >
                          help_outline
                        </span>
                        <HelpTooltip 
                          helpIconRef={helpIconRef}
                          showHelpTooltip={showHelpTooltip}
                        />
                      </>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-2 sm:px-4 py-3 text-center whitespace-nowrap w-16 sm:w-20"></th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((item, index) => {
                const isLastElement = index === data.length - 1;
                const isEditing = editingId === item.id;
                
                return (
                  <React.Fragment key={item.id}>
                    <tr 
                      className="bg-white hover:bg-gray-50 transition-colors"
                      ref={isLastElement ? lastItemElementRef : null}
                    >
                      {config.columns.map((column) => (
                        <td 
                          key={column.key}
                          className={clsx(
                            "px-2 sm:px-4 py-3 whitespace-nowrap",
                            column.key === 'fullName' ? 'text-left' : 'text-center'
                          )}
                        >
                          {renderCell(item, column, isEditing)}
                        </td>
                      ))}
                      
                      {/* Action column */}
                      <td className="px-2 sm:px-4 py-3 text-center whitespace-nowrap">
                        {isEditing ? (
                          <div 
                            className="flex space-x-1 justify-center" 
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button 
                              className="text-[#EE4266] hover:text-red-700 transition-colors" 
                              onClick={(e) => cancelEditing(e)}
                              aria-label="Cancel"
                            >
                              <span className="material-icons text-base sm:text-lg">cancel</span>
                            </button>
                            <button
                              type="button"
                              className={clsx(
                                "text-[#87C054] hover:text-[#6DAF31] transition-colors",
                                (!hasChanges || updateItem.isPending) && "opacity-50 cursor-not-allowed"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (hasChanges) {
                                  saveEditing(item.id);
                                }
                              }}
                              disabled={!hasChanges || updateItem.isPending}
                              aria-label="Save"
                            >
                              <span className="material-icons text-base sm:text-lg">
                                {updateItem.isPending ? "hourglass_empty" : "check_circle"}
                              </span>
                            </button>
                          </div>
                        ) : (
                          <button
                            className="text-gray-400 hover:text-[#488BBE] transition-colors relative"
                            onClick={(e) => startEditing(item.id, e)}
                            disabled={editingId !== null}
                            onMouseEnter={() => setShowEditTooltip(item.id)}
                            onMouseLeave={() => setShowEditTooltip(null)}
                            aria-label="Edit item"
                          >
                            <span className="material-icons text-base sm:text-lg">edit</span>
                            {showEditTooltip === item.id && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[#00000080] text-white text-xs rounded whitespace-nowrap shadow-lg">
                                Edit
                              </div>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                    
                    {/* Row divider */}
                    {!isLastElement && (
                      <tr style={{ height: '1px' }}>
                        <td colSpan={config.columns.length + 1} className="p-0">
                          <div 
                            style={{
                              height: '1px',
                              backgroundImage: 'linear-gradient(to right, #FFFFFF, #488BBE40, #FFFFFF)'
                            }}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={config.columns.length + 1} className="text-center py-6 sm:py-8">
                  <span className="material-icons text-gray-400 text-3xl sm:text-4xl md:text-5xl">{config.emptyIcon}</span>
                  <p className="text-gray-500 mt-2 text-xs sm:text-sm md:text-base">{config.emptyText}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Status tooltip */}
      <AnimatePresence>
        {hoveredStatus && (
          <motion.div
            className="fixed bg-[#00000080] text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50 shadow-lg"
            style={{ 
              left: hoveredStatus.x,
              top: hoveredStatus.y - 10
            }}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
          >
            {hoveredStatus.status === 'at_risk' ? 'Berisiko' : 
             hoveredStatus.status === 'monitored' ? 'Pengawasan' : 'Stabil'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading indicator */}
      {isFetchingNextPage && (
        <div className="py-4 text-center">
          <span className="material-icons animate-spin text-[#488BBE]">refresh</span>
          <span className="text-[#488BBE] text-xs sm:text-sm ml-2">Loading...</span>
        </div>
      )}
    </div>
  );
};

export default SharedTable;