// src/components/organization/company/EmployeeTable.jsx
import React, { useState, useRef, useCallback } from "react";
import { AnimatePresence } from "framer-motion";

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
  const [hasChanges, setHasChanges] = useState(false);
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const helpIconRef = useRef(null);
  const observerRef = useRef(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredName, setHoveredName] = useState(null);

  // Infinite scroll observer
  const lastEmployeeElementRef = useCallback(node => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    if (isFetchingNextPage || !hasNextPage) return;
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    }, { 
      threshold: 0.1,
      rootMargin: '0px 0px 100px 0px'
    });
    
    if (node) observerRef.current.observe(node);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  // Edit functions
  const startEditing = (id) => {
    if (editingId !== null) return;

    const employee = employees.find((emp) => emp.id === id);
    if (!employee) return;
    
    setEditingId(id);
    setEditData({
      fullName: employee.fullName || "",
      department: employee.department || "",
      position: employee.position || "",
      gender: employee.gender || "male",
      age: employee.age || 30,
      workDuration: employee.yearsOfService || employee.workDuration || 2,
      screeningStatus: employee.screeningStatus || "stable",
      counselingStatus: employee.counselingStatus || false
    });
    setHasChanges(false);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData({});
    setHasChanges(false);
  };

  const saveEditing = (id) => {
    if (!hasChanges) return;
    
    // Only send changed fields
    const changedFields = {};
    const originalEmployee = employees.find(emp => emp.id === id);
    
    Object.keys(editData).forEach(key => {
      const originalValue = originalEmployee[key] || originalEmployee.profile?.[key];
      if (editData[key] !== originalValue) {
        changedFields[key] = editData[key];
      }
    });
    
    // Convert workDuration back to yearsOfService
    if (changedFields.workDuration !== undefined) {
      changedFields.yearsOfService = parseInt(changedFields.workDuration);
      delete changedFields.workDuration;
    }
    
    updateEmployee.mutate(
      { id, data: changedFields },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditData({});
          setHasChanges(false);
        }
      }
    );
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    if (name === 'age' || name === 'workDuration') {
      processedValue = value.substring(0, 2);
    } else {
      processedValue = value.substring(0, 70);
    }
    
    setEditData((prev) => ({ ...prev, [name]: processedValue }));
    setHasChanges(true);
  };

  // Helpers
  const getScreeningStatusUI = (status) => {
    switch (status) {
      case 'at_risk':
        return {
          bgColor: 'bg-red-100',
          icon: <span className="material-icons text-red-500">warning</span>
        };
      case 'monitored':
        return {
          bgColor: 'bg-yellow-100',
          icon: <span className="material-icons text-yellow-500">error</span>
        };
      case 'stable':
      default:
        return {
          bgColor: 'bg-green-100',
          icon: <span className="material-icons text-green-500">check_circle</span>
        };
    }
  };

  const highlightText = (text) => {
    if (!searchInput || !text) return <span>{text}</span>;
    
    const parts = text.split(new RegExp(`(${searchInput})`, 'gi'));
    return (
      <span>
        {parts.map((part, index) => 
          part.toLowerCase() === searchInput.toLowerCase() ? 
            <span key={index} className="font-bold bg-yellow-200">{part}</span> : 
            <span key={index}>{part}</span>
        )}
      </span>
    );
  };

  // Truncate text to max 70 characters
  const truncateText = (text) => {
    if (!text) return '';
    return text.length > 70 ? text.substring(0, 70) + '...' : text;
  };

  return (
      <div className="overflow-x-auto scrollbar-custom">
        <table className="w-full">
          <thead className="bg-[#E8F5FF]">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-bold text-[#488bbe] uppercase tracking-wider cursor-pointer whitespace-nowrap"
                onClick={() => requestSort("fullName")}
              >
                <div className="flex items-center gap-2">
                  NAMA
                  <span className="material-icons text-sm">{getSortIcon("fullName")}</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-[#488bbe] uppercase tracking-wider whitespace-nowrap">
                DEPARTEMEN
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-[#488bbe] uppercase tracking-wider whitespace-nowrap">
                JABATAN
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-[#488bbe] uppercase tracking-wider whitespace-nowrap">
                JENIS KELAMIN
              </th>
              <th 
                className="px-6 py-3 text-center text-xs font-bold text-[#488bbe] uppercase tracking-wider cursor-pointer whitespace-nowrap"
                onClick={() => requestSort("age")}
              >
                <div className="flex items-center justify-center gap-2">
                  USIA
                  <span className="material-icons text-sm">{getSortIcon("age")}</span>
                </div>
              </th>
              <th 
                className="px-6 py-3 text-center text-xs font-bold text-[#488bbe] uppercase tracking-wider cursor-pointer whitespace-nowrap"
                onClick={() => requestSort("yearsOfService")}
              >
                <div className="flex items-center justify-center gap-2">
                  LAMA BEKERJA
                  <span className="material-icons text-sm">{getSortIcon("yearsOfService")}</span>
                </div>
              </th>
              <th className="px-6 py-3 text-center text-xs font-bold text-[#488bbe] uppercase tracking-wider relative whitespace-nowrap">
                <div className="flex items-center justify-center">
                  SKRINING
                  <span 
                    className="material-icons text-sm ml-1 text-gray-400 cursor-help" 
                    ref={helpIconRef}
                    onMouseEnter={() => setShowHelpTooltip(true)}
                    onMouseLeave={() => setTimeout(() => setShowHelpTooltip(false), 300)}
                  >
                    help_outline
                  </span>
                  
                  <AnimatePresence>
                    {showHelpTooltip && (
                      <motion.div 
                        className="fixed bg-[#00000099] text-white text-xs rounded-md p-2.5 shadow-lg z-[1000]"
                        style={{ 
                          width: "150px",
                          top: helpIconRef.current ? helpIconRef.current.getBoundingClientRect().top - 80 : 0,
                          left: helpIconRef.current ? helpIconRef.current.getBoundingClientRect().left + 20 : 0,
                        }}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.2 }}
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
                            <span className="material-icons text-gray-400 text-sm mr-1.5">remove</span>
                            <span>Belum Skrining</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </th>
              <th className="px-6 py-3 text-center text-xs font-bold text-[#488bbe] uppercase tracking-wider whitespace-nowrap">
                KONSELING
              </th>
              <th className="px-6 py-3 text-center">
                {/* Actions column */}
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee, index) => {
              const screeningStatus = employee.screeningStatus || employee.screening || 'stable';
              const screeningUI = getScreeningStatusUI(screeningStatus);
              const counselingStatus = employee.counselingStatus !== undefined ? employee.counselingStatus : employee.isDoneCounseling;
              const isLastElement = index === employees.length - 1;
              
              return (
                <React.Fragment key={employee.id}>
                  <tr 
                    className={`transition-all duration-300 ${
                      hoveredRow === employee.id 
                        ? 'bg-gradient-to-r from-white via-[#F0F9FF] to-white' 
                        : ''
                    }`}
                    ref={isLastElement ? lastEmployeeElementRef : null}
                    onMouseEnter={() => setHoveredRow(employee.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === employee.id ? (
                        <input
                          type="text"
                          name="fullName"
                          value={editData.fullName}
                          onChange={handleEditChange}
                          className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 min-w-[150px]"
                          maxLength={70}
                        />
                      ) : (
                        <div 
                          className={`text-sm font-medium text-gray-900 cursor-pointer ${
                            hoveredName === employee.id ? 'text-[#488bbe] underline' : ''
                          }`}
                          onMouseEnter={() => setHoveredName(employee.id)}
                          onMouseLeave={() => setHoveredName(null)}
                        >
                          {highlightText(truncateText(employee.fullName))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === employee.id ? (
                        <select
                          name="department"
                          value={editData.department}
                          onChange={handleEditChange}
                          className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 min-w-[150px]"
                        >
                          {departmentOptions.map((dept) => (
                            <option key={dept} value={dept}>{truncateText(dept)}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-sm text-gray-500">{truncateText(employee.department)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === employee.id ? (
                        <select
                          name="position"
                          value={editData.position}
                          onChange={handleEditChange}
                          className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 min-w-[120px]"
                        >
                          {positionOptions.map((pos) => (
                            <option key={pos} value={pos}>{truncateText(pos)}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-sm text-gray-500">{truncateText(employee.position)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === employee.id ? (
                        <select
                          name="gender"
                          value={editData.gender}
                          onChange={handleEditChange}
                          className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="male">L</option>
                          <option value="female">P</option>
                        </select>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {employee.gender === 'male' || employee.gender === 'm' ? 'L' : 'P'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {editingId === employee.id ? (
                        <input
                          type="number"
                          name="age"
                          value={editData.age}
                          onChange={handleEditChange}
                          className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 w-16 mx-auto"
                        />
                      ) : (
                        <div className="text-sm text-gray-500">{employee.age || "36"}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {editingId === employee.id ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            name="workDuration"
                            value={editData.workDuration}
                            onChange={handleEditChange}
                            className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1 w-16"
                          />
                          <span className="text-sm text-gray-500">Tahun</span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {employee.yearsOfService || employee.workDuration || "2"} Tahun
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${screeningUI.bgColor}`}
                      >
                        {screeningUI.icon}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`${counselingStatus ? "text-green-500" : "text-red-500"}`}>
                        {counselingStatus ? "Sudah" : "Belum"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {editingId === employee.id ? (
                        <div className="flex space-x-2 justify-center">
                          <button
                            className={`text-[#9BCA61] hover:text-green-700 ${!hasChanges || updateEmployee.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                            onClick={() => hasChanges && saveEditing(employee.id)}
                            disabled={!hasChanges || updateEmployee.isPending}
                            aria-label="Save"
                          >
                            <span className="material-icons">
                              {updateEmployee.isPending ? "hourglass_empty" : "check_circle"}
                            </span>
                          </button>
                          <button 
                            className="text-[#EE4266] hover:text-red-700" 
                            onClick={cancelEditing} 
                            disabled={updateEmployee.isPending}
                            aria-label="Cancel"
                          >
                            <span className="material-icons">cancel</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          className={`text-[#8b8b8b] hover:text-[#488bbe] ${editingId !== null ? "opacity-50 cursor-not-allowed" : ""}`}
                          onClick={() => editingId === null && startEditing(employee.id)}
                          disabled={editingId !== null}
                          aria-label="Edit employee"
                        >
                          <span className="material-icons">edit</span>
                        </button>
                      )}
                    </td>
                  </tr>
                  {!isLastElement && (
                    <tr className="h-[1px]">
                      <td colSpan={9} className="p-0">
                        <div 
                          className="h-[1px] w-full"
                          style={{ 
                            background: 'linear-gradient(to right, #FFFFFF, #488BBE, #FFFFFF)'
                          }}
                        ></div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

      {/* Infinite Scroll Loading Indicator */}
      {isFetchingNextPage && (
        <div className="py-4 text-center">
          <div className="flex justify-center items-center space-x-2">
            <span className="material-icons animate-spin text-[#488bbe] text-xl">refresh</span>
            <span className="text-[#488bbe] text-sm">Memuat data tambahan...</span>
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {employees.length === 0 && (
        <div className="py-16 text-center">
          <span className="material-icons text-gray-400 text-5xl mb-4">business_center</span>
          <p className="text-gray-500">Tidak ada data karyawan yang tersedia</p>
        </div>
      )}
    </div>
  );
};

export default EmployeeTable;