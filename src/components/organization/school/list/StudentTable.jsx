// src/components/organization/school/list/StudentTable.jsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Transition } from '@headlessui/react';
import { useNavigate } from "react-router-dom";
import clsx from 'clsx';

// Custom Dropdown Component with smooth animation
const CustomDropdown = ({ name, value, onChange, options, className = "", disabled = false }) => {
  const currentOption = options.find(opt => (opt.value !== undefined ? opt.value : opt) === value);
  const displayValue = currentOption?.label || currentOption || value;

  const handleSelect = (optionValue) => {
    // Create a custom object instead of trying to simulate a DOM event
    onChange({ 
      target: { name, value: optionValue },
      // Skip the e.stopPropagation() call in the parent
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
                      "w-full text-left px-3 py-2 text-sm flex items-center justify-between",
                      "transition-colors duration-100",
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

const StudentTable = ({ 
  students, 
  searchInput,
  getSortIcon,
  requestSort,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  updateStudent,
  classroomOptions,
  isLoading
}) => {
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const [hoveredStatus, setHoveredStatus] = useState(null);
  const [showEditTooltip, setShowEditTooltip] = useState(null);
  const helpIconRef = useRef(null);
  const observerRef = useRef(null);
  const contentRef = useRef(null);

  // Function to navigate to student detail
  const handleViewStudentDetail = (id) => {
    if (editingId !== null) return; // Don't navigate while editing
    navigate(`/organization/school/student/${id}`);
  };

  // Infinite scroll observer
  const lastStudentElementRef = useCallback(node => {
    if (observerRef.current) observerRef.current.disconnect();
    if (isFetchingNextPage || !hasNextPage) return;
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
    }, { threshold: 0.1, rootMargin: '0px 0px 100px 0px' });
    
    if (node) observerRef.current.observe(node);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  // Start editing
  const startEditing = (id, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (editingId) return;
    const student = students.find(s => s.id === id);
    if (!student) return;
    
    setEditingId(id);
    setEditData({
      fullName: student.fullName || "",
      classroom: student.classroom || "",
      gender: student.gender || "",
      nis: student.nis || "",
      iqScore: student.iqScore || 0
    });
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

  const saveEditing = (id) => {
    if (!editData.fullName?.trim()) return;
    
    try {
      // API expects a flat structure with only the fields to update
      const data = {
        fullName: editData.fullName,
        classroom: editData.classroom,
        gender: editData.gender,
        nis: editData.nis,
        iqScore: parseInt(editData.iqScore) || 0
      };
      
      console.log("Saving student data:", data, "for ID:", id);
      
      // Call the updateStudent mutation
      updateStudent.mutate({ 
        id, 
        data 
      });
      
      // Reset editing state
      setEditingId(null);
    } catch (error) {
      console.error("Error saving student:", error);
    }
  };
  // Handle edit change
  const handleEditChange = (e) => {
    // Handle both custom dropdown and regular events
    if (e.stopPropagation && !e.synthetic) {
      e.stopPropagation();
    }
    
    // Get name and value whether it's from dropdown or regular input
    const name = e.target?.name;
    const value = e.target?.value;
    
    if (!name) return; // Safety check
    
    let processedValue = value;
    
    if (name === 'iqScore') {
      processedValue = value.replace(/[^0-9]/g, '').substring(0, 3);
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

  const hasChanges = editingId && editData.fullName?.trim();

  if (isLoading && students.length === 0) {
    return (
      <div className="w-full flex justify-center items-center py-12">
        <div className="flex flex-col items-center">
          <span className="material-icons animate-spin text-[#488BBE] text-3xl mb-4">sync</span>
          <p className="text-[#488BBE]">Memuat data siswa...</p>
        </div>
      </div>
    );
  }

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
              <th className="px-4 py-3 text-left text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">KELAS</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">JENIS KELAMIN</th>
              <th 
                className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider cursor-pointer whitespace-nowrap"
                onClick={() => requestSort("nis")}
              >
                <div className="flex items-center justify-center gap-1">
                  NIS
                  <span className="material-icons text-sm">{getSortIcon("nis")}</span>
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">
                <div className="flex items-center justify-center">
                  SKRINING
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
                          <span 
                            className="material-icons text-sm font-bold text-[#535353] mr-2"
                          >remove</span>
                          <span>Belum Skrining</span>
                        </div>
                      </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider whitespace-nowrap">KONSELING</th>
              <th 
                className="px-4 py-3 text-center text-xs font-bold text-[#488BBE] uppercase tracking-wider cursor-pointer whitespace-nowrap"
                onClick={() => requestSort("iqScore")}
              >
                <div className="flex items-center justify-center gap-1">
                  SKOR IQ
                  <span className="material-icons text-sm">{getSortIcon("iqScore")}</span>
                </div>
              </th>
              <th className="px-4 py-3 text-center whitespace-nowrap w-20"></th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => {
              const statusUI = getScreeningStatusUI(student.screeningStatus || 'stable');
              const isLastElement = index === students.length - 1;
              const isEditing = editingId === student.id;
              
              return (
                <React.Fragment key={student.id}>
                  <tr 
                    className={clsx(
                      "bg-white hover:bg-gray-50 transition-colors",
                      isEditing ? "cursor-default" : "cursor-pointer"
                    )}
                    ref={isLastElement ? lastStudentElementRef : null}
                    onClick={() => !isEditing && handleViewStudentDetail(student.id)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          name="fullName"
                          value={editData.fullName}
                          onChange={handleEditChange}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm font-medium text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 w-full min-w-[200px] hover:border-[#488BBE] focus:outline-none focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE] transition-[border-color,box-shadow] duration-150"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900 hover:text-[#488BBE] hover:underline" title={student.fullName}>
                          {highlightText(student.fullName)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isEditing ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <CustomDropdown
                            name="classroom"
                            value={editData.classroom}
                            onChange={handleEditChange}
                            options={classroomOptions || [student.classroom]}
                            className="min-w-[120px]"
                          />
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">{student.classroom}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {isEditing ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <CustomDropdown
                            name="gender"
                            value={editData.gender}
                            onChange={handleEditChange}
                            options={[
                              { value: 'male', label: 'Laki-laki' },
                              { value: 'female', label: 'Perempuan' }
                            ]}
                            className="w-[110px]"
                          />
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          {student.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          name="nis"
                          value={editData.nis}
                          onChange={handleEditChange}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-gray-600 border border-gray-300 rounded-md px-3 py-1.5 w-full hover:border-[#488BBE] focus:outline-none focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE] transition-[border-color,box-shadow] duration-150"
                        />
                      ) : (
                        <div className="text-sm text-gray-600">
                          {highlightText(student.nis)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
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
                            status: student.screeningStatus || 'stable',
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
                      <span className={clsx("text-sm", student.counselingStatus ? "text-[#6DAF31]" : "text-[#EE4266]")}>
                        {student.counselingStatus ? "Sudah" : "Belum"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          name="iqScore"
                          value={editData.iqScore}
                          onChange={handleEditChange}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-gray-600 border border-gray-300 rounded-md px-2 py-1 w-16 text-center hover:border-[#488BBE] focus:outline-none focus:border-[#488BBE] focus:ring-1 focus:ring-[#488BBE] transition-[border-color,box-shadow] duration-150"
                          maxLength="3"
                          inputMode="numeric"
                        />
                      ) : (
                        <div className="text-sm text-gray-600">
                          {student.iqScore || "-"}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {isEditing ? (
                        <div 
                          className="flex space-x-2 justify-center" 
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Cancel button first */}
                          <button 
                            className="text-[#EE4266] hover:text-red-700 transition-colors" 
                            onClick={(e) => cancelEditing(e)}
                            aria-label="Cancel"
                          >
                            <span className="material-icons">cancel</span>
                          </button>
                          {/* Save button second */}
                          <button
                            type="button"
                            className={clsx(
                              "text-[#87C054] hover:text-[#6DAF31] transition-colors",
                              (!hasChanges || updateStudent.isPending) && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (hasChanges) {
                                saveEditing(student.id);
                              }
                            }}
                            disabled={!hasChanges || updateStudent.isPending}
                            aria-label="Save"
                          >
                            <span className="material-icons">
                              {updateStudent.isPending ? "hourglass_empty" : "check_circle"}
                            </span>
                          </button>
                        </div>
                      ) : (
                        <button
                          className="text-gray-400 hover:text-[#488BBE] transition-colors relative"
                          onClick={(e) => startEditing(student.id, e)}
                          disabled={editingId !== null}
                          onMouseEnter={() => setShowEditTooltip(student.id)}
                          onMouseLeave={() => setShowEditTooltip(null)}
                          aria-label="Edit student"
                        >
                          <span className="material-icons">edit</span>
                          {showEditTooltip === student.id && (
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
                    <td colSpan={8} className="p-0">
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
            })}
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

      {students.length === 0 && !isFetchingNextPage && !isLoading && (
        <div className="text-center py-8">
          <span className="material-icons text-gray-400 text-5xl">school</span>
          <p className="text-gray-500 mt-2">Tidak ada data siswa.</p>
        </div>
      )}
    </div>
  );
};

export default StudentTable;