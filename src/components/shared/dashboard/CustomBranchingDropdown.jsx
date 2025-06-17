// src/components/shared/dashboard/CustomBranchingDropdown.jsx - Fixed interactions (click-based, not hover)

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
  const [selectedClassroomIndex, setSelectedClassroomIndex] = useState(-1)
  const [dropdownPosition, setDropdownPosition] = useState({ alignRight: false, showAbove: false })
  const dropdownRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setShowGrades(false)
        setSelectedClassroomIndex(-1)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Reset grades when classrooms change
  useEffect(() => {
    if (!isOpen) {
      setShowGrades(false)
      setSelectedClassroomIndex(-1)
    }
  }, [isOpen])

  // Smart positioning calculation
  const calculateDropdownPosition = () => {
    if (!triggerRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Dropdown dimensions
    const classroomWidth = 80
    const gradeWidth = 96
    const totalWidth = classroomWidth + gradeWidth
    const dropdownHeight = classrooms.length * 40
    
    // Check horizontal space
    const spaceRight = viewportWidth - triggerRect.right
    const spaceLeft = triggerRect.left
    const alignRight = spaceRight < totalWidth && spaceLeft > totalWidth
    
    // Check vertical space
    const spaceBelow = viewportHeight - triggerRect.bottom
    const showAbove = spaceBelow < dropdownHeight && triggerRect.top > dropdownHeight
    
    setDropdownPosition({ alignRight, showAbove })
  }

  const handleClassroomClick = (classroom, index) => {
    // Update selected classroom index
    setSelectedClassroomIndex(index)
    
    // Select the classroom
    if (classroom !== selectedClassroom) {
      onClassroomSelect(classroom)
    }
    
    // Show grades if available
    if (grades.length > 0) {
      setShowGrades(true)
    } else {
      // If no grades, close dropdown
      setIsOpen(false)
      setShowGrades(false)
      setSelectedClassroomIndex(-1)
    }
  }

  const handleGradeClick = (grade) => {
    if (grade !== selectedGrade) {
      onGradeSelect(grade)
    }
    
    // Close dropdown after grade selection
    setIsOpen(false)
    setShowGrades(false)
    setSelectedClassroomIndex(-1)
  }

  const handleToggle = () => {
    if (!isOpen) {
      calculateDropdownPosition()
    }
    setIsOpen(!isOpen)
    setShowGrades(false)
    setSelectedClassroomIndex(-1)
  }

  // Calculate grade dropdown position based on selected classroom
  const getGradeDropdownTop = () => {
    if (selectedClassroomIndex === -1) return "0px"
    return `${selectedClassroomIndex * 40}px` // Each classroom item is 40px high
  }

  // Get dropdown container positioning
  const getDropdownContainerStyle = () => {
    const baseStyle = {
      zIndex: 999999,
      position: 'absolute',
    }

    if (dropdownPosition.alignRight) {
      baseStyle.right = 0
      baseStyle.left = 'auto'
    } else {
      baseStyle.left = 0
      baseStyle.right = 'auto'
    }

    if (dropdownPosition.showAbove) {
      baseStyle.bottom = '100%'
      baseStyle.top = 'auto'
      baseStyle.marginBottom = '4px'
    } else {
      baseStyle.top = '100%'
      baseStyle.bottom = 'auto'
      baseStyle.marginTop = '4px'
    }

    return baseStyle
  }

  // Get grade dropdown positioning
  const getGradeDropdownStyle = () => {
    const baseStyle = {
      position: 'absolute',
      top: getGradeDropdownTop(),
      filter: "drop-shadow(0px 3px 6px rgba(0, 0, 0, 0.05)) drop-shadow(0px 11px 11px rgba(0, 0, 0, 0.04)) drop-shadow(0px 25px 15px rgba(0, 0, 0, 0.03)) drop-shadow(0px 44px 17px rgba(0, 0, 0, 0.01))",
      zIndex: 999999
    }

    if (dropdownPosition.alignRight) {
      baseStyle.right = "80px" // Width of classroom dropdown
      baseStyle.left = "auto"
    } else {
      baseStyle.left = "80px" // Width of classroom dropdown
      baseStyle.right = "auto"
    }

    return baseStyle
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Trigger */}
      <div
        ref={triggerRef}
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

      {/* Dropdown Container with SMART positioning */}
      {isOpen && (
        <div 
          className="flex"
          style={getDropdownContainerStyle()}
        >
          {/* Classroom Dropdown */}
          <div
            className={`w-20 bg-white border border-gray-200 shadow-lg ${
              dropdownPosition.alignRight ? 'rounded-r-md' : 'rounded-l-md'
            }`}
            style={{
              filter: "drop-shadow(0px 3px 6px rgba(0, 0, 0, 0.05)) drop-shadow(0px 11px 11px rgba(0, 0, 0, 0.04)) drop-shadow(0px 25px 15px rgba(0, 0, 0, 0.03)) drop-shadow(0px 44px 17px rgba(0, 0, 0, 0.01))",
              zIndex: 999999,
              order: dropdownPosition.alignRight ? 1 : 0
            }}
          >
            {classrooms.map((classroom, index) => (
              <div
                key={classroom}
                className={`w-full text-center px-3 py-2 text-sm transition-colors cursor-pointer h-10 flex items-center justify-center ${
                  index === 0 ? (dropdownPosition.alignRight ? 'rounded-tr-md' : 'rounded-tl-md') : ''
                } ${
                  index === classrooms.length - 1 ? (dropdownPosition.alignRight ? 'rounded-br-md' : 'rounded-bl-md') : ''
                } ${
                  selectedClassroom === classroom 
                    ? "bg-[#3399E9] text-white font-semibold" 
                    : selectedClassroomIndex === index
                    ? "bg-blue-100 text-gray-900"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => handleClassroomClick(classroom, index)}
              >
                {classroom}
              </div>
            ))}
          </div>

          {/* Grade Dropdown - Only shows on CLICK, not hover */}
          {showGrades && grades.length > 0 && selectedClassroomIndex !== -1 && (
            <div
              className={`w-24 bg-white border-l-0 border border-gray-200 shadow-lg max-h-48 overflow-y-auto ${
                dropdownPosition.alignRight ? 'rounded-l-md' : 'rounded-r-md'
              }`}
              style={getGradeDropdownStyle()}
            >
              {grades.map((grade, gradeIndex) => (
                <button
                  key={grade}
                  type="button"
                  className={`w-full text-center px-2 py-2 text-sm transition-colors h-10 flex items-center justify-center ${
                    gradeIndex === 0 ? (dropdownPosition.alignRight ? 'rounded-tl-md' : 'rounded-tr-md') : ''
                  } ${
                    gradeIndex === grades.length - 1 ? (dropdownPosition.alignRight ? 'rounded-bl-md' : 'rounded-br-md') : ''
                  } ${
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
            setSelectedClassroomIndex(-1)
          }}
        />
      )}
    </div>
  )
}

export default CustomBranchingDropdown