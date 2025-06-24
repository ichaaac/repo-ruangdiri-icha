// src/components/shared/schedule/DatePicker.jsx

import { useState } from "react"

const DatePicker = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedDates, setSelectedDates] = useState([]) // Array to store multiple selected dates
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const [dragEnd, setDragEnd] = useState(null)

  // Days of week
  const daysOfWeek = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]

  // Month names in Indonesian
  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ]

  // Get week number for a date
  const getWeekNumber = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDayOfMonth = new Date(year, month, 1)
    const dayOfWeek = (firstDayOfMonth.getDay() + 6) % 7 // Adjust for Monday start
    const dayOfMonth = date.getDate()
    return Math.floor((dayOfMonth + dayOfWeek - 1) / 7)
  }

  // Check if two dates are in the same week
  const isSameWeek = (date1, date2) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      getWeekNumber(date1) === getWeekNumber(date2)
    )
  }

  // Get day of week (0 = Monday, 6 = Sunday)
  const getDayOfWeek = (date) => {
    return (date.getDay() + 6) % 7
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

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)

    // Adjust to start from Monday (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = (firstDay.getDay() + 6) % 7
    startDate.setDate(startDate.getDate() - dayOfWeek)

    const days = []
    const today = new Date()

    for (let i = 0; i < 35; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)

      const isCurrentMonth = date.getMonth() === month
      const isToday = date.toDateString() === today.toDateString()
      const isSelected = selectedDates.some((selectedDate) => selectedDate.toDateString() === date.toDateString())

      // Check if date is in drag range
      let isInDragRange = false
      const dragRangeDates = []
      if (isDragging && dragStart && dragEnd) {
        const dragStartTime = dragStart.getTime()
        const dragEndTime = dragEnd.getTime()
        const dateTime = date.getTime()
        isInDragRange =
          dateTime >= Math.min(dragStartTime, dragEndTime) &&
          dateTime <= Math.max(dragStartTime, dragEndTime) &&
          isSameWeek(date, dragStart)

        // Create drag range dates for position calculation
        if (isInDragRange) {
          let currentTime = Math.min(dragStartTime, dragEndTime)
          const endTime = Math.max(dragStartTime, dragEndTime)
          while (currentTime <= endTime) {
            const tempDate = new Date(currentTime)
            if (isSameWeek(tempDate, dragStart)) {
              dragRangeDates.push(new Date(tempDate))
            }
            currentTime += 24 * 60 * 60 * 1000
          }
        }
      }

      const finalSelected = isSelected || isInDragRange
      const finalSelectedDates = isInDragRange ? dragRangeDates : selectedDates
      const selectionPosition = finalSelected ? getSelectionPosition(date, finalSelectedDates) : null

      days.push({
        date: date.getDate(),
        isCurrentMonth,
        isToday,
        isSelected: finalSelected,
        fullDate: new Date(date),
        isInDragRange,
        selectionPosition,
      })
    }

    return days
  }

  const calendarDays = generateCalendarDays()

  // Group days into weeks
  const weeks = []
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7))
  }
  const handleMouseDown = (day) => {
    if (!day.isCurrentMonth) return;
    setSelectedDates([]); 
    setIsDragging(true);
    setDragStart(day.fullDate);
    setDragEnd(day.fullDate);
  };
  
  const handleMouseEnter = (day) => {
    if (!isDragging || !day.isCurrentMonth) return;
    
    if (!isSameWeek(dragStart, day.fullDate)) return;
  
    setDragEnd(day.fullDate);
  };
  
  const handleMouseUp = () => {
    if (!isDragging || !dragStart || !dragEnd) {
      resetDrag();
      return;
    }
  
    const startTime = Math.min(dragStart.getTime(), dragEnd.getTime());
    const endTime = Math.max(dragStart.getTime(), dragEnd.getTime());
    const newSelectedDates = [];
  
    let currentTime = startTime;
    while (currentTime <= endTime) {
      const tempDate = new Date(currentTime);
      if (isSameWeek(dragStart, tempDate)) {
        newSelectedDates.push(new Date(tempDate));
      }
      currentTime += 24 * 60 * 60 * 1000;
    }
  
    setSelectedDates(newSelectedDates);
    resetDrag();
  };
  
  const resetDrag = () => {
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };
  

  const handleMonthYearClick = () => {
    setShowMonthYearPicker(!showMonthYearPicker)
  }

  const handleMonthYearSelect = (month, year) => {
    const newDate = new Date(year, month, 1)
    setCurrentDate(newDate)
    setSelectedMonth(month)
    setSelectedYear(year)
    setShowMonthYearPicker(false)
    // Clear selection when changing month/year
    setSelectedDates([])
  }

  const handleYearChange = (direction) => {
    setSelectedYear((prev) => prev + direction)
  }

  // Get border radius class based on selection position
  const getBorderRadiusClass = (position) => {
    switch (position) {
      case "single":
        return "rounded-full"
      case "start":
        return "rounded-l-full"
      case "end":
        return "rounded-r-full"
      case "middle":
        return ""
      default:
        return ""
    }
  }

  return (
    <div className="rounded-md border border-zinc-500 bg-white p-3.5">
      <div className="space-y-4">
        {/* Header with date and calendar icon */}
        <div className="flex items-center justify-between px-2.5 py-1.5 bg-zinc-100 rounded-md">
          <h3 className="text-base font-bold text-neutral-600">
            {monthNames[currentDate.getMonth()]}, {currentDate.getFullYear()}
          </h3>
          <button onClick={handleMonthYearClick} className="hover:bg-zinc-200 p-1 rounded transition-colors">
            <span className="material-icons text-neutral-600 text-lg">calendar_month</span>
          </button>
        </div>

        {/* Month/Year Picker Dropdown */}
        {showMonthYearPicker && (
          <div className="absolute z-50 bg-white border border-zinc-300 rounded-md shadow-lg p-4 min-w-[280px]">
            {/* Year selector */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => handleYearChange(-1)} className="p-1 hover:bg-gray-100 rounded">
                <span className="material-icons">chevron_left</span>
              </button>
              <span className="font-bold text-lg">{selectedYear}</span>
              <button onClick={() => handleYearChange(1)} className="p-1 hover:bg-gray-100 rounded">
                <span className="material-icons">chevron_right</span>
              </button>
            </div>

            {/* Month grid */}
            <div className="grid grid-cols-3 gap-2">
              {monthNames.map((month, index) => (
                <button
                  key={month}
                  onClick={() => handleMonthYearSelect(index, selectedYear)}
                  className={`p-2 text-sm rounded hover:bg-blue-100 transition-colors ${
                    index === selectedMonth ? "bg-blue-500 text-white" : "text-neutral-600"
                  }`}
                >
                  {month.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Calendar */}
        <div className="space-y-5" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-3">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-base font-semibold text-center text-neutral-600">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="space-y-3">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7">
                  {week.map((day, dayIndex) => (
                    <div key={dayIndex} className="relative">
                      
                      {day.isSelected && (
                        <div className={`
                          absolute z-0
                          ${day.selectionPosition === 'single' 
                            ? 'top-1/2 left-1/2 w-[32px] h-[32px] -translate-x-1/2 -translate-y-1/2 rounded-full'
                            : day.selectionPosition === 'start' 
                              ? 'top-1/2 -translate-y-1/2 left-[30%] right-0 h-[32px] rounded-l-full'
                              : day.selectionPosition === 'end'
                                ? 'top-1/2 -translate-y-1/2 left-0 right-[30%] h-[32px] rounded-r-full'
                                : 'top-1/2 -translate-y-1/2 left-0 right-0 h-[32px]'
                          }
                          bg-[#488BBA]
                        `} />
                      )}
                      <button
                        onMouseDown={() => handleMouseDown(day)}
                        onMouseEnter={() => handleMouseEnter(day)}
                        className={`relative z-10 w-full h-[50px] flex items-center justify-center text-sm transition-colors 
                          ${day.isSelected ? 'text-white font-bold' 
                          : day.isCurrentMonth ? 'text-neutral-600' 
                          : 'text-gray-300 cursor-not-allowed'}`}
                      >
                        {/* Background highlight absolute layer */}
                        {day.isToday && !day.isSelected && (
                          <div className="absolute top-1/2 left-1/2 w-[32px] h-[32px] bg-blue-100 rounded-full -translate-x-1/2 -translate-y-1/2 z-0" />
                        )}
                        <span className="relative z-10">{day.date}</span>
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>

        </div>
      </div>
    </div>
  )
}

export default DatePicker
