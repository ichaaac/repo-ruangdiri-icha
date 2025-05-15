// src/components/organization/company/list/EmployeeTable.jsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Transition } from '@headlessui/react';
import clsx from 'clsx';

// Custom Dropdown Component
const CustomDropdown = ({ name, value, onChange, options, className = "", disabled = false }) => {
  const currentOption = options.find(opt => (opt.value !== undefined ? opt.value : opt) === value);
  const displayValue = currentOption?.label || currentOption || value;

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } });
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        disabled={disabled}
        className={clsx(
          "w-full text-left px-3 py-1.5 text-sm border rounded-md transition-all",
          "flex items-center justify-between gap-2",
          disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
            : "bg-white hover:border-[#488BBE] border-gray-300 focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE]",
          className
        )}
      >
        <span className="truncate">{displayValue}</span>
        <span className="material-icons text-gray-400 text-sm">expand_more</span>
      </Menu.Button>

      <Transition
        as={React.Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
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
                    onClick={() => handleSelect(optionValue)}
                    className={clsx(
                      "w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between",
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
    <div className={clsx("relative w-full h-3 px-4 mb-2", className)}>
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

const EmployeeTable = ({ 
  employees, 
  searchInput,
  getSortIcon,
  requestSort,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  updateEmployee,
  departmentOptions,
  positionOptions
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const [hoveredStatus, setHoveredStatus] = useState(null);
  const [showEditTooltip, setShowEditTooltip] = useState(null);
  const helpIconRef = useRef(null);
  const observerRef = useRef(null);
  const contentRef = useRef(null);

  // Infinite scroll observer
  const lastEmployeeElementRef = useCallback(node => {
    if (observerRef.current) observerRef.current.disconnect();
    if (isFetchingNextPage || !hasNextPage) return;
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
    }, { threshold: 0.1, rootMargin: '0px 0px 100px 0px' });
    
    if (node) observerRef.current.observe(node);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  // Start editing
  const startEditing = (id) => {
    if (editingId) return;
    const employee = employees.find(emp => emp.id === id);
    if (!employee) return;
    
    setEditingId(id);
    setEditData({
      fullName: employee.fullName || "",
      department: employee.department || "",
      position: employee.position || "",
      gender: employee.gender || "",
      age: employee.age || 0,
      yearsOfService: employee.yearsOfService || 0
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditData({});
  };

  // Save editing
  const saveEditing = (id) => {
    if (!editData.fullName?.trim()) return;
    
    const changedFields = {};
    const original = employees.find(emp => emp.id === id);
    
    if (!original) return;
    
    Object.keys(editData).forEach(key => {
      if (editData[key] !== original[key]) {
        changedFields[key] = editData[key];
      }
    });
    
    if (!Object.keys(changedFields).length) return;
    
    if (changedFields.age !== undefined) {
      changedFields.age = parseInt(changedFields.age) || 0;
    }
    
    if (changedFields.yearsOfService !== undefined) {
      changedFields.yearsOfService = parseInt(changedFields.yearsOfService) || 0;
    }
    
    updateEmployee.mutate(
      { id, data: changedFields },
      { onSuccess: cancelEditing }
    );
  };

  // Handle edit change
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    if (name === 'age' || name === 'yearsOfService') {
      processedValue = value.replace(/[^0-9]/g, '').substring(0, 2);
    }
    
    setEditData(prev => ({ ...prev, [name]: processedValue }));
  };

  // Helper functions
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

  const hasChanges = editingId && editData.fullName?.trim() && 
    Object.keys(editData).some(key => {
      const original = employees.find(emp => emp.id === editingId);
      return original && editData[key] !== original[key];
    });

  return (
    <div className="relative">
      <CustomScrollbar contentRef={contentRef} className="mb-2" />
      
      <div ref={contentRef} className="overflow-x-auto scrollbar-hide">
        <table className="w-full" style={{ minWidth: '1200px' }}>
          <thead className="bg-[#E2F9FF]">
            <tr>
              <th 
                className="px-4 py-3 text-left text-xs font-bold text-[#488BBE] uppercase tracking-wider cursor-pointer whitespace-nowrap"
                onClick={() => requestSort("fullName")}
              >
                <div className="flex items-center gap-1">
                  NAMA
                  <span className="material-icons text-sm">{getSortIcon("fullName")}</span>
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">DEPARTEMEN</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">JABATAN</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">JENIS KELAMIN</th>
              <th 
                className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider cursor-pointer whitespace-nowrap"
                onClick={() => requestSort("age")}
              >
                <div className="flex items-center justify-center gap-1">
                  USIA
                  <span className="material-icons text-sm">{getSortIcon("age")}</span>
                </div>
              </th>
              <th 
                className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider cursor-pointer whitespace-nowrap"
                onClick={() => requestSort("yearsOfService")}
              >
                <div className="flex items-center justify-center gap-1">
                  LAMA BEKERJA
                  <span className="material-icons text-sm">{getSortIcon("yearsOfService")}</span>
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center justify-center">
                  SKRINING
                  <span 
                    className="material-icons text-sm ml-1 text-gray-400 cursor-help" 
                    ref={helpIconRef}
                    onMouseEnter={() => setShowHelpTooltip(true)}
                    onMouseLeave={() => setShowHelpTooltip(false)}
                  >
                    help_outline
                  </span>
                  <AnimatePresence>
                    {showHelpTooltip && (
                      <motion.div 
                        className="fixed bg-[#00000099] text-white text-xs rounded-md p-2.5 shadow-lg z-[1000]"
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
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">KONSELING</th>
              <th className="px-4 py-3 text-center whitespace-nowrap"></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee, index) => {
              const statusUI = getScreeningStatusUI(employee.screeningStatus || 'stable');
              const isLastElement = index === employees.length - 1;
              const isEditing = editingId === employee.id;
              
              return (
                <React.Fragment key={employee.id}>
                  <tr 
                    className="bg-white hover:bg-gray-50 transition-colors"
                    ref={isLastElement ? lastEmployeeElementRef : null}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          name="fullName"
                          value={editData.fullName}
                          onChange={handleEditChange}
                          className="text-sm font-medium text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 w-full min-w-[200px] hover:border-[#488BBE] focus:outline-none focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE] transition-all"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900" title={employee.fullName}>
                          {highlightText(employee.fullName)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isEditing ? (
                        <CustomDropdown
                          name="department"
                          value={editData.department}
                          onChange={handleEditChange}
                          options={departmentOptions}
                          className="min-w-[150px]"
                        />
                      ) : (
                        <div className="text-sm text-gray-600">{employee.department}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isEditing ? (
                        <CustomDropdown
                          name="position"
                          value={editData.position}
                          onChange={handleEditChange}
                          options={positionOptions}
                          className="min-w-[120px]"
                        />
                      ) : (
                        <div className="text-sm text-gray-600">{employee.position}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isEditing ? (
                        <CustomDropdown
                          name="gender"
                          value={editData.gender}
                          onChange={handleEditChange}
                          options={[
                            { value: 'male', label: 'L' },
                            { value: 'female', label: 'P' }
                          ]}
                          className="w-16"
                        />
                      ) : (
                        <div className="text-sm text-gray-600">
                          {employee.gender === 'male' ? 'L' : 'P'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="text"
                            name="age"
                            value={editData.age}
                            onChange={handleEditChange}
                            className="text-sm text-gray-600 border border-gray-300 rounded-md px-2 py-1 w-12 text-center hover:border-[#488BBE] focus:outline-none focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE] transition-all"
                            maxLength="2"
                            inputMode="numeric"
                          />
                          <span className="text-sm text-gray-600">Tahun</span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          {employee.age} Tahun
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="text"
                            name="yearsOfService"
                            value={editData.yearsOfService}
                            onChange={handleEditChange}
                            className="text-sm text-gray-600 border border-gray-300 rounded-md px-2 py-1 w-12 text-center hover:border-[#488BBE] focus:outline-none focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE] transition-all"
                            maxLength="2"
                            inputMode="numeric"
                          />
                          <span className="text-sm text-gray-600">Tahun</span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          {employee.yearsOfService} Tahun
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span
                        className={clsx(
                          "inline-flex items-center justify-center w-8 h-8 rounded-full cursor-pointer",
                          statusUI.bg
                        )}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredStatus({
                            status: employee.screeningStatus || 'stable',
                            x: rect.right + 10,
                            y: rect.top + rect.height / 2
                          });
                        }}
                        onMouseLeave={() => setHoveredStatus(null)}
                      >
                        <span className={clsx("material-icons", statusUI.color)}>{statusUI.icon}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className={clsx("text-sm", employee.counselingStatus ? "text-[#6DAF31]" : "text-[#EE4266]")}>
                        {employee.counselingStatus ? "Sudah" : "Belum"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center relative whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex space-x-2 justify-center">
                          <button
                            className={clsx(
                              "text-[#87C054] hover:text-[#6DAF31] transition-colors",
                              (!hasChanges || updateEmployee.isPending) && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={() => hasChanges && saveEditing(employee.id)}
                            disabled={!hasChanges || updateEmployee.isPending}
                          >
                            <span className="material-icons">check_circle</span>
                          </button>
                          <button 
                            className="text-[#EE4266] hover:text-red-700 transition-colors" 
                            onClick={cancelEditing}
                          >
                            <span className="material-icons">cancel</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          className="text-gray-400 hover:text-[#488BBE] transition-colors relative"
                          onClick={() => startEditing(employee.id)}
                          disabled={editingId !== null}
                          onMouseEnter={() => setShowEditTooltip(employee.id)}
                          onMouseLeave={() => setShowEditTooltip(null)}
                        >
                          <span className="material-icons">edit</span>
                          {showEditTooltip === employee.id && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap shadow-lg">
                              Edit
                            </div>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                  {!isLastElement && (
                    <tr>
                      <td colSpan={9} className="p-0">
                        <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {hoveredStatus && (
          <motion.div
            className="fixed bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50 shadow-lg"
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

      {employees.length === 0 && !isFetchingNextPage && (
        <div className="text-center py-8">
          <span className="material-icons text-gray-400 text-5xl">business_center</span>
          <p className="text-gray-500 mt-2">Tidak ada data karyawan.</p>
        </div>
      )}
    </div>
  );
};

export default EmployeeTable;