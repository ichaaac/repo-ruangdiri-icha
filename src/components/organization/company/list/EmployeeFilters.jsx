// src/components/organization/company/list/EmployeeFilters.jsx
import React, { useEffect } from "react";
import { motion } from "framer-motion";

const EmployeeFilters = ({ 
  showModal,
  setShowModal,
  filtersInput,
  setFiltersInput, // Add this prop to handle state changes
  handleFilterSelect,
  applyFilters,
  departments,
  positions,
  employees
}) => {
  // Reset state when modal closes without saving
  useEffect(() => {
    if (!showModal) {
      // No automatic reset here - we'll handle it differently
    }
  }, [showModal]);

  const handleClose = () => {
    // Reset to applied filters when closing without saving
    setShowModal(false);
  };

  const handleSave = () => {
    applyFilters();
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-[#55555580] flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-xl shadow-lg w-[655px] max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <div className="p-6 flex flex-col max-h-[90vh]">
          <div className="flex flex-col justify-start items-start gap-6 overflow-y-auto">
            <div className="inline-flex justify-between items-center w-full">
              <div className="text-[#488bbe] text-xl font-semibold">Filter</div>
              <button 
                onClick={handleClose}
                className="text-[#488bbe] hover:text-[#3399e9]"
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <div className="flex flex-col justify-start items-start gap-6 w-full">
              {/* Department Selection */}
              <div className="w-full flex flex-col justify-start items-start gap-3">
                <div className="text-[#488bbe] text-sm font-normal">Departemen</div>
                <div className="inline-flex justify-start items-center gap-2 flex-wrap">
                  {departments.map((dept) => (
                    <button
                      key={dept}
                      className={`h-7 px-2.5 py-1 ${filtersInput.department === dept ? 'bg-[#488bbe] text-white' : 'bg-[#eaecee] text-gray-700'} rounded-[5px] flex justify-center items-center transition-colors`}
                      onClick={() => handleFilterSelect('department', dept)}
                    >
                      <div className="text-center text-xs font-normal">{dept}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Position Selection - Now shows all positions regardless of department */}
              <div className="w-full flex flex-col justify-start items-start gap-3">
                <div className="text-[#488bbe] text-sm font-normal">Jabatan</div>
                <div className="inline-flex justify-start items-center gap-2 flex-wrap">
                  {positions.map((pos) => (
                    <button
                      key={pos}
                      className={`h-7 px-2.5 py-1 ${filtersInput.position === pos ? 'bg-[#488bbe] text-white' : 'bg-[#eaecee] text-gray-700'} rounded-[5px] flex justify-center items-center transition-colors`}
                      onClick={() => handleFilterSelect('position', pos)}
                    >
                      <div className="text-center text-xs font-normal">{pos}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Gender, Screening and Counseling */}
              <div className="flex justify-start items-start gap-8 flex-wrap">
                {/* Gender Selection */}
                <div className="flex flex-col justify-start items-start gap-3">
                  <div className="text-[#488bbe] text-sm font-normal">Jenis Kelamin</div>
                  <div className="inline-flex justify-start items-center gap-2">
                    <button
                      className={`h-8 px-3 py-2 ${filtersInput.gender === 'L' ? 'bg-[#488bbe] text-white' : 'bg-[#eaecee] text-gray-700'} rounded-[5px] flex justify-center items-center transition-colors`}
                      onClick={() => handleFilterSelect('gender', 'L')}
                    >
                      <div className="text-xs font-normal">L</div>
                    </button>
                    <button
                      className={`h-8 px-3 py-2 ${filtersInput.gender === 'P' ? 'bg-[#488bbe] text-white' : 'bg-[#eaecee] text-gray-700'} rounded-[5px] flex justify-center items-center transition-colors`}
                      onClick={() => handleFilterSelect('gender', 'P')}
                    >
                      <div className="text-xs font-normal">P</div>
                    </button>
                  </div>
                </div>
                
                {/* Screening Selection */}
                <div className="flex flex-col justify-start items-start gap-3">
                  <div className="text-[#488bbe] text-sm font-normal">Skrining</div>
                  <div className="inline-flex justify-start items-center gap-2 flex-wrap">
                    <button
                      className={`h-8 px-3 py-2 ${filtersInput.screeningStatus === 'at_risk' ? 'bg-[#488bbe] text-white' : 'bg-[#eaecee] text-gray-700'} rounded-[5px] flex justify-start items-center transition-colors`}
                      onClick={() => handleFilterSelect('screeningStatus', 'at_risk')}
                    >
                      <div className="text-xs font-normal">Berisiko</div>
                    </button>
                    <button
                      className={`h-8 px-3 py-2 ${filtersInput.screeningStatus === 'monitored' ? 'bg-[#488bbe] text-white' : 'bg-[#eaecee] text-gray-700'} rounded-[5px] flex justify-center items-center transition-colors`}
                      onClick={() => handleFilterSelect('screeningStatus', 'monitored')}
                    >
                      <div className="text-xs font-normal">Pengawasan</div>
                    </button>
                    <button
                      className={`h-8 px-3 py-2 ${filtersInput.screeningStatus === 'stable' ? 'bg-[#488bbe] text-white' : 'bg-[#eaecee] text-gray-700'} rounded-[5px] flex justify-center items-center transition-colors`}
                      onClick={() => handleFilterSelect('screeningStatus', 'stable')}
                    >
                      <div className="text-xs font-normal">Stabil</div>
                    </button>
                  </div>
                </div>
                
                {/* Counseling Selection */}
                <div className="flex flex-col justify-start items-start gap-3">
                  <div className="text-[#488bbe] text-sm font-normal">Konseling</div>
                  <div className="inline-flex justify-start items-center gap-2">
                    <button
                      className={`h-8 px-3 py-2 ${filtersInput.counselingStatus === true ? 'bg-[#488bbe] text-white' : 'bg-[#eaecee] text-gray-700'} rounded-[5px] flex justify-start items-center transition-colors`}
                      onClick={() => handleFilterSelect('counselingStatus', true)}
                    >
                      <div className="text-xs font-normal">Sudah</div>
                    </button>
                    <button
                      className={`h-8 px-3 py-2 ${filtersInput.counselingStatus === false ? 'bg-[#488bbe] text-white' : 'bg-[#eaecee] text-gray-700'} rounded-[5px] flex justify-start items-center transition-colors`}
                      onClick={() => handleFilterSelect('counselingStatus', false)}
                    >
                      <div className="text-xs font-normal">Belum</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Save Button */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              className="w-full h-[42px] px-7 py-2.5 bg-[#488bbe] rounded-full flex justify-center items-center"
              onClick={handleSave}
            >
              <div className="text-white text-sm font-semibold">Simpan</div>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EmployeeFilters;