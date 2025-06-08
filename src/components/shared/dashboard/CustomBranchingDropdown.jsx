"use client"

import { useState, useRef, useEffect } from "react"

const CustomBranchingDropdown = ({
  selectedClassroom,
  selectedGrade,
  onClassroomSelect,
  onGradeSelect,
  classrooms = [],
  grades = [],
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showGrades, setShowGrades] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setShowGrades(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleClassroomClick = (classroom) => {
    onClassroomSelect(classroom)
    // Automatically show grades when classroom is selected
    if (grades.length > 0) {
      setShowGrades(true)
    } else {
      // If no grades available, close dropdown
      setIsOpen(false)
      setShowGrades(false)
    }
  }

  const handleGradeClick = (grade) => {
    onGradeSelect(grade)
    setIsOpen(false)
    setShowGrades(false)
  }

  const handleToggle = () => {
    setIsOpen(!isOpen)
    setShowGrades(false) // Reset grades visibility when toggling
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Trigger */}
      <button
        type="button"
        onClick={handleToggle}
        className="flex gap-1 items-center self-start whitespace-nowrap text-sm border border-gray-200 rounded-md px-3 py-2 hover:bg-gray-50 transition-colors bg-white"
      >
        <span className="self-stretch my-auto">
          {selectedClassroom && selectedGrade
            ? `${selectedClassroom} - ${selectedGrade}`
            : selectedClassroom || "Kelas"}
        </span>
        <span className="material-icons text-sm">keyboard_arrow_down</span>
      </button>

      {/* Dropdown Container */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 flex z-20">
          {/* Classroom Dropdown */}
          <div
            className="w-20 bg-white border border-gray-200 rounded-l-md shadow-lg"
            style={{
              filter:
                "drop-shadow(0px 3px 6px rgba(0, 0, 0, 0.05)) drop-shadow(0px 11px 11px rgba(0, 0, 0, 0.04)) drop-shadow(0px 25px 15px rgba(0, 0, 0, 0.03)) drop-shadow(0px 44px 17px rgba(0, 0, 0, 0.01))",
            }}
          >
            {classrooms.map((classroom) => (
              <button
                key={classroom}
                type="button"
                className={`w-full text-center px-3 py-2 text-sm hover:bg-gray-50 first:rounded-tl-md last:rounded-bl-md ${
                  selectedClassroom === classroom ? "bg-[#3399E9] text-white font-semibold" : "text-gray-700"
                }`}
                onClick={() => handleClassroomClick(classroom)}
              >
                {classroom}
              </button>
            ))}
          </div>

          {/* Grade Dropdown - muncul ketika showGrades true dan ada grades */}
          {showGrades && grades.length > 0 && (
            <div
              className="w-24 bg-white border-l-0 border border-gray-200 rounded-r-md shadow-lg max-h-48 overflow-y-auto"
              style={{
                filter:
                  "drop-shadow(0px 3px 6px rgba(0, 0, 0, 0.05)) drop-shadow(0px 11px 11px rgba(0, 0, 0, 0.04)) drop-shadow(0px 25px 15px rgba(0, 0, 0, 0.03)) drop-shadow(0px 44px 17px rgba(0, 0, 0, 0.01))",
              }}
            >
              {grades.map((grade) => (
                <button
                  key={grade}
                  type="button"
                  className={`w-full text-center px-2 py-2 text-sm hover:bg-gray-50 first:rounded-tr-md last:rounded-br-md ${
                    selectedGrade === grade ? "bg-[#3399E9] text-white font-semibold" : "text-gray-700"
                  }`}
                  onClick={() => handleGradeClick(grade)}
                >
                  {grade}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CustomBranchingDropdown
