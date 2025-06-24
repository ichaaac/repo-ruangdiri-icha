// src/components/MiniCalendar.jsx

import { useState } from 'react';
import { format, getDaysInMonth, startOfMonth, getDay, setMonth, setYear } from 'date-fns';
import { id } from 'date-fns/locale';

const MiniCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date('2025-06-02'));
  const [selectedDate, setSelectedDate] = useState(new Date('2025-06-02'));
  const [isPickingYearMonth, setIsPickingYearMonth] = useState(false);

  const handleDateClick = (day) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
  };
  
  const changeYear = (amount) => {
    setCurrentDate(prev => setYear(prev, prev.getFullYear() + amount));
  };
  
  const selectMonth = (monthIndex) => {
    setCurrentDate(prev => setMonth(prev, monthIndex));
    setIsPickingYearMonth(false);
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = (getDay(startOfMonth(currentDate)) + 6) % 7;
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth });
  const daysOfWeek = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  return (
    <section className="relative flex flex-col gap-4 p-4 rounded-lg border border-zinc-200 bg-core-surface shadow-sm w-full">
      <div className="flex justify-between items-center px-3 py-2 rounded-md bg-zinc-100 border border-zinc-200">
        <span className="text-base font-semibold text-zinc-800">
          {format(selectedDate, "EEEE, d MMMM yyyy", { locale: id })}
        </span>
        <button onClick={() => setIsPickingYearMonth(!isPickingYearMonth)} className="p-1 rounded hover:bg-zinc-200">
          <span className="material-icons-outlined text-zinc-600">calendar_month</span>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-2 text-center">
        {daysOfWeek.map((day) => <div key={day} className="text-sm font-semibold text-zinc-500">{day}</div>)}
        {emptyDays.map((_, index) => <div key={`empty-${index}`}></div>)}
        {calendarDays.map((day) => {
          const isSelected = day === selectedDate.getDate() && currentDate.getMonth() === selectedDate.getMonth() && currentDate.getFullYear() === selectedDate.getFullYear();
          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm transition-colors ${
                isSelected ? 'bg-primary text-white font-bold' : 'text-zinc-600 hover:bg-primary-light'
              }`}
            >
              {day}
            </button>
          )
        })}
      </div>

      {isPickingYearMonth && (
        <div className="absolute inset-0 bg-core-surface/95 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg animate-fade-in p-4">
          <div className="flex items-center justify-between w-full px-4 mb-4">
            <button onClick={() => changeYear(-1)} className="p-1 rounded-full hover:bg-zinc-200"><span className="material-icons">chevron_left</span></button>
            <span className="text-lg font-bold text-primary">{format(currentDate, 'yyyy')}</span>
            <button onClick={() => changeYear(1)} className="p-1 rounded-full hover:bg-zinc-200"><span className="material-icons">chevron_right</span></button>
          </div>
          <div className="grid grid-cols-4 gap-3 w-full">
            {months.map((month, index) => (
              <button 
                key={month} 
                onClick={() => selectMonth(index)}
                className={`p-2 rounded-md text-sm font-semibold transition-colors ${
                  currentDate.getMonth() === index ? 'bg-primary text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                }`}
              >
                {month}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default MiniCalendar;