import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

const DatePicker = ({ 
  containerWidth = 335,
  sidebarExpanded = false,
  selectedDate = new Date(),
  onDateSelect = () => {},
  onWeekSelect = () => {}
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date())
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false)
  const [selectedYear, setSelectedYear] = useState((selectedDate || new Date()).getFullYear())
  const [selectedMonth, setSelectedMonth] = useState((selectedDate || new Date()).getMonth())
  const [selectedDates, setSelectedDates] = useState([])
  const containerRef = useRef(null)

  // Today's date for comparison
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Sync with external selectedDate prop
  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(selectedDate);
      setSelectedYear(selectedDate.getFullYear());
      setSelectedMonth(selectedDate.getMonth());
    }
  }, [selectedDate]);

  // Close month/year picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowMonthYearPicker(false)
      }
    }

    if (showMonthYearPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMonthYearPicker])

  // Base dimensions (Figma: 335x290)
  const baseWidth = 335;
  const baseHeight = 290;
  const actualWidth = Math.min(baseWidth, containerWidth);
  const actualHeight = baseHeight;

  // Days of week
  const daysOfWeek = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]

  // Month names in Indonesian
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ]

  // Day names in Indonesian
  const dayNames = [
    "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"
  ]

  // Get current day name
  const getCurrentDayName = () => {
    return dayNames[currentDate.getDay()];
  }

  // Get all dates in the same week as the given date (Monday to Sunday)
  const getWeekDates = (date) => {
    const weekDates = []
    const dayOfWeek = (date.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0
    
    // Find Monday of the week
    const mondayDate = new Date(date)
    mondayDate.setDate(date.getDate() - dayOfWeek)
    
    // Generate all 7 days of the week
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(mondayDate)
      weekDate.setDate(mondayDate.getDate() + i)
      weekDates.push(weekDate)
    }
    
    return weekDates
  }

  // Get selection position for styling
  const getSelectionPosition = (date, selectedDates) => {
    if (selectedDates.length === 0) return null
    if (selectedDates.length === 1) return "single"

    const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime())
    const dateTime = date.getTime()

    if (dateTime === sortedDates[0].getTime()) return "start"
    if (dateTime === sortedDates[sortedDates.length - 1].getTime()) return "end"

    const isInRange = sortedDates.some((selectedDate) => selectedDate.getTime() === dateTime)
    return isInRange ? "middle" : null
  }

  // Generate calendar days - always show current month's view
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)

    const dayOfWeek = (firstDay.getDay() + 6) % 7
    startDate.setDate(startDate.getDate() - dayOfWeek)

    const days = []

    for (let i = 0; i < 35; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      date.setHours(0, 0, 0, 0) // Normalize time for comparison

      const isCurrentMonth = date.getMonth() === month
      const isToday = date.getTime() === today.getTime()
      const isSelected = selectedDates.some((selectedDate) => {
        const normalizedSelectedDate = new Date(selectedDate)
        normalizedSelectedDate.setHours(0, 0, 0, 0)
        return normalizedSelectedDate.getTime() === date.getTime()
      })

      const selectionPosition = isSelected ? getSelectionPosition(date, selectedDates) : null

      days.push({
        date: date.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
        fullDate: new Date(date),
        selectionPosition,
      })
    }

    return days
  }

  const calendarDays = generateCalendarDays()

  // Handle date click - FIXED CROSS-MONTH WEEK SELECTION
  const handleDateClick = (day) => {
    // For dates not in current month, navigate to that month first but don't select
    if (!day.isCurrentMonth) {
      const newDate = new Date(day.fullDate)
      setCurrentDate(newDate)
      setSelectedYear(newDate.getFullYear())
      setSelectedMonth(newDate.getMonth())
      // Clear any previous selection when navigating
      setSelectedDates([])
      onDateSelect([])
      return
    }
    
    const clickedWeekDates = getWeekDates(day.fullDate)
    
    // Check if this week is already selected
    const isWeekSelected = clickedWeekDates.every(weekDate => 
      selectedDates.some(selectedDate => {
        const normalizedSelected = new Date(selectedDate)
        const normalizedWeek = new Date(weekDate)
        normalizedSelected.setHours(0, 0, 0, 0)
        normalizedWeek.setHours(0, 0, 0, 0)
        return normalizedSelected.getTime() === normalizedWeek.getTime()
      })
    )
    
    let newSelectedDates = [];
    
    if (isWeekSelected) {
      // Deselect the week
      newSelectedDates = selectedDates.filter(selectedDate => 
        !clickedWeekDates.some(weekDate => {
          const normalizedSelected = new Date(selectedDate)
          const normalizedWeek = new Date(weekDate)
          normalizedSelected.setHours(0, 0, 0, 0)
          normalizedWeek.setHours(0, 0, 0, 0)
          return normalizedSelected.getTime() === normalizedWeek.getTime()
        })
      );
    } else {
      // Select the entire week
      newSelectedDates = clickedWeekDates;
    }
    
    setSelectedDates(newSelectedDates);
    
    // IMPORTANT FIX: Don't change currentDate/month view when selecting dates
    // Keep the calendar view stable in the current month
    // Only update the internal date for display purposes, not the view
    
    // Notify parent components
    onDateSelect(newSelectedDates);
    if (newSelectedDates.length > 0) {
      onWeekSelect(clickedWeekDates[0]); // Send Monday as week start
    }
  }

  const handleMonthYearClick = () => {
    setShowMonthYearPicker(!showMonthYearPicker)
  }

  const handleMonthYearSelect = (month, year) => {
    const newDate = new Date(year, month, 1)
    setCurrentDate(newDate)
    setSelectedMonth(month)
    setSelectedYear(year)
    setShowMonthYearPicker(false)
    setSelectedDates([])
    
    // Notify parent of date change
    onDateSelect([]);
  }

  const handleYearChange = (direction) => {
    setSelectedYear(prev => prev + direction)
  }

  // Handle navigation arrows
  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() - 1)
    setCurrentDate(newDate)
    setSelectedMonth(newDate.getMonth())
    setSelectedYear(newDate.getFullYear())
    // Keep selected dates when navigating
  }

  const handleNextMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + 1)
    setCurrentDate(newDate)
    setSelectedMonth(newDate.getMonth())
    setSelectedYear(newDate.getFullYear())
    // Keep selected dates when navigating
  }

  return (
    <div 
      ref={containerRef}
      className="rounded-md border border-zinc-500 bg-white flex flex-col transition-all duration-300 relative"
      style={{ 
        width: `${actualWidth}px`, 
        height: `${actualHeight}px`
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2 bg-zinc-100 rounded-t-md flex-none">
        {/* Navigation Arrows */}
        <button 
          onClick={handlePreviousMonth}
          className="hover:bg-zinc-200 p-1 rounded transition-colors"
          title="Previous Month"
        >
          <span className="material-icons text-neutral-600 text-sm">chevron_left</span>
        </button>

        <h3 className="text-sm font-bold text-neutral-600 truncate flex-1 text-center">
          {getCurrentDayName()}, {currentDate.getDate()} {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>

        <button 
          onClick={handleNextMonth}
          className="hover:bg-zinc-200 p-1 rounded transition-colors mr-2"
          title="Next Month"
        >
          <span className="material-icons text-neutral-600 text-sm">chevron_right</span>
        </button>

        <button onClick={handleMonthYearClick} className="hover:bg-zinc-200 p-1 rounded transition-colors">
          <span className="material-icons text-neutral-600 text-sm">calendar_month</span>
        </button>
      </div>

      {/* Month/Year Picker Modal */}
      <AnimatePresence>
        {showMonthYearPicker && (
          <motion.div 
            className="absolute bg-white border border-zinc-300 rounded-md shadow-lg z-50 p-4"
            style={{
              top: '45px',
              left: '8px',
              right: '8px'
            }}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Year selector */}
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => handleYearChange(-1)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <span className="material-icons text-sm">chevron_left</span>
              </button>
              <span className="font-semibold">{selectedYear}</span>
              <button 
                onClick={() => handleYearChange(1)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <span className="material-icons text-sm">chevron_right</span>
              </button>
            </div>
            
            {/* Month grid */}
            <div className="grid grid-cols-3 gap-2">
              {monthNames.map((month, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleMonthYearSelect(index, selectedYear)}
                  className={`p-2 text-xs rounded hover:bg-blue-100 ${
                    index === selectedMonth && selectedYear === currentDate.getFullYear()
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {month.slice(0, 3)}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
  
      {/* Calendar Content */}
      <div className="flex-grow flex flex-col px-2 py-2">
  
        {/* Days of week */}
        <div className="grid grid-cols-7 mb-1">
          {daysOfWeek.map((day) => (
            <div key={day} className="text-[10px] text-center font-semibold text-neutral-600">
              {day}
            </div>
          ))}
        </div>
  
        {/* Calendar dates */}
        <div className="grid grid-rows-5 grid-cols-7 flex-grow">
          {calendarDays.map((day, i) => (
            <div key={i} className="relative flex items-center justify-center">
  
              {/* Background highlight pill for selected dates */}
              {day.isSelected && (
                <div className={`
                  absolute z-0
                  ${day.selectionPosition === 'single' 
                    ? 'top-1/2 left-1/2 w-[60%] h-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full'
                    : day.selectionPosition === 'start' 
                      ? 'top-1/2 -translate-y-1/2 left-[20%] right-0 h-[60%] rounded-l-full'
                      : day.selectionPosition === 'end'
                        ? 'top-1/2 -translate-y-1/2 left-0 right-[20%] h-[60%] rounded-r-full'
                        : 'top-1/2 -translate-y-1/2 left-0 right-0 h-[60%]'}
                  bg-[#488BBA]
                `} />
              )}

              {/* Background for today's date */}
              {day.isToday && !day.isSelected && (
                <div className="absolute z-0 top-1/2 left-1/2 w-[60%] h-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#488BBA] opacity-30" />
              )}
  
              <button
                onClick={() => handleDateClick(day)}
                className={`relative z-10 w-full h-full flex items-center justify-center text-xs transition-colors 
                  ${day.isSelected ? 'text-white font-bold' 
                  : day.isToday ? 'text-[#488BBA] font-bold'
                  : day.isCurrentMonth ? 'text-neutral-600 hover:bg-gray-100' 
                  : 'text-gray-300 hover:bg-gray-50'}
                `}
              >
                {day.date}
              </button>
  
            </div>
          ))}
        </div>
      </div>

      {/* Week Selection Info */}
      {selectedDates.length > 0 && (
        <div className="px-2 py-1 text-xs text-center text-[#488BBA] bg-gray-50 rounded-b-md">
          {selectedDates.length} hari dipilih
        </div>
      )}
    </div>
  )
}

export default DatePicker