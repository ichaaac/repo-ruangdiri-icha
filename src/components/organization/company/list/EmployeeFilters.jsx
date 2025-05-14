// src/components/organization/company/list/EmployeeFilters.jsx
import React, { useMemo } from "react";
import { motion } from "framer-motion";

const EmployeeFilters = ({ 
  showModal,
  setShowModal,
  filtersInput,
  handleFilterSelect,
  applyFilters,
  departmentOptions,
  positionOptions
}) => {
  if (!showModal) return null;

  // Get positions based on selected department
  const availablePositions = useMemo(() => {
    if (!filtersInput.department || !departmentOptions) {
      // If no department selected, return default positions
      return ["Head", "Manager", "Staff", "Lead", "Specialist"];
    }

    // Find the department data
    const departmentData = departmentOptions.find(
      dept => typeof dept === 'object' ? dept.department === filtersInput.department : dept === filtersInput.department
    );

    if (departmentData && typeof departmentData === 'object' && departmentData.positions) {
      return departmentData.positions;
    }

    // Fallback positions based on department name
    const departmentPositions = {
      "Human Resources": ["Head", "Manager", "Staff", "Recruiter", "Specialist"],
      "Finance": ["Head", "Manager", "Accountant", "Analyst"],
      "Marketing": ["Head", "Manager", "Specialist", "Coordinator", "Assistant"],
      "Operations": ["Head", "Lead", "Manager", "Staff"],
      "Information Technology": ["Head", "Lead", "Developer", "Designer", "Support"],
      "IT": ["Head", "Lead", "Developer", "Designer", "Support"],
      "Product Development": ["Head", "Lead", "Manager", "Engineer"],
      "Legal": ["Head", "Counsel", "Specialist"],
      "Sales": ["Head", "Manager", "Staff", "Analyst"],
      "Engineering": ["Head", "Engineer", "Specialist", "Lead"]
    };

    return departmentPositions[filtersInput.department] || ["Head", "Manager", "Staff", "Lead"];
  }, [filtersInput.department, departmentOptions]);

  // Extract department names for display
  const departmentNames = useMemo(() => {
    return departmentOptions.map(dept => 
      typeof dept === 'object' ? dept.department : dept
    );
  }, [departmentOptions]);

  // Reset position when department changes (optional)
  React.useEffect(() => {
    if (filtersInput.position && !availablePositions.includes(filtersInput.position)) {
      handleFilterSelect('position', null);
    }
  }, [filtersInput.department, filtersInput.position, availablePositions, handleFilterSelect]);

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
                onClick={() => setShowModal(false)}
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
                  {departmentNames.map((dept) => (
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
              
              {/* Position Selection - Now Dynamic */}
              <div className="w-full flex flex-col justify-start items-start gap-3">
                <div className="text-[#488bbe] text-sm font-normal">
                  Jabatan 
                  {filtersInput.department && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({filtersInput.department})
                    </span>
                  )}
                </div>
                <div className="inline-flex justify-start items-center gap-2 flex-wrap">
                  {availablePositions.map((pos) => (
                    <button
                      key={pos}
                      className={`h-7 px-2.5 py-1 ${filtersInput.position === pos ? 'bg-[#488bbe] text-white' : 'bg-[#eaecee] text-gray-700'} rounded-[5px] flex justify-center items-center transition-colors`}
                      onClick={() => handleFilterSelect('position', pos)}
                    >
                      <div className="text-center text-xs font-normal">{pos}</div>
                    </button>
                  ))}
                </div>
                {!filtersInput.department && (
                  <p className="text-xs text-gray-500 italic">
                    Pilih departemen untuk melihat jabatan spesifik
                  </p>
                )}
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
              onClick={() => {
                applyFilters();
                setShowModal(false);
              }}
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