// src/components/shared/dashboard/CustomBranchingDropdown.jsx - Fixed z-index and styling

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
  const [hoveredClassroomIndex, setHoveredClassroomIndex] = useState(-1)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setShowGrades(false)
        setHoveredClassroomIndex(-1)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleClassroomClick = (classroom) => {
    if (classroom !== selectedClassroom) {
      onClassroomSelect(classroom)
    }
    
    if (grades.length > 0) {
      setShowGrades(true)
    } else {
      setIsOpen(false)
      setShowGrades(false)
    }
  }

  const handleClassroomHover = (index) => {
    setHoveredClassroomIndex(index)
    if (grades.length > 0) {
      setShowGrades(true)
    }
  }

  const handleGradeClick = (grade) => {
    if (grade !== selectedGrade) {
      onGradeSelect(grade)
    }
    
    setIsOpen(false)
    setShowGrades(false)
    setHoveredClassroomIndex(-1)
  }

  const handleToggle = () => {
    setIsOpen(!isOpen)
    setShowGrades(false)
    setHoveredClassroomIndex(-1)
  }

  // Calculate grade dropdown position based on hovered classroom
  const getGradeDropdownTop = () => {
    if (hoveredClassroomIndex === -1) return "0px"
    return `${hoveredClassroomIndex * 40}px` // Each classroom item is 40px high
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Trigger */}
      <div
        onClick={handleToggle}
        className="flex gap-1 items-center self-start whitespace-nowrap text-sm border border-gray-200 rounded-md px-3 py-2 hover:bg-gray-50 transition-colors bg-white cursor-pointer"
      >
        <span className="self-stretch my-auto text-gray-700">
          {selectedClassroom && selectedGrade
            ? `${selectedClassroom} - ${selectedGrade}`
            : selectedClassroom || "Kelas"}
        </span>
        <span className="material-icons text-sm text-gray-500">keyboard_arrow_down</span>
      </div>

      {/* Dropdown Container with HIGHEST z-index and portal-like behavior */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 flex z-[999999]" style={{ zIndex: 999999 }}>
          {/* Classroom Dropdown */}
          <div
            className="w-20 bg-white border border-gray-200 rounded-l-md shadow-lg"
            style={{
              filter:
                "drop-shadow(0px 3px 6px rgba(0, 0, 0, 0.05)) drop-shadow(0px 11px 11px rgba(0, 0, 0, 0.04)) drop-shadow(0px 25px 15px rgba(0, 0, 0, 0.03)) drop-shadow(0px 44px 17px rgba(0, 0, 0, 0.01))",
              zIndex: 999999
            }}
          >
            {classrooms.map((classroom, index) => (
              <div
                key={classroom}
                className={`w-full text-center px-3 py-2 text-sm first:rounded-tl-md last:rounded-bl-md transition-colors cursor-pointer h-10 flex items-center justify-center ${
                  selectedClassroom === classroom 
                    ? "bg-[#3399E9] text-white font-semibold" 
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => handleClassroomClick(classroom)}
                onMouseEnter={() => handleClassroomHover(index)}
              >
                {classroom}
              </div>
            ))}
          </div>

          {/* Grade Dropdown - PROPER positioning aligned with hovered classroom */}
          {showGrades && grades.length > 0 && hoveredClassroomIndex !== -1 && (
            <div
              className="w-24 bg-white border-l-0 border border-gray-200 rounded-r-md shadow-lg max-h-48 overflow-y-auto absolute"
              style={{
                left: "80px", // Width of classroom dropdown
                top: getGradeDropdownTop(),
                filter:
                  "drop-shadow(0px 3px 6px rgba(0, 0, 0, 0.05)) drop-shadow(0px 11px 11px rgba(0, 0, 0, 0.04)) drop-shadow(0px 25px 15px rgba(0, 0, 0, 0.03)) drop-shadow(0px 44px 17px rgba(0, 0, 0, 0.01))",
                zIndex: 999999
              }}
            >
              {grades.map((grade) => (
                <button
                  key={grade}
                  type="button"
                  className={`w-full text-center px-2 py-2 text-sm first:rounded-tr-md last:rounded-br-md transition-colors h-10 flex items-center justify-center ${
                    selectedGrade === grade 
                      ? "bg-[#3399E9] text-white font-semibold" 
                      : "text-gray-700 hover:bg-gray-50"
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

      {/* Overlay with HIGHEST z-index */}
      {isOpen && (
        <div 
          className="fixed inset-0"
          style={{ zIndex: 999998 }}
          onClick={() => {
            setIsOpen(false)
            setShowGrades(false)
            setHoveredClassroomIndex(-1)
          }}
        />
      )}
    </div>
  )
}

export default CustomBranchingDropdown