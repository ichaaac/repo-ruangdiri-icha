// src/components/shared/schedule/DatePicker.jsx

import { useState, useEffect } from "react";
import { getCurrentDateInfo } from "@/lib/date";

const DatePicker = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // Get current date info
  const dateInfo = getCurrentDateInfo();

  // Days of week
  const daysOfWeek = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  // Month names in Indonesian
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);

    // Adjust to start from Monday (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = (firstDay.getDay() + 6) % 7;
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const days = [];
    const today = new Date();

    for (let i = 0; i < 35; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = date.getDate() === 2 && isCurrentMonth; // Highlight day 2 as shown in design

      days.push({
        date: date.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
        fullDate: new Date(date)
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  // Group days into weeks
  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const handleDateClick = (day) => {
    if (day.isCurrentMonth) {
      const newDate = new Date(currentDate);
      newDate.setDate(day.date);
      setCurrentDate(newDate);
    }
  };

  const handleMonthYearClick = () => {
    setShowMonthYearPicker(!showMonthYearPicker);
  };

  const handleMonthYearSelect = (month, year) => {
    const newDate = new Date(year, month, 1);
    setCurrentDate(newDate);
    setSelectedMonth(month);
    setSelectedYear(year);
    setShowMonthYearPicker(false);
  };

  const handleYearChange = (direction) => {
    setSelectedYear(prev => prev + direction);
  };

  return (
    <div className="rounded-md border border-zinc-500 bg-white p-3.5">
      <div className="space-y-4">
        {/* Header with date and calendar icon */}
        <div className="flex items-center justify-between px-2.5 py-1.5 bg-zinc-100 rounded-md">
          <h3 className="text-base font-bold text-neutral-600">
            {monthNames[currentDate.getMonth()]}, {currentDate.getDate()} {currentDate.getFullYear()}
          </h3>
          <button
            onClick={handleMonthYearClick}
            className="hover:bg-zinc-200 p-1 rounded transition-colors"
          >
            <span className="material-icons text-neutral-600 text-lg">calendar_month</span>
          </button>
        </div>

        {/* Month/Year Picker Dropdown */}
        {showMonthYearPicker && (
          <div className="absolute z-50 bg-white border border-zinc-300 rounded-md shadow-lg p-4 min-w-[280px]">
            {/* Year selector */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => handleYearChange(-1)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <span className="material-icons">chevron_left</span>
              </button>
              <span className="font-bold text-lg">{selectedYear}</span>
              <button
                onClick={() => handleYearChange(1)}
                className="p-1 hover:bg-gray-100 rounded"
              >
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
                    index === selectedMonth ? 'bg-blue-500 text-white' : 'text-neutral-600'
                  }`}
                >
                  {month.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Calendar */}
        <div className="space-y-5">
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-3.5">
            {daysOfWeek.map(day => (
              <div key={day} className="text-base font-semibold text-center text-neutral-600">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="space-y-5">
            {weeks.slice(0, 5).map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-6">
                {week.map((day, dayIndex) => (
                  <button
                    key={dayIndex}
                    onClick={() => handleDateClick(day)}
                    disabled={!day.isCurrentMonth}
                    className={`
                      w-5 h-5 text-base text-center transition-colors rounded-full
                      ${day.isCurrentMonth
                        ? 'text-neutral-600 hover:bg-blue-100'
                        : 'text-gray-300 cursor-not-allowed'
                      }
                      ${day.isSelected
                        ? 'bg-blue-500 text-white font-bold'
                        : ''
                      }
                      ${day.isToday && !day.isSelected
                        ? 'bg-blue-100 font-bold'
                        : ''
                      }
                    `}
                  >
                    {day.date}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatePicker;
