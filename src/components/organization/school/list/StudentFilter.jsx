// src/components/organization/school/list/StudentFilter.jsx - Updated for reusable ListPage
import React from "react";
import { motion } from "framer-motion";

/**
 * Student Filters Component - Updated to work with reusable ListPage
 * @param {Object} props
 * @param {boolean} props.showModal - Whether to show the modal
 * @param {Function} props.setShowModal - Function to toggle modal visibility
 * @param {Object} props.filtersInput - Current filter input values
 * @param {Function} props.setFiltersInput - Function to update filter inputs
 * @param {Function} props.handleFilterSelect - Function to handle filter selection
 * @param {Function} props.applyFilters - Function to apply filters
 * @param {Object} props.optionsData - Filter options data
 * @param {Array} props.data - Student data (for any additional processing)
 */
const StudentFilters = ({ 
  showModal,
  setShowModal,
  filtersInput,
  setFiltersInput,
  handleFilterSelect,
  applyFilters,
  optionsData = {},
  data: students = []
}) => {
  if (!showModal) return null;

  // Extract grades and classrooms from optionsData
  const grades = optionsData.grades || [];
  const classrooms = optionsData.classrooms || [];

  const handleClose = () => {
    setShowModal(false);
  };

  const handleSave = () => {
    applyFilters();
    setShowModal(false);
  };

  return (
    <div className="fixed inset-0 bg-[#55555580] flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-xl shadow-lg w-full max-w-[655px] max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <div className="p-4 sm:p-6 flex flex-col max-h-[90vh]">
          <div className="flex flex-col justify-start items-start gap-6 overflow-y-auto">
            <div className="inline-flex justify-between items-center w-full">
              <div className="text-[#488bbe] text-lg sm:text-xl font-semibold">Filter</div>
              <button 
                onClick={handleClose}
                className="text-[#488bbe] hover:text-[#3399e9]"
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <div className="flex flex-col justify-start items-start gap-6 w-full">
              {/* Classroom Selection */}
              <div className="w-full flex flex-col justify-start items-start gap-3">
                <div className="text-[#488bbe] text-sm font-normal">Classroom</div>
                <div className="inline-flex justify-start items-center gap-2 flex-wrap">
                  {classrooms && classrooms.map((classroom) => (
                    <button
                      key={classroom}
                      className={`h-7 px-2.5 py-1 ${filtersInput.classroom === classroom ? 'bg-[#488bbe] text-white' : 'bg-[#eaecee] text-gray-700'} rounded-[5px] flex justify-center items-center transition-colors text-xs font-normal`}
                      onClick={() => {
                        handleFilterSelect('classroom', classroom);
                      }}
                    >
                      {classroom}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Grade Selection */}
              <div className="w-full flex flex-col justify-start items-start gap-3">
                <div className="text-[#488bbe] text-sm font-normal">Grade</div>
                <div className="inline-flex justify-start items-center gap-2 flex-wrap">
                  {grades && grades.map((grade) => (
                    <button
                      key={grade}
                      className={`h-7 px-2.5 py-1 ${
                        !filtersInput.classroom 
                          ? 'bg-[#eaecee] text-gray-400 cursor-not-allowed' 
                          : filtersInput.grade === grade 
                            ? 'bg-[#488bbe] text-white' 
                            : 'bg-[#eaecee] text-gray-700'
                      } rounded-[5px] flex justify-center items-center transition-colors text-xs font-normal`}
                      onClick={() => handleFilterSelect('grade', grade)}
                      disabled={!filtersInput.classroom}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Gender, Screening and Counseling */}
              <div className="flex justify-start items-start gap-4 sm:gap-8 flex-wrap">
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

export default StudentFilters;