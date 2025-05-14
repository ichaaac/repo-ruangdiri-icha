// src/components/organization/company/list/EmployeeTable.jsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
  const scrollRef = useRef(null);
  const contentRef = useRef(null);
  const [showScrollBar, setShowScrollBar] = useState(false);
  const [scrollPercentage, setScrollPercentage] = useState(0);

  // Setup horizontal scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = contentRef.current;
      const percentage = (scrollLeft / (scrollWidth - clientWidth)) * 100;
      setScrollPercentage(percentage);
      setShowScrollBar(scrollWidth > clientWidth);
    };

    const container = contentRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    const resizeObserver = new ResizeObserver(handleScroll);
    resizeObserver.observe(container);
    handleScroll();
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, []);

  // Simplified scroll bar click handler
  const handleScrollClick = (e) => {
    if (!contentRef.current || !scrollRef.current) return;
    
    const rect = scrollRef.current.getBoundingClientRect();
    const percentage = ((e.clientX - rect.left) / rect.width) * 100;
    const scrollPosition = (percentage / 100) * (contentRef.current.scrollWidth - contentRef.current.clientWidth);
    contentRef.current.scrollLeft = scrollPosition;
  };

  // Infinite scroll observer
  const lastEmployeeElementRef = useCallback(node => {
    if (observerRef.current) observerRef.current.disconnect();
    if (isFetchingNextPage || !hasNextPage) return;
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
    }, { threshold: 0.1, rootMargin: '0px 0px 100px 0px' });
    
    if (node) observerRef.current.observe(node);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  // Get positions for department
  const getPositionsForDepartment = (department) => {
    const deptEmployees = employees.filter(emp => emp.department === department);
    const uniquePositions = [...new Set(deptEmployees.map(emp => emp.position))];
    
    if (uniquePositions.length) return uniquePositions;
    
    const defaults = {
      "Finance": ["Head", "Manager", "Accountant", "Analyst", "Assistant", "Coordinator"],
      "Human Resources": ["Head", "Manager", "Staff", "Recruiter", "Specialist"],
      "Marketing": ["Head", "Manager", "Specialist", "Coordinator", "Assistant"],
      "Operations": ["Head", "Lead", "Manager", "Staff", "Coordinator"],
      "IT": ["Head", "Lead", "Developer", "Designer", "Support"],
      "Engineering": ["Head", "Lead", "Engineer", "Specialist"],
      "Sales": ["Head", "Manager", "Staff", "Representative"]
    };
    
    return defaults[department] || ["Head", "Manager", "Staff", "Lead"];
  };

  // Edit handlers
  const startEditing = (id) => {
    if (editingId) return;
    const employee = employees.find(emp => emp.id === id);
    if (!employee) return;
    
    setEditingId(id);
    setEditData({
      fullName: employee.fullName || "",
      department: employee.department || "",
      position: employee.position || "",
      gender: employee.gender || "male",
      age: employee.age || 30,
      yearsOfService: employee.yearsOfService || 2
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEditing = (id) => {
    if (!editData.fullName?.trim()) return;
    
    const changedFields = {};
    const original = employees.find(emp => emp.id === id);
    
    Object.keys(editData).forEach(key => {
      if (editData[key] !== original[key]) {
        changedFields[key] = editData[key];
      }
    });
    
    if (!Object.keys(changedFields).length) return;
    
    if (changedFields.yearsOfService !== undefined) {
      changedFields.yearsOfService = parseInt(changedFields.yearsOfService);
    }
    
    updateEmployee.mutate(
      { id, data: changedFields },
      { onSuccess: cancelEditing }
    );
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    if (name === 'age' || name === 'yearsOfService') {
      processedValue = value.replace(/[^0-9]/g, '').substring(0, 2);
    }
    
    setEditData(prev => ({ ...prev, [name]: processedValue }));
  };

  // Helpers
  const getScreeningStatusUI = (status) => {
    const map = {
      'at_risk': { bg: 'bg-red-100', icon: 'warning', color: 'text-red-500', text: 'Berisiko' },
      'monitored': { bg: 'bg-yellow-100', icon: 'error', color: 'text-yellow-500', text: 'Pengawasan' },
      'stable': { bg: 'bg-green-100', icon: 'check_circle', color: 'text-green-500', text: 'Stabil' }
    };
    return map[status] || map.stable;
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
      return editData[key] !== original[key];
    });

  // Responsive Custom Select Component
  const CustomSelect = ({ name, value, onChange, options, className }) => (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`appearance-none text-xs md:text-sm text-gray-600 border border-gray-300 rounded px-2 md:px-3 py-1 md:py-1.5 pr-6 md:pr-8 bg-white hover:border-primary-variant1 focus:outline-none focus:border-primary-variant1 focus:ring-1 focus:ring-primary-variant1 transition-all ${className}`}
      >
        {options.map(opt => (
          <option key={opt.value || opt} value={opt.value || opt}>
            {opt.label || opt}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 md:px-2">
        <span className="material-icons text-gray-400 text-sm md:text-base">expand_more</span>
      </div>
    </div>
  );

  return (
    <div className="relative">
      {/* Simple Horizontal Scroll Bar */}
      {showScrollBar && (
        <div className="absolute top-0 left-0 right-0 z-10 h-3 px-4">
          <div 
            ref={scrollRef}
            className="relative h-1 bg-gray-200 rounded-full cursor-pointer overflow-hidden"
            onClick={handleScrollClick}
          >
            <div 
              className="absolute h-full bg-primary rounded-full transition-all duration-150"
              style={{ 
                width: '20%', 
                left: `${scrollPercentage * 0.8}%`
              }}
            />
          </div>
        </div>
      )}
      
      <div 
        ref={contentRef} 
        className="overflow-x-auto mt-5"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          [data-scrollbar]::-webkit-scrollbar { display: none; }
        `}} />
        
        <table className="w-full" style={{ minWidth: '1200px' }}>
          <thead className="bg-primary-light">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider cursor-pointer whitespace-nowrap"
                onClick={() => requestSort("fullName")}
              >
                <div className="flex items-center gap-1">
                  NAMA
                  <span className="material-icons text-sm">{getSortIcon("fullName")}</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider whitespace-nowrap">DEPARTEMEN</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider whitespace-nowrap">JABATAN</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider whitespace-nowrap">JENIS KELAMIN</th>
              <th 
                className="px-6 py-3 text-center text-xs font-bold text-primary uppercase tracking-wider cursor-pointer whitespace-nowrap"
                onClick={() => requestSort("age")}
              >
                <div className="flex items-center justify-center gap-1">
                  USIA
                  <span className="material-icons text-sm">{getSortIcon("age")}</span>
                </div>
              </th>
              <th 
                className="px-6 py-3 text-center text-xs font-bold text-primary uppercase tracking-wider cursor-pointer whitespace-nowrap"
                onClick={() => requestSort("yearsOfService")}
              >
                <div className="flex items-center justify-center gap-1">
                  LAMA BEKERJA
                  <span className="material-icons text-sm">{getSortIcon("yearsOfService")}</span>
                </div>
              </th>
              <th className="px-6 py-3 text-center text-xs font-bold text-primary uppercase tracking-wider whitespace-nowrap">
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
              <th className="px-6 py-3 text-center text-xs font-bold text-primary uppercase tracking-wider whitespace-nowrap">KONSELING</th>
              <th className="px-6 py-3 text-center whitespace-nowrap"></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee, index) => {
              const statusUI = getScreeningStatusUI(employee.screeningStatus || 'stable');
              const isLastElement = index === employees.length - 1;
              const isEditing = editingId === employee.id;
              const positions = isEditing ? getPositionsForDepartment(editData.department) : [];
              
              return (
                <React.Fragment key={employee.id}>
                  <tr 
                    className="bg-white hover:bg-gray-50"
                    ref={isLastElement ? lastEmployeeElementRef : null}
                  >
                    <td className="px-6 py-3 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          name="fullName"
                          value={editData.fullName}
                          onChange={handleEditChange}
                          className="text-xs md:text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 md:px-3 py-1 md:py-1.5 w-full min-w-[150px] md:min-w-[200px] hover:border-primary-variant1 focus:outline-none focus:border-primary-variant1 focus:ring-1 focus:ring-primary-variant1 transition-all"
                        />
                      ) : (
                        <div className="text-xs md:text-sm font-medium text-gray-900 pr-4" title={employee.fullName}>
                          {highlightText(employee.fullName)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      {isEditing ? (
                        <CustomSelect
                          name="department"
                          value={editData.department}
                          onChange={handleEditChange}
                          options={departmentOptions}
                          className="w-full min-w-[120px] md:min-w-[150px]"
                        />
                      ) : (
                        <div className="text-xs md:text-sm text-gray-500">{employee.department}</div>
                      )}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      {isEditing ? (
                        <CustomSelect
                          name="position"
                          value={editData.position}
                          onChange={handleEditChange}
                          options={positions}
                          className="w-full min-w-[100px] md:min-w-[120px]"
                        />
                      ) : (
                        <div className="text-xs md:text-sm text-gray-500">{employee.position}</div>
                      )}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      {isEditing ? (
                        <CustomSelect
                          name="gender"
                          value={editData.gender}
                          onChange={handleEditChange}
                          options={[
                            { value: 'male', label: 'L' },
                            { value: 'female', label: 'P' }
                          ]}
                          className="w-14 md:w-16"
                        />
                      ) : (
                        <div className="text-xs md:text-sm text-gray-500">
                          {employee.gender === 'male' ? 'L' : 'P'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3 text-center whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="text"
                            name="age"
                            value={editData.age}
                            onChange={handleEditChange}
                            className="text-xs md:text-sm text-gray-500 border border-gray-300 rounded px-1.5 md:px-2 py-1 w-10 md:w-12 text-center hover:border-primary-variant1 focus:outline-none focus:border-primary-variant1 focus:ring-1 focus:ring-primary-variant1 transition-all"
                            maxLength="2"
                            inputMode="numeric"
                          />
                          <span className="text-xs md:text-sm text-gray-500">Tahun</span>
                        </div>
                      ) : (
                        <div className="text-xs md:text-sm text-gray-500">
                          <span>{employee.age}</span>
                          <span className="ml-1">Tahun</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3 text-center whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="text"
                            name="yearsOfService"
                            value={editData.yearsOfService}
                            onChange={handleEditChange}
                            className="text-xs md:text-sm text-gray-500 border border-gray-300 rounded px-1.5 md:px-2 py-1 w-10 md:w-12 text-center hover:border-primary-variant1 focus:outline-none focus:border-primary-variant1 focus:ring-1 focus:ring-primary-variant1 transition-all"
                            maxLength="2"
                            inputMode="numeric"
                          />
                          <span className="text-xs md:text-sm text-gray-500">Tahun</span>
                        </div>
                      ) : (
                        <div className="text-xs md:text-sm text-gray-500">
                          <span>{employee.yearsOfService}</span>
                          <span className="ml-1">Tahun</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${statusUI.bg} cursor-pointer`}
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
                        <span className={`material-icons ${statusUI.color}`}>{statusUI.icon}</span>
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center whitespace-nowrap">
                      <span className={employee.counselingStatus ? "text-green-500" : "text-red-500"}>
                        {employee.counselingStatus ? "Sudah" : "Belum"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center relative whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex space-x-2 justify-center">
                          <button
                            className={`text-accent hover:text-accent-variant1 transition-colors ${!hasChanges || updateEmployee.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                            onClick={() => hasChanges && saveEditing(employee.id)}
                            disabled={!hasChanges || updateEmployee.isPending}
                          >
                            <span className="material-icons">check_circle</span>
                          </button>
                          <button 
                            className="text-red-500 hover:text-red-700 transition-colors" 
                            onClick={cancelEditing}
                          >
                            <span className="material-icons">cancel</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          className="text-gray-400 hover:text-primary-variant1 transition-colors relative"
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

      {/* Status Tooltip */}
      <AnimatePresence>
        {hoveredStatus && (
          <motion.div
            className="fixed bg-gray-800 text-white text-xs rounded px-2 h-[19px] flex items-center whitespace-nowrap z-50 shadow-lg"
            style={{ 
              left: hoveredStatus.x,
              top: hoveredStatus.y - 9.5,
              width: getScreeningStatusUI(hoveredStatus.status).text === 'Berisiko' ? '61px' : 
                     getScreeningStatusUI(hoveredStatus.status).text === 'Pengawasan' ? '73px' : '44px'
            }}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
          >
            {getScreeningStatusUI(hoveredStatus.status).text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading indicator */}
      {isFetchingNextPage && (
        <div className="py-4 text-center">
          <span className="material-icons animate-spin text-primary">refresh</span>
        </div>
      )}
    </div>
  );
};

export default EmployeeTable;