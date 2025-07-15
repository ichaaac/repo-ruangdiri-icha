// src/components/shared/schedule/DatePicker.jsx - FIXED DATE FORMATTING

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

// BEST PRACTICE: Utility untuk format tanggal tanpa timezone conversion
const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DatePicker = ({ 
  containerWidth = 335,
  sidebarExpanded = false,
  selectedDate = new Date(),
  selectedDates = [],
  onDateSelect = () => {},
  onWeekSelect = () => {}
}) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [internalSelectedDates, setInternalSelectedDates] = useState([])
  const [isInitialized, setIsInitialized] = useState(false)
  const containerRef = useRef(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // FIXED: Calculate current week (Monday to Sunday) - LOCAL TIMEZONE
  const getCurrentWeekDates = () => {
    const today = new Date();
    console.log('=== DatePicker getCurrentWeekDates ===');
    console.log('Current date for week calculation:', today.toDateString());
    console.log('Today day of week (0=Sunday):', today.getDay());
    
    // Convert Sunday=0 to Monday=0 system
    const dayOfWeek = (today.getDay() + 6) % 7; // Monday=0, Tuesday=1, ..., Sunday=6
    console.log('Day of week (Monday=0):', dayOfWeek);
    
    // Calculate Monday of current week
    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() - dayOfWeek);
    mondayDate.setHours(0, 0, 0, 0);
    console.log('Monday of current week:', mondayDate.toDateString());
    
    // Generate all 7 days starting from Monday
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(mondayDate);
      weekDate.setDate(mondayDate.getDate() + i);
      weekDate.setHours(0, 0, 0, 0);
      weekDates.push(weekDate);
    }
    
    console.log('Current week dates:', weekDates.map((d, i) => `${d.toDateString()} (${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]})`));
    console.log('======================================');
    return weekDates;
  };

  // FIXED: Initialization with proper default current week selection
  useEffect(() => {
    if (!isInitialized) {
      if (selectedDate) {
        setCurrentDate(selectedDate);
        setSelectedYear(selectedDate.getFullYear());
        setSelectedMonth(selectedDate.getMonth());
      }
      
      if (selectedDates && selectedDates.length > 0) {
        console.log('DatePicker: Using provided selectedDates:', selectedDates.map(d => d.toDateString()));
        setInternalSelectedDates(selectedDates);
      } else {
        // FIXED: Default to current week if no selection
        const currentWeekDates = getCurrentWeekDates();
        console.log('DatePicker: Default selecting current week:', currentWeekDates.map(d => d.toDateString()));
        setInternalSelectedDates(currentWeekDates);
        
        // Notify parent components immediately
        onDateSelect(currentWeekDates);
        onWeekSelect(currentWeekDates[0]); // Send Monday as week start
      }
      setIsInitialized(true);
    }
  }, [selectedDate, selectedDates, isInitialized, onDateSelect, onWeekSelect]);

  useEffect(() => {
    if (isInitialized && selectedDates && JSON.stringify(selectedDates) !== JSON.stringify(internalSelectedDates)) {
      console.log('DatePicker: Updating internal selected dates:', selectedDates.map(d => d.toDateString()));
      setInternalSelectedDates(selectedDates);
    }
  }, [selectedDates, isInitialized, internalSelectedDates]);

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

  const baseWidth = 335;
  const baseHeight = 290;
  const actualWidth = Math.min(baseWidth, containerWidth);
  const actualHeight = baseHeight;

  const daysOfWeek = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ]

  // Header text with proper formatting
  const getHeaderText = () => {
    if (internalSelectedDates.length === 0) {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    
    if (internalSelectedDates.length === 1) {
      const date = internalSelectedDates[0];
      return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    }
    
    const sortedDates = [...internalSelectedDates].sort((a, b) => a.getTime() - b.getTime());
    const startDate = sortedDates[0];
    const endDate = sortedDates[sortedDates.length - 1];
    
    if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
      return `${startDate.getDate()}-${endDate.getDate()} ${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`;
    } else if (startDate.getFullYear() === endDate.getFullYear()) {
      return `${startDate.getDate()} ${monthNames[startDate.getMonth()]} - ${endDate.getDate()} ${monthNames[endDate.getMonth()]} ${startDate.getFullYear()}`;
    } else {
      return `${startDate.getDate()} ${monthNames[startDate.getMonth()]} ${startDate.getFullYear()} - ${endDate.getDate()} ${monthNames[endDate.getMonth()]} ${endDate.getFullYear()}`;
    }
  };

  // FIXED: Consistent week calculation (Monday-based) - LOCAL TIMEZONE
  const getWeekDates = (date) => {
    console.log('=== DatePicker getWeekDates ===');
    console.log('Input date:', date.toDateString());
    console.log('Input date day of week (0=Sunday):', date.getDay());
    
    const weekDates = []
    // Convert JS Date.getDay() (Sunday=0) to Monday=0 format
    const dayOfWeek = (date.getDay() + 6) % 7 // Monday=0, Tuesday=1, ..., Sunday=6
    console.log('Day of week (Monday=0):', dayOfWeek);
    
    // Find Monday of the week by going back `dayOfWeek` days
    const mondayDate = new Date(date)
    mondayDate.setDate(date.getDate() - dayOfWeek)
    mondayDate.setHours(0, 0, 0, 0)
    console.log('Monday of the week:', mondayDate.toDateString());
    
    // Generate all 7 days of the week starting from Monday
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(mondayDate)
      weekDate.setDate(mondayDate.getDate() + i)
      weekDate.setHours(0, 0, 0, 0) // Normalize time for consistent comparison
      weekDates.push(weekDate)
    }
    
    console.log('Week dates calculated:', weekDates.map((d, i) => `${d.toDateString()} (${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]})`));
    console.log('===============================');
    return weekDates
  }

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

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)

    // Proper calendar week start calculation (Monday-based)
    const dayOfWeek = (firstDay.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0
    startDate.setDate(startDate.getDate() - dayOfWeek)

    const days = []

    for (let i = 0; i < 35; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      date.setHours(0, 0, 0, 0)

      const isCurrentMonth = date.getMonth() === month
      const isToday = date.getTime() === today.getTime()
      const isSelected = internalSelectedDates.some((selectedDate) => {
        const normalizedSelectedDate = new Date(selectedDate)
        normalizedSelectedDate.setHours(0, 0, 0, 0)
        return normalizedSelectedDate.getTime() === date.getTime()
      })

      const selectionPosition = isSelected ? getSelectionPosition(date, internalSelectedDates) : null

      // Check if today is in selected week for bold styling
      const isTodayInSelectedWeek = internalSelectedDates.length > 0 && 
        internalSelectedDates.some(selectedDate => {
          const weekDates = getWeekDates(selectedDate)
          return weekDates.some(weekDate => weekDate.getTime() === today.getTime())
        })

      days.push({
        date: date.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
        fullDate: new Date(date),
        selectionPosition,
        isTodayInSelectedWeek
      })
    }

    return days
  }

  const calendarDays = generateCalendarDays()

  // FIXED: Handle date click with precise week calculation and detailed logging
  const handleDateClick = (day) => {
    console.log('=== DatePicker handleDateClick ===');
    console.log('Date clicked:', day.fullDate.toDateString());
    console.log('Date clicked day of week (0=Sunday):', day.fullDate.getDay());
    
    const clickedWeekDates = getWeekDates(day.fullDate)
    console.log('Week dates for clicked day:', clickedWeekDates.map((d, i) => `${d.toDateString()} (${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]})`));
    
    // Check if this week is already selected by comparing normalized dates
    const isWeekSelected = clickedWeekDates.every(weekDate => 
      internalSelectedDates.some(selectedDate => {
        const normalizedSelected = new Date(selectedDate)
        const normalizedWeek = new Date(weekDate)
        normalizedSelected.setHours(0, 0, 0, 0)
        normalizedWeek.setHours(0, 0, 0, 0)
        return normalizedSelected.getTime() === normalizedWeek.getTime()
      })
    )
    
    console.log('Is week already selected?', isWeekSelected);
    
    let newSelectedDates = [];
    
    if (isWeekSelected) {
      console.log('Week is already selected, deselecting...');
      // Deselect the week
      newSelectedDates = internalSelectedDates.filter(selectedDate => 
        !clickedWeekDates.some(weekDate => {
          const normalizedSelected = new Date(selectedDate)
          const normalizedWeek = new Date(weekDate)
          normalizedSelected.setHours(0, 0, 0, 0)
          normalizedWeek.setHours(0, 0, 0, 0)
          return normalizedSelected.getTime() === normalizedWeek.getTime()
        })
      );
    } else {
      console.log('Selecting week...');
      // Select the entire week
      newSelectedDates = [...clickedWeekDates];
    }
    
    console.log('New selected dates:', newSelectedDates.map(d => d.toDateString()));
    setInternalSelectedDates(newSelectedDates);
    
    // Notify parent components with proper dates
    onDateSelect(newSelectedDates);
    if (newSelectedDates.length > 0) {
      // Send Monday as week start (first date in our Monday-based week)
      console.log('Sending week start (Monday) to parent:', clickedWeekDates[0].toDateString());
      onWeekSelect(clickedWeekDates[0]); 
    }
    console.log('===================================');
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
    
    // Clear selected dates when changing month/year
    setInternalSelectedDates([])
    onDateSelect([]);
  }

  const handleYearChange = (direction) => {
    setSelectedYear(prev => prev + direction)
  }

  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() - 1)
    setCurrentDate(newDate)
    setSelectedMonth(newDate.getMonth())
    setSelectedYear(newDate.getFullYear())
    
    // Clear selected dates when changing month
    setInternalSelectedDates([])
    onDateSelect([]);
  }

  const handleNextMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + 1)
    setCurrentDate(newDate)
    setSelectedMonth(newDate.getMonth())
    setSelectedYear(newDate.getFullYear())
    
    // Clear selected dates when changing month
    setInternalSelectedDates([])
    onDateSelect([]);
  }

  return (
    <div 
      ref={containerRef}
      className="rounded-md border border-zinc-500 bg-white flex flex-col transition-all duration-300 relative"
      style={{ 
        width: `${actualWidth}px`, 
        height: `${actualHeight}px`,
        padding: '14px 11px 0 11px'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-2 py-2 bg-zinc-100 rounded-md flex-none"
        style={{ 
          width: '312px',
          height: '35px',
          marginLeft: '0',
          marginRight: '0'
        }}
      >
        <button 
          onClick={handlePreviousMonth}
          className="hover:bg-zinc-200 p-1 rounded transition-colors"
          title="Previous Month"
        >
          <span className="material-icons text-[#535353] text-sm">chevron_left</span>
        </button>

        <h3 className="text-sm font-bold text-[#535353] truncate flex-1 text-center">
          {getHeaderText()}
        </h3>

        <button 
          onClick={handleNextMonth}
          className="hover:bg-zinc-200 p-1 rounded transition-colors mr-2"
          title="Next Month"
        >
          <span className="material-icons text-[#535353] text-sm">chevron_right</span>
        </button>

        <button onClick={handleMonthYearClick} className="hover:bg-zinc-200 p-1 rounded transition-colors">
          <span className="material-icons text-[#535353] text-sm">calendar_month</span>
        </button>
      </div>

      {/* Month/Year Picker Modal */}
      <AnimatePresence>
        {showMonthYearPicker && (
          <motion.div 
            className="absolute bg-white border border-zinc-300 rounded-md shadow-lg z-50 p-4"
            style={{
              top: '49px',
              left: '11px',
              right: '11px'
            }}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
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
      <div className="flex-grow flex flex-col px-0 py-2" style={{ marginTop: '10px' }}>
  
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
                  : day.isToday ? (day.isTodayInSelectedWeek ? 'text-[#488BBA] font-black' : 'text-[#488BBA] font-bold')
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
    </div>
  )
}

export default DatePicker