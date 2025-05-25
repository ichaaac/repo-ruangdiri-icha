// src/components/shared/organization/OrganizationTable.jsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Transition } from '@headlessui/react';
import clsx from 'clsx';

// Shared Custom Dropdown Component
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
          "w-full text-left px-3 py-1.5 text-sm border rounded-md",
          "flex items-center justify-between gap-2",
          "transition-[border-color,box-shadow] duration-150 ease-in-out",
          disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
            : "bg-white hover:border-[#488BBE] border-gray-300 focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE]",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="truncate">{displayValue}</span>
        <span className="material-icons text-gray-400 text-sm">expand_more</span>
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
          className="absolute z-50 mt-2 w-full bg-white rounded-md shadow-lg border border-gray-200 py-1 max-h-60 overflow-y-auto"
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
                      "w-full text-left px-3 py-2 text-sm flex items-center justify-between",
                      active && "bg-[#E2F9FF]",
                      isSelected && "bg-[#E2F9FF] text-[#488BBE] font-medium"
                    )}
                  >
                    <span>{optionLabel}</span>
                    {isSelected && (
                      <span className="material-icons text-[#488BBE] text-sm">check</span>
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

// Custom Scrollbar Component
const CustomScrollbar = ({ contentRef, className = "" }) => {
  const scrollbarRef = useRef(null);
  const thumbRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scrollRatio, setScrollRatio] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const updateScrollbar = useCallback(() => {
    if (!contentRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = contentRef.current;
    const maxScroll = scrollWidth - clientWidth;
    
    setIsVisible(maxScroll > 0);
    if (maxScroll > 0) setScrollRatio(scrollLeft / maxScroll);
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
    <div className={clsx("relative w-full h-3 px-2 md:px-4 mb-2", className)}>
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
            width: '20%',
            left: `${scrollRatio * 80}%`,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          onMouseDown={handleMouseDown}
        />
      </div>
    </div>
  );
};

const OrganizationTable = ({ 
  organizationType = "school",
  data = [],
  searchInput,
  getSortIcon,
  requestSort,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  updateItem,
  primaryOptions = [], // classroom/department options
  secondaryOptions = [], // grade/position options
  isLoading,
  resetEditMode,
  filtersChanged
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const [hoveredStatus, setHoveredStatus] = useState(null);
  const [showEditTooltip, setShowEditTooltip] = useState(null);
  const helpIconRef = useRef(null);
  const observerRef = useRef(null);
  const contentRef = useRef(null);

  // Organization-specific configurations
  const config = {
    school: {
      itemName: "student",
      columns: {
        name: "NAMA",
        primary: "KELAS",
        secondary: "", // Grade is combined with classroom
        tertiary: "JENIS KELAMIN",
        identifier: "NIS",
        numeric: "SKOR IQ",
        status1: "SKRINING",
        status2: "KONSELING"
      },
      fields: {
        name: "fullName",
        primary: "classroom",
        secondary: "grade",
        tertiary: "gender",
        identifier: "nis",
        numeric: "iqScore"
      }
    },
    company: {
      itemName: "employee",
      columns: {
        name: "NAMA",
        primary: "DEPARTEMEN",
        secondary: "JABATAN",
        tertiary: "JENIS KELAMIN",
        identifier: "USIA",
        numeric: "LAMA BEKERJA",
        status1: "SKRINING",
        status2: "KONSELING"
      },
      fields: {
        name: "fullName",
        primary: "department",
        secondary: "position",
        tertiary: "gender",
        identifier: "age",
        numeric: "yearsOfService"
      }
    }
  };

  const currentConfig = config[organizationType];

  // Reset editing mode when filters change
  useEffect(() => {
    if (filtersChanged) {
      cancelEditing();
    }
  }, [filtersChanged]);

  // Expose reset method to parent
  useEffect(() => {
    if (resetEditMode) {
      resetEditMode.current = cancelEditing;
    }
  }, [resetEditMode]);

  // Infinite scroll observer
  const lastElementRef = useCallback(node => {
    if (observerRef.current) observerRef.current.disconnect();
    if (isFetchingNextPage || !hasNextPage) return;
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
    }, { threshold: 0.1, rootMargin: '0px 0px 100px 0px' });
    
    if (node) observerRef.current.observe(node);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  const startEditing = (id, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (editingId) return;
    const item = data.find(d => d.id === id);
    if (!item) return;
    
    setEditingId(id);
    setEditData({
      [currentConfig.fields.name]: item[currentConfig.fields.name] || "",
      [currentConfig.fields.primary]: item[currentConfig.fields.primary] || "",
      [currentConfig.fields.secondary]: item[currentConfig.fields.secondary] || "",
      [currentConfig.fields.tertiary]: item[currentConfig.fields.tertiary] || "",
      [currentConfig.fields.identifier]: item[currentConfig.fields.identifier] || "",
      [currentConfig.fields.numeric]: item[currentConfig.fields.numeric] || 0
    });
  };

  const cancelEditing = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setEditingId(null);
    setEditData({});
  };

  const saveEditing = (id) => {
    if (!editData[currentConfig.fields.name]?.trim()) {
      alert(`${currentConfig.columns.name} tidak boleh kosong!`);
      return;
    }
    
    // Organization-specific validation
    if (organizationType === "school") {
      if (!editData.nis?.trim()) {
        alert('NIS tidak boleh kosong!');
        return;
      }
      if (!editData.iqScore || parseInt(editData.iqScore) <= 0) {
        alert('Skor IQ tidak boleh kosong dan harus lebih dari 0!');
        return;
      }
    }
    
    const changedFields = {};
    const original = data.find(d => d.id === id);
    
    Object.keys(editData).forEach(key => {
      if (editData[key] !== original[key]) {
        changedFields[key] = editData[key];
      }
    });
    
    if (!Object.keys(changedFields).length) return;
    
    // Convert numeric fields
    if (changedFields[currentConfig.fields.numeric] !== undefined) {
      changedFields[currentConfig.fields.numeric] = parseInt(changedFields[currentConfig.fields.numeric]) || 0;
    }
    if (organizationType === "company" && changedFields.age !== undefined) {
      changedFields.age = parseInt(changedFields.age) || 0;
    }
    
    updateItem.mutate({ id, data: changedFields });
    setEditingId(null);
  };

  const handleEditChange = (e) => {
    if (e.stopPropagation && !e.synthetic) {
      e.stopPropagation();
    }
    
    const name = e.target?.name;
    const value = e.target?.value;
    
    if (!name) return;
    
    let processedValue = value;
    
    // Handle numeric inputs
    if (name === currentConfig.fields.numeric || (organizationType === "company" && name === "age")) {
      processedValue = value.replace(/[^0-9]/g, '').substring(0, organizationType === "school" ? 3 : 2);
    }
    
    setEditData(prev => ({ ...prev, [name]: processedValue }));
  };

  const getScreeningStatusUI = (status) => {
    const statusMap = {
      'at_risk': { bg: 'bg-red-100', icon: 'warning', color: 'text-red-500', text: 'Berisiko' },
      'monitored': { bg: 'bg-yellow-100', icon: 'error', color: 'text-yellow-500', text: 'Pengawasan' },
      'stable': { bg: 'bg-green-100', icon: 'check_circle', color: 'text-green-500', text: 'Stabil' }
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

  const hasChanges = editingId && editData[currentConfig.fields.name]?.trim() && 
    Object.keys(editData).some(key => {
      const original = data.find(d => d.id === editingId);
      return original && editData[key] !== original[key];
    });

  return (
    <div className="relative w-full">
      <CustomScrollbar contentRef={contentRef} className="mb-2" />
      
      <div ref={contentRef} className="overflow-x-auto scrollbar-hide">
        <table className="w-full" style={{ minWidth: organizationType === "school" ? '1000px' : '1200px' }}>
          <thead className="bg-[#E2F9FF]">
            <tr>
              {/* Name Column */}
              <th className="px-2 md:px-4 py-3 text-left text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center gap-1">
                  {currentConfig.columns.name}
                  <span 
                    className="material-icons text-sm cursor-pointer hover:text-[#3399e9]"
                    onClick={() => requestSort(currentConfig.fields.name)}
                  >
                    {getSortIcon(currentConfig.fields.name)}
                  </span>
                </div>
              </th>
              
              {/* Primary Column (Classroom/Department) */}
              <th className="px-2 md:px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">
                {currentConfig.columns.primary}
              </th>
              
              {/* Secondary Column (Position for company only) */}
              {organizationType === "company" && (
                <th className="px-2 md:px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">
                  {currentConfig.columns.secondary}
                </th>
              )}
              
              {/* Gender Column */}
              <th className="px-2 md:px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">
                {currentConfig.columns.tertiary}
              </th>
              
              {/* Identifier Column (NIS/Age) */}
              <th className="px-2 md:px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center justify-center gap-1">
                  {currentConfig.columns.identifier}
                  {organizationType === "school" && (
                    <span 
                      className="material-icons text-sm cursor-pointer hover:text-[#3399e9]"
                      onClick={() => requestSort(currentConfig.fields.identifier)}
                    >
                      {getSortIcon(currentConfig.fields.identifier)}
                    </span>
                  )}
                  {organizationType === "company" && (
                    <span 
                      className="material-icons text-sm cursor-pointer hover:text-[#3399e9]"
                      onClick={() => requestSort("age")}
                    >
                      {getSortIcon("age")}
                    </span>
                  )}
                </div>
              </th>
              
              {/* Years of Service (Company only) */}
              {organizationType === "company" && (
                <th 
                  className="px-2 md:px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider cursor-pointer whitespace-nowrap"
                  onClick={() => requestSort("yearsOfService")}
                >
                  <div className="flex items-center justify-center gap-1">
                    {currentConfig.columns.numeric}
                    <span className="material-icons text-sm">{getSortIcon("yearsOfService")}</span>
                  </div>
                </th>
              )}
              
              {/* Screening Status */}
              <th className="px-2 md:px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center justify-center">
                  {currentConfig.columns.status1}
                  <span 
                    className="material-icons text-sm ml-1 text-gray-400 cursor-help opacity-70 hover:opacity-100 transition-opacity" 
                    ref={helpIconRef}
                    onMouseEnter={() => setShowHelpTooltip(true)}
                    onMouseLeave={() => setShowHelpTooltip(false)}
                  >
                    help_outline
                  </span>
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
                </div>
              </th>
              
              {/* Counseling Status */}
              <th className="px-2 md:px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">
                {currentConfig.columns.status2}
              </th>
              
              {/* IQ Score (School only) */}
              {organizationType === "school" && (
                <th className="px-2 md:px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    {currentConfig.columns.numeric}
                    <span 
                      className="material-icons text-sm cursor-pointer hover:text-[#3399e9]"
                      onClick={() => requestSort(currentConfig.fields.numeric)}
                    >
                      {getSortIcon(currentConfig.fields.numeric)}
                    </span>
                  </div>
                </th>
              )}
              
              {/* Actions */}
              <th className="px-2 md:px-4 py-3 text-center whitespace-nowrap w-20"></th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((item, index) => {
                const statusUI = getScreeningStatusUI(item.screeningStatus || 'stable');
                const isLastElement = index === data.length - 1;
                const isEditing = editingId === item.id;
                
                return (
                  <React.Fragment key={item.id}>
                    <tr 
                      className={clsx(
                        "bg-white hover:bg-gray-50 transition-colors",
                        isEditing ? "cursor-default" : "cursor-default"
                      )}
                      ref={isLastElement ? lastElementRef : null}
                    >
                      {/* Name */}
                      <td className="px-2 md:px-4 py-3 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            name={currentConfig.fields.name}
                            value={editData[currentConfig.fields.name]}
                            onChange={handleEditChange}
                            onClick={(e) => e.stopPropagation()}
                            className={clsx(
                              "text-sm font-medium border rounded-md px-3 py-1.5 w-full min-w-[150px] md:min-w-[200px] transition-[border-color,box-shadow] duration-150 focus:outline-none",
                              editData[currentConfig.fields.name]?.trim() 
                                ? "text-gray-900 border-gray-300 hover:border-[#488BBE] focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE]" 
                                : "text-gray-900 border-red-300 hover:border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400"
                            )}
                            required
                          />
                        ) : (
                          <div className="text-sm font-medium text-gray-900" title={item[currentConfig.fields.name]}>
                            {highlightText(item[currentConfig.fields.name])}
                          </div>
                        )}
                      </td>
                      
                      {/* Primary Field (Classroom/Department) */}
                      <td className="px-2 md:px-4 py-3 whitespace-nowrap text-center">
                        {isEditing ? (
                          organizationType === "school" ? (
                            <div className="flex gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                              <CustomDropdown
                                name="classroom"
                                value={editData.classroom}
                                onChange={handleEditChange}
                                options={primaryOptions || [item.classroom]}
                                className="min-w-[60px] md:min-w-[80px]"
                              />
                              <div className="flex items-center">-</div>
                              <CustomDropdown
                                name="grade"
                                value={editData.grade}
                                onChange={handleEditChange}
                                options={["A", "B", "C", "D"]}
                                className="min-w-[50px] md:min-w-[60px]"
                              />
                            </div>
                          ) : (
                            <div onClick={(e) => e.stopPropagation()}>
                              <CustomDropdown
                                name="department"
                                value={editData.department}
                                onChange={handleEditChange}
                                options={primaryOptions}
                                className="min-w-[120px] md:min-w-[150px]"
                              />
                            </div>
                          )
                        ) : (
                          <div className="text-sm text-gray-600 text-center">
                            {organizationType === "school" 
                              ? formatClassroomDisplay(item.classroom, item.grade)
                              : item.department
                            }
                          </div>
                        )}
                      </td>
                      
                      {/* Secondary Field (Position - Company only) */}
                      {organizationType === "company" && (
                        <td className="px-2 md:px-4 py-3 whitespace-nowrap text-center">
                          {isEditing ? (
                            <div onClick={(e) => e.stopPropagation()}>
                              <CustomDropdown
                                name="position"
                                value={editData.position}
                                onChange={handleEditChange}
                                options={secondaryOptions}
                                className="min-w-[100px] md:min-w-[120px]"
                              />
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600">{item.position}</div>
                          )}
                        </td>
                      )}
                      
                      {/* Gender */}
                      <td className="px-2 md:px-4 py-3 whitespace-nowrap text-center">
                        {isEditing ? (
                          <div onClick={(e) => e.stopPropagation()}>
                            <CustomDropdown
                              name={currentConfig.fields.tertiary}
                              value={editData[currentConfig.fields.tertiary]}
                              onChange={handleEditChange}
                              options={[
                                { value: 'male', label: 'L' },
                                { value: 'female', label: 'P' }
                              ]}
                              className={organizationType === "school" ? "w-[80px] md:w-[110px] mx-auto" : "w-12 md:w-16"}
                            />
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600 text-center">
                            {item[currentConfig.fields.tertiary] === 'male' ? 'L' : 'P'}
                          </div>
                        )}
                      </td>
                      
                      {/* Identifier (NIS/Age) */}
                      <td className="px-2 md:px-4 py-3 text-center whitespace-nowrap">
                        {isEditing ? (
                          organizationType === "school" ? (
                            <input
                              type="text"
                              name="nis"
                              value={editData.nis}
                              onChange={handleEditChange}
                              onClick={(e) => e.stopPropagation()}
                              className={clsx(
                                "text-sm border rounded-md px-3 py-1.5 w-full transition-[border-color,box-shadow] duration-150 focus:outline-none",
                                editData.nis?.trim()
                                  ? "text-gray-600 border-gray-300 hover:border-[#488BBE] focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE]"
                                  : "text-gray-600 border-red-300 hover:border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400"
                              )}
                              required
                            />
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="text"
                                name="age"
                                value={editData.age}
                                onChange={handleEditChange}
                                className="text-sm text-gray-600 border border-gray-300 rounded-md px-2 py-1 w-12 text-center hover:border-[#488BBE] focus:outline-none focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE] transition-[border-color,box-shadow] duration-150"
                                maxLength="2"
                                inputMode="numeric"
                              />
                              <span className="text-sm text-gray-600 hidden md:inline">Tahun</span>
                            </div>
                          )
                        ) : (
                          <div className="text-sm text-gray-600">
                            {organizationType === "school" 
                              ? highlightText(item.nis)
                              : <span>{item.age} <span className="hidden md:inline">Tahun</span></span>
                            }
                          </div>
                        )}
                      </td>
                      
                      {/* Years of Service (Company only) */}
                      {organizationType === "company" && (
                        <td className="px-2 md:px-4 py-3 text-center whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="text"
                                name="yearsOfService"
                                value={editData.yearsOfService}
                                onChange={handleEditChange}
                                className="text-sm text-gray-600 border border-gray-300 rounded-md px-2 py-1 w-12 text-center hover:border-[#488BBE] focus:outline-none focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE] transition-[border-color,box-shadow] duration-150"
                                maxLength="2"
                                inputMode="numeric"
                              />
                              <span className="text-sm text-gray-600 hidden md:inline">Tahun</span>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600">
                              {item.yearsOfService} <span className="hidden md:inline">Tahun</span>
                            </div>
                          )}
                        </td>
                      )}
                      
                      {/* Screening Status */}
                      <td className="px-2 md:px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={clsx(
                            "inline-flex items-center justify-center w-8 h-8 rounded-full cursor-pointer",
                            statusUI.bg
                          )}
                          onClick={(e) => e.stopPropagation()}
                          onMouseEnter={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredStatus({
                              status: item.screeningStatus || 'stable',
                              x: rect.right + 10,
                              y: rect.top + rect.height / 2
                            });
                          }}
                          onMouseLeave={() => setHoveredStatus(null)}
                        >
                          <span className={clsx("material-icons", statusUI.color)}>{statusUI.icon}</span>
                        </span>
                      </td>
                      
                      {/* Counseling Status */}
                      <td className="px-2 md:px-4 py-3 text-center whitespace-nowrap">
                        <span className={clsx(
                          "text-sm", 
                          item.counselingStatus ? "text-[#6DAF31]" : "text-[#EE4266]"
                        )}>
                          {item.counselingStatus ? "Sudah" : "Belum"}
                        </span>
                      </td>
                      
                      {/* IQ Score (School only) */}
                      {organizationType === "school" && (
                        <td className="px-2 md:px-4 py-3 text-center whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="text"
                              name="iqScore"
                              value={editData.iqScore}
                              onChange={handleEditChange}
                              onClick={(e) => e.stopPropagation()}
                              className={clsx(
                                "text-sm border rounded-md px-2 py-1 w-16 text-center transition-[border-color,box-shadow] duration-150 focus:outline-none",
                                (editData.iqScore && parseInt(editData.iqScore) > 0)
                                  ? "text-gray-600 border-gray-300 hover:border-[#488BBE] focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE]"
                                  : "text-gray-600 border-red-300 hover:border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400"
                              )}
                              maxLength="3"
                              inputMode="numeric"
                              required
                            />
                          ) : (
                            <div className="text-sm text-gray-600">
                              {item.iqScore || "-"}
                            </div>
                          )}
                        </td>
                      )}
                      
                      {/* Actions */}
                      <td className="px-2 md:px-4 py-3 text-center whitespace-nowrap">
                        {isEditing ? (
                          <div 
                            className="flex space-x-1 md:space-x-2 justify-center" 
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button 
                              className="text-[#EE4266] hover:text-red-700 transition-colors" 
                              onClick={(e) => cancelEditing(e)}
                              aria-label="Cancel"
                            >
                              <span className="material-icons text-sm md:text-base">cancel</span>
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
                              <span className="material-icons text-sm md:text-base">
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
                            aria-label={`Edit ${currentConfig.itemName}`}
                          >
                            <span className="material-icons text-sm md:text-base">edit</span>
                            {showEditTooltip === item.id && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[#00000080] text-white text-xs rounded whitespace-nowrap shadow-lg">
                                Edit
                              </div>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                    {!isLastElement && (
                      <tr style={{ height: '1px' }}>
                        <td colSpan={organizationType === "school" ? 8 : 9} className="p-0">
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
                <td colSpan={organizationType === "school" ? 8 : 9} className="text-center py-8">
                  <span className="material-icons text-gray-400 text-5xl">
                    {organizationType === "school" ? "school" : "business_center"}
                  </span>
                  <p className="text-gray-500 mt-2">
                    Tidak ada data {organizationType === "school" ? "siswa" : "karyawan"}.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
            {getScreeningStatusUI(hoveredStatus.status).text}
          </motion.div>
        )}
      </AnimatePresence>

      {isFetchingNextPage && (
        <div className="py-4 text-center">
          <span className="material-icons animate-spin text-[#488BBE]">refresh</span>
          <span className="text-[#488BBE] text-sm ml-2">Loading...</span>
        </div>
      )}
    </div>
  );
};

export default OrganizationTable;