// src/components/shared/organization/OrganizationFilters.jsx
import React from "react";
import { motion } from "framer-motion";

const OrganizationFilters = ({ 
  organizationType = "school",
  showModal,
  setShowModal,
  filtersInput,
  handleFilterSelect,
  applyFilters,
  primaryOptions = [],
  secondaryOptions = []
}) => {
  if (!showModal) return null;

  const handleClose = () => {
    setShowModal(false);
  };

  const handleSave = () => {
    applyFilters();
    setShowModal(false);
  };

  // Organization-specific configurations
  const config = {
    school: {
      primaryLabel: "Classroom",
      secondaryLabel: "Grade",
      genderLabel: "Jenis Kelamin",
      screeningLabel: "Skrining",
      counselingLabel: "Konseling",
      screeningOptions: [
        { value: 'at_risk', label: 'Berisiko' },
        { value: 'monitored', label: 'Pengawasan' },
        { value: 'stable', label: 'Stabil' }
      ]
    },
    company: {
      primaryLabel: "Departemen",
      secondaryLabel: "Jabatan",
      genderLabel: "Jenis Kelamin",
      screeningLabel: "Skrining",
      counselingLabel: "Konseling",
      screeningOptions: [
        { value: 'at_risk', label: 'Berisiko' },
        { value: 'monitored', label: 'Pengawasan' },
        { value: 'stable', label: 'Stabil' }
      ]
    }
  };

  const currentConfig = config[organizationType];

  return (
    <div className="fixed inset-0 bg-[#55555580] flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-xl shadow-lg w-full max-w-[655px] max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <div className="p-4 md:p-6 flex flex-col max-h-[90vh]">
          <div className="flex flex-col justify-start items-start gap-4 md:gap-6 overflow-y-auto">
            <div className="inline-flex justify-between items-center w-full">
              <div className="text-[#488bbe] text-lg md:text-xl font-semibold">Filter</div>
              <button 
                onClick={handleClose}
                className="text-[#488bbe] hover:text-[#3399e9]"
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <div className="flex flex-col justify-start items-start gap-4 md:gap-6 w-full">
              {/* Primary Selection (Classroom/Department) */}
              <div className="w-full flex flex-col justify-start items-start gap-3">
                <div className="text-[#488bbe] text-sm font-normal">{currentConfig.primaryLabel}</div>
                <div className="inline-flex justify-start items-center gap-2 flex-wrap">
                  {primaryOptions.map((option) => (
                    <button
                      key={option}
                      className={`h-7 px-2.5 py-1 ${
                        filtersInput[organizationType === "school" ? "classroom" : "department"] === option 
                          ? 'bg-[#488bbe] text-white' 
                          : 'bg-[#eaecee] text-gray-700'
                      } rounded-[5px] flex justify-center items-center transition-colors text-xs`}
                      onClick={() => {
                        handleFilterSelect(
                          organizationType === "school" ? 'classroom' : 'department', 
                          option
                        );
                      }}
                    >
                      <div className="text-center text-xs font-normal">{option}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Secondary Selection (Grade/Position) */}
              <div className="w-full flex flex-col justify-start items-start gap-3">
                <div className="text-[#488bbe] text-sm font-normal">{currentConfig.secondaryLabel}</div>
                <div className="inline-flex justify-start items-center gap-2 flex-wrap">
                  {secondaryOptions.map((option) => (
                    <button
                      key={option}
                      className={`h-7 px-2.5 py-1 ${
                        organizationType === "school" && !filtersInput.classroom 
                          ? 'bg-[#eaecee] text-gray-400 cursor-not-allowed' 
                          : filtersInput[organizationType === "school" ? "grade" : "position"] === option 
                            ? 'bg-[#488bbe] text-white' 
                            : 'bg-[#eaecee] text-gray-700'
                      } rounded-[5px] flex justify-center items-center transition-colors text-xs`}
                      onClick={() => handleFilterSelect(
                        organizationType === "school" ? 'grade' : 'position', 
                        option
                      )}
                      disabled={organizationType === "school" && !filtersInput.classroom}
                    >
                      <div className="text-center text-xs font-normal">{option}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Gender, Screening and Counseling */}
              <div className="flex flex-col md:flex-row justify-start items-start gap-4 md:gap-8 w-full">
                {/* Gender Selection */}
                <div className="flex flex-col justify-start items-start gap-3">
                  <div className="text-[#488bbe] text-sm font-normal">{currentConfig.genderLabel}</div>
                  <div className="inline-flex justify-start items-center gap-2">
                    <button
                      className={`h-8 px-3 py-2 ${
                        filtersInput.gender === 'L' ? 'bg-[#488bbe] text-white' : 'bg-[#eaecee] text-gray-700'
                      } rounded-[5px] flex justify-center items-center transition-colors`}
                      onClick={() => handleFilterSelect('gender', 'L')}
                    >
                      <div className="text-xs font-normal">L</div>
                    </button>
                    <button
                      className={`h-8 px-3 py-2 ${
                        filtersInput.gender === 'P' ? 'bg-[#488bbe] text-white' : 'bg-[#eaecee] text-gray-700'
                      } rounded-[5px] flex justify-center items-center transition-colors`}
                      onClick={() => handleFilterSelect('gender', 'P')}
                    >
                      <div className="text-xs font-normal">P</div>
                    </button>
                  </div>
                </div>
                
                {/* Screening Selection */}
                <div className="flex flex-col justify-start items-start gap-3">
                  <div className="text-[#488bbe] text-sm font-normal">{currentConfig.screeningLabel}</div>
                  <div className="inline-flex justify-start items-center gap-2 flex-wrap">
                    {currentConfig.screeningOptions.map((option) => (
                      <button
                        key={option.value}
                        className={`h-8 px-3 py-2 ${
                          filtersInput.screeningStatus === option.value 
                            ? 'bg-[#488bbe] text-white' 
                            : 'bg-[#eaecee] text-gray-700'
                        } rounded-[5px] flex justify-center items-center transition-colors`}
                        onClick={() => handleFilterSelect('screeningStatus', option.value)}
                      >
                        <div className="text-xs font-normal">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Counseling Selection */}
                <div className="flex flex-col justify-start items-start gap-3">
                  <div className="text-[#488bbe] text-sm font-normal">{currentConfig.counselingLabel}</div>
                  <div className="inline-flex justify-start items-center gap-2">
                    <button
                      className={`h-8 px-3 py-2 ${
                        filtersInput.counselingStatus === true ? 'bg-[#488bbe] text-white' : 'bg-[#eaecee] text-gray-700'
                      } rounded-[5px] flex justify-start items-center transition-colors`}
                      onClick={() => handleFilterSelect('counselingStatus', true)}
                    >
                      <div className="text-xs font-normal">Sudah</div>
                    </button>
                    <button
                      className={`h-8 px-3 py-2 ${
                        filtersInput.counselingStatus === false ? 'bg-[#488bbe] text-white' : 'bg-[#eaecee] text-gray-700'
                      } rounded-[5px] flex justify-start items-center transition-colors`}
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
          <div className="mt-4 md:mt-6 pt-4 border-t border-gray-200">
            <button
              className="w-full h-[42px] px-7 py-2.5 bg-[#488bbe] rounded-full flex justify-center items-center hover:bg-[#3399e9] transition-colors"
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

export default OrganizationFilters;