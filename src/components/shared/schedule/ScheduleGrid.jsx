// src/comp[o]nents/shared/schedule/ScheduleGrid.jsx

import { useState, useEffect, useRef, useMemo, useCallback } from "react";

const ScheduleGrid = ({ 
  onTimeSlotSelect, 
  onScheduleClick,
  containerWidth = 808,
  sidebarExpanded = false,
  selectedDates = [],
  schedules = [],
  loading = false,
  getScheduleAtTime
}) => {
  const [selectedArea, setSelectedArea] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragTimer, setDragTimer] = useState(null);
  
  const viewportRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastMousePosRef = useRef(null);
  const dragStartTimeRef = useRef(null);

  // Constants
  const baseWidth = 808;
  const baseHeight = 254;
  const actualWidth = Math.max(baseWidth, containerWidth);
  const actualHeight = baseHeight;
  const HOUR_WIDTH = 80;
  const DAY_ROW_HEIGHT = 50;
  const TIME_HEADER_HEIGHT = 30;
  const DAY_COLUMN_WIDTH = 70;
  const HEADER_HEIGHT = 66;
  const GRID_CONTENT_HEIGHT = actualHeight - HEADER_HEIGHT;
  const DRAG_THRESHOLD = 5;
  const CLICK_TIMEOUT = 150;

  // Static data
  const days = useMemo(() => [
    { short: "Sen", full: "Senin" }, { short: "Sel", full: "Selasa" },
    { short: "Rab", full: "Rabu" }, { short: "Kam", full: "Kamis" },
    { short: "Jum", full: "Jumat" }, { short: "Sab", full: "Sabtu" },
    { short: "Min", full: "Minggu" }
  ], []);

const timeSlots = useMemo(() => {
  const slots = [];
  for (let i = 6; i <= 24; i++) {
    slots.push(`${(i % 24).toString().padStart(2, '0')}:00`);
  }
  return slots;
}, []);


  // Helper functions
  const getTypeColor = useCallback((type) => {
    const colors = {
      counseling: "#9986FF",
      class: "#3CE69E", 
      seminar: "#FF886D",
      meeting: "#3399E9",
      other: "#979797"
    };
    return colors[type] || colors.other;
  }, []);

  const getTimezoneDisplay = useCallback((timezone) => {
    const timezoneMap = {
      "Asia/Jakarta": "WIB",
      "Asia/Makassar": "WITA", 
      "Asia/Jayapura": "WIT"
    };
    return timezoneMap[timezone] || "WIB";
  }, []);

  const getHourDisplayIndex = useCallback((hour) => {
    return Math.max(0, Math.min(15, hour - 6));
  }, []);

  const getActualHour = useCallback((index) => {
    if (index >= 0 && index <= 15) return (index + 6) % 24;
    return 6;
  }, []);

const TIME_HEADER_OFFSET = 25;

const halfHourDividers = useMemo(() => {
  const dividers = [];
  for (let i = 0; i < timeSlots.length; i++) { 
    const position = i * HOUR_WIDTH + HOUR_WIDTH / 2 + TIME_HEADER_OFFSET;
    dividers.push({ position, hourIndex: i });
  }
  return dividers;
}, [timeSlots.length]);



  const timeToPosition = useCallback((timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const hourIndex = getHourDisplayIndex(hours);
    const basePosition = hourIndex * HOUR_WIDTH;
    const minuteOffset = (minutes / 60) * HOUR_WIDTH;
    return basePosition + minuteOffset;
  }, [getHourDisplayIndex]);

  const calculateEventWidth = useCallback((startTime, endTime) => {
    const startPos = timeToPosition(startTime);
    const endPos = timeToPosition(endTime);
    return Math.max(endPos - startPos, 40);
  }, [timeToPosition]);

  // Convert backend schedule data to display format
  const getScheduleToDisplay = useMemo(() => {
    const scheduleData = {};
    
    days.forEach(day => {
      scheduleData[day.full] = [];
    });

    schedules.forEach(schedule => {
      const scheduleDate = new Date(schedule.startDateTime);
      const dayName = days[scheduleDate.getDay()]?.full;
      
      if (dayName) {
        if (selectedDates.length > 0) {
          const isDateSelected = selectedDates.some(date => 
            date.toDateString() === scheduleDate.toDateString()
          );
          if (!isDateSelected) return;
        }

        const displaySchedule = {
          id: schedule.id,
          name: schedule.agenda || schedule.displayName || "No Title",
          startTime: new Date(schedule.startDateTime).toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          endTime: new Date(schedule.endDateTime).toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          platform: schedule.location || "Location",
          type: schedule.type || "other",
          color: getTypeColor(schedule.type),
          timezone: schedule.timezone || "Asia/Jakarta",
          timezoneDisplay: getTimezoneDisplay(schedule.timezone),
          participants: schedule.participants || [],
          originalData: schedule
        };

        scheduleData[dayName].push(displaySchedule);
      }
    });

    return scheduleData;
  }, [schedules, selectedDates, days, getTypeColor, getTimezoneDisplay]);

  // Check if time slot is occupied
  const isTimeSlotOccupied = useCallback((dayIndex, hour, minute = 0) => {
    const dayName = days[dayIndex]?.full;
    if (!dayName || !getScheduleToDisplay[dayName]) return false;

    const currentTimeInMinutes = hour * 60 + minute;
    
    return getScheduleToDisplay[dayName].some(event => {
      const [startHour, startMinute] = event.startTime.split(':').map(Number);
      const [endHour, endMinute] = event.endTime.split(':').map(Number);
      
      const eventStartMinutes = startHour * 60 + startMinute;
      const eventEndMinutes = endHour * 60 + endMinute;
      
      return currentTimeInMinutes >= eventStartMinutes && currentTimeInMinutes < eventEndMinutes;
    });
  }, [days, getScheduleToDisplay]);

  const isTimeRangeOccupied = useCallback((dayIndex, startHour, endHour, startMinute = 0, endMinute = 0) => {
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;
    
    for (let minutes = startTimeInMinutes; minutes < endTimeInMinutes; minutes += 5) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      if (isTimeSlotOccupied(dayIndex, hour, minute)) {
        return true;
      }
    }
    return false;
  }, [isTimeSlotOccupied]);

  const getCurrentTimePosition = useCallback(() => {
    const now = currentTime;
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const startHour = 6; 
    const hourOffset = hour - startHour;
    const minuteOffset = (minutes / 60);
    const totalOffset = hourOffset + minuteOffset;
    return totalOffset * HOUR_WIDTH;
  }, [currentTime]);

  const getCurrentTimeString = useCallback(() => {
    const now = currentTime;
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }, [currentTime]);

  const getInfoFromPosition = useCallback((clientX, clientY) => {
    if (!viewportRef.current) return null;
    
    const rect = viewportRef.current.getBoundingClientRect();
    const scrollLeft = viewportRef.current.scrollLeft;
    const scrollTop = viewportRef.current.scrollTop;

    const absoluteX = clientX - rect.left + scrollLeft;
    const absoluteY = clientY - rect.top + scrollTop;

    const gridX = absoluteX - DAY_COLUMN_WIDTH;
    const gridY = absoluteY - TIME_HEADER_HEIGHT;

    if (gridX < 0 || gridY < 0) return null;

    const hourIndex = Math.floor(gridX / HOUR_WIDTH);
    const dayIndex = Math.floor(gridY / DAY_ROW_HEIGHT);

    if (hourIndex < 0 || hourIndex >= timeSlots.length || dayIndex < 0 || dayIndex >= days.length) {
      return null;
    }

    const actualHour = getActualHour(hourIndex);
    const pixelWithinHour = gridX % HOUR_WIDTH;
    const minuteWithinHour = Math.floor((pixelWithinHour / HOUR_WIDTH) * 60);
    const actualMinute = Math.floor(minuteWithinHour / 5) * 5;
    
    const exactPixelX = gridX;
    const exactPixelY = gridY;
    
    return { 
      hour: actualHour, 
      minute: actualMinute,
      hourIndex, 
      dayIndex,
      exactPixelX,
      exactPixelY
    };
  }, [getActualHour, days.length, timeSlots.length]);

  const clearDragState = useCallback(() => {
    setIsDragging(false);
    setIsMouseDown(false);
    setSelectedArea(null);
    setDragStartPos(null);
    lastMousePosRef.current = null;
    dragStartTimeRef.current = null;
    
    if (dragTimer) {
      clearTimeout(dragTimer);
      setDragTimer(null);
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [dragTimer]);

  // Handle schedule click with proper event stopping
  const handleScheduleClick = useCallback((event, scheduleData) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!isDragging && !isMouseDown) {
      console.log('Schedule clicked:', scheduleData);
      onScheduleClick && onScheduleClick(scheduleData.originalData || scheduleData);
    }
  }, [isDragging, isMouseDown, onScheduleClick]);

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.schedule-event')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    
    const info = getInfoFromPosition(e.clientX, e.clientY);
    
    if (info && info.dayIndex >= 0 && info.dayIndex < days.length) {
      if (isTimeSlotOccupied(info.dayIndex, info.hour, info.minute)) {
        return;
      }

      setIsMouseDown(true);
      setDragStartPos({ x: e.clientX, y: e.clientY });
      dragStartTimeRef.current = Date.now();
      
      const timer = setTimeout(() => {
        if (isMouseDown) {
          setIsDragging(true);
          setSelectedArea({
            startDay: info.dayIndex, 
            endDay: info.dayIndex,
            startHour: info.hour,
            endHour: info.hour,
            startMinute: info.minute,
            endMinute: info.minute,
            startHourIndex: info.hourIndex,
            endHourIndex: info.hourIndex,
            startPixelX: info.exactPixelX,
            endPixelX: info.exactPixelX,
            startPixelY: info.exactPixelY,
            endPixelY: info.exactPixelY
          });
          lastMousePosRef.current = `${info.dayIndex}-${info.hourIndex}-${info.minute}`;
        }
      }, CLICK_TIMEOUT);
      
      setDragTimer(timer);
    }
  }, [getInfoFromPosition, days, isTimeSlotOccupied, isMouseDown]);

  const handleMouseMove = useCallback((e) => {
    if (!isMouseDown) return;

    const dragDistance = dragStartPos ? Math.sqrt(
      Math.pow(e.clientX - dragStartPos.x, 2) + Math.pow(e.clientY - dragStartPos.y, 2)
    ) : 0;

    if (!isDragging && dragDistance > DRAG_THRESHOLD) {
      if (dragTimer) {
        clearTimeout(dragTimer);
        setDragTimer(null);
      }
      setIsDragging(true);
      
      const info = getInfoFromPosition(dragStartPos.x, dragStartPos.y);
      if (info) {
        setSelectedArea({
          startDay: info.dayIndex, 
          endDay: info.dayIndex,
          startHour: info.hour,
          endHour: info.hour,
          startMinute: info.minute,
          endMinute: info.minute,
          startHourIndex: info.hourIndex,
          endHourIndex: info.hourIndex,
          startPixelX: info.exactPixelX,
          endPixelX: info.exactPixelX,
          startPixelY: info.exactPixelY,
          endPixelY: info.exactPixelY
        });
      }
    }

    if (isDragging) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const info = getInfoFromPosition(e.clientX, e.clientY);
        if (info && info.dayIndex >= 0 && info.dayIndex < days.length) {
          const currentPos = `${info.dayIndex}-${info.hourIndex}-${info.minute}`;
          if (lastMousePosRef.current !== currentPos) {
            lastMousePosRef.current = currentPos;
            setSelectedArea(prev => ({ 
              ...prev, 
              endDay: info.dayIndex, 
              endHour: info.hour,
              endMinute: info.minute,
              endHourIndex: info.hourIndex,
              endPixelX: info.exactPixelX,
              endPixelY: info.exactPixelY
            }));
          }
        }
      });
    }
  }, [isMouseDown, isDragging, dragStartPos, dragTimer, getInfoFromPosition, days.length]);

  const handleMouseUp = useCallback((e) => {
    if (dragTimer) {
      clearTimeout(dragTimer);
      setDragTimer(null);
    }

    if (!isMouseDown) return;

    const wasClick = !isDragging && dragStartTimeRef.current && 
                    (Date.now() - dragStartTimeRef.current) < CLICK_TIMEOUT;

    if (wasClick && dragStartPos) {
      const info = getInfoFromPosition(dragStartPos.x, dragStartPos.y);
      if (info && info.dayIndex >= 0 && info.dayIndex < days.length) {
        if (!isTimeSlotOccupied(info.dayIndex, info.hour, info.minute)) {
          const today = new Date();
          const startDateTime = new Date(today);
          startDateTime.setHours(info.hour, info.minute, 0, 0);
          
          const endDateTime = new Date(today);
          endDateTime.setHours(info.hour, info.minute + 5, 0, 0);

          const dayName = days[info.dayIndex]?.full;

          onTimeSlotSelect && onTimeSlotSelect({ 
            startDateTime, 
            endDateTime, 
            day: dayName,
            isMultipleDays: false,
            dates: [{
              date: today.toISOString().split('T')[0],
              startTime: `${info.hour.toString().padStart(2, '0')}:${info.minute.toString().padStart(2, '0')}`,
              endTime: `${info.hour.toString().padStart(2, '0')}:${(info.minute + 5).toString().padStart(2, '0')}`,
              timezone: 'Asia/Jakarta'
            }],
            draggedDays: 1
          });
        }
      }
    } else if (isDragging && selectedArea && dragStartPos) {
      const dragDistance = Math.sqrt(
        Math.pow(e.clientX - dragStartPos.x, 2) + Math.pow(e.clientY - dragStartPos.y, 2)
      );
      
      if (dragDistance >= DRAG_THRESHOLD) {
        const startHour = Math.min(selectedArea.startHour, selectedArea.endHour);
        const endHour = Math.max(selectedArea.startHour, selectedArea.endHour);
        const startMinute = Math.min(selectedArea.startMinute || 0, selectedArea.endMinute || 0);
        const endMinute = Math.max(selectedArea.startMinute || 0, selectedArea.endMinute || 0);
        const startDay = Math.min(selectedArea.startDay, selectedArea.endDay);
        const endDay = Math.max(selectedArea.startDay, selectedArea.endDay);

        let finalEndHour = endHour;
        let finalEndMinute = endMinute + 5;
        if (finalEndMinute >= 60) {
          finalEndHour = endHour + 1;
          finalEndMinute = finalEndMinute - 60;
        }

        let hasConflict = false;
        for (let day = startDay; day <= endDay; day++) {
          if (isTimeRangeOccupied(day, startHour, finalEndHour, startMinute, finalEndMinute)) {
            hasConflict = true;
            break;
          }
        }

        if (!hasConflict && startDay >= 0 && startDay < days.length) {
          const today = new Date();
          const startDateTime = new Date(today);
          startDateTime.setHours(startHour, startMinute, 0, 0);
          
          const endDateTime = new Date(today);
          endDateTime.setHours(finalEndHour, finalEndMinute, 0, 0);

          const dayName = days[startDay]?.full;
          const isMultipleDays = startDay !== endDay;

          const dates = [];
          for (let dayIndex = startDay; dayIndex <= endDay; dayIndex++) {
            const dayDate = new Date(today);
            dayDate.setDate(today.getDate() + (dayIndex - today.getDay()));
            
            dates.push({
              date: dayDate.toISOString().split('T')[0],
              startTime: `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`,
              endTime: `${finalEndHour.toString().padStart(2, '0')}:${finalEndMinute.toString().padStart(2, '0')}`,
              timezone: 'Asia/Jakarta'
            });
          }

          onTimeSlotSelect && onTimeSlotSelect({ 
            startDateTime, 
            endDateTime, 
            day: dayName,
            isMultipleDays,
            dates,
            draggedDays: endDay - startDay + 1
          });
        }
      }
    }
    
    clearDragState();
  }, [isMouseDown, isDragging, selectedArea, dragStartPos, dragTimer, days, onTimeSlotSelect, isTimeRangeOccupied, getInfoFromPosition, clearDragState]);

  const handleScroll = useCallback((e) => {
    const newScrollLeft = e.target.scrollLeft;
    setScrollLeft(newScrollLeft);
  }, []);

  // Selection box rendering
  const selectionBox = useMemo(() => {
    if (!selectedArea || !isDragging) return null;

    const startDayIndex = Math.min(selectedArea.startDay, selectedArea.endDay);
    const endDayIndex = Math.max(selectedArea.startDay, selectedArea.endDay);
    
    const startPixelX = Math.min(selectedArea.startPixelX || 0, selectedArea.endPixelX || 0);
    const endPixelX = Math.max(selectedArea.startPixelX || 0, selectedArea.endPixelX || 0);

    const top = startDayIndex * DAY_ROW_HEIGHT;
    const height = (endDayIndex - startDayIndex + 1) * DAY_ROW_HEIGHT;
    const left = startPixelX;
    const width = Math.max(endPixelX - startPixelX, 10);

    return (
      <div
        className="absolute bg-blue-400/20 border-2 border-blue-500 rounded-sm pointer-events-none"
        style={{ top, left, width, height, zIndex: 50 }}
      />
    );
  }, [selectedArea, isDragging]);

  // Effects
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollLeft = 0;
      viewportRef.current.scrollTop = 0;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (dragTimer) {
        clearTimeout(dragTimer);
      }
    };
  }, [dragTimer]);

  // Global mouse events
  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMouseMove(e);
    const handleGlobalMouseUp = (e) => handleMouseUp(e);

    if (isMouseDown) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isMouseDown, handleMouseMove, handleMouseUp]);

  return (
    <div 
      className="rounded-md border border-zinc-400 bg-white select-none transition-all duration-300"
      style={{ 
        width: `${actualWidth}px`, 
        height: `${actualHeight}px`,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div className="flex items-center px-5 py-3 border-b border-zinc-200" style={{ height: `${HEADER_HEIGHT}px` }}>
        <div className="flex items-center">
          <div className="w-[30px] h-[30px] bg-[#488BBA] rounded flex items-center justify-center">
            <span className="material-icons text-white text-lg">calendar_month</span>
          </div>
          <h2 className="text-xl font-semibold text-[#488BBA]" style={{ marginLeft: '15px' }}>
            Jadwal
          </h2>
        </div>
        {loading && (
          <div className="ml-auto text-sm text-gray-500">Loading...</div>
        )}
      </div>

      {/* Grid Container */}
      <div className="relative overflow-hidden" style={{ height: `${GRID_CONTENT_HEIGHT}px` }}>
        
        {/* Fixed Time Header - SHIFTED LEFT */}
        <div 
          className="absolute top-0 bg-white border-b border-zinc-200"
          style={{ 
            left: `${DAY_COLUMN_WIDTH - 15}px`, // Shifted 10px left
            right: '0px',
            height: `${TIME_HEADER_HEIGHT}px`,
            overflow: 'hidden',
            zIndex: 10
          }}
        >
          <div className="h-full" style={{ overflow: 'hidden' }}>
            <div 
              className="flex relative h-full"
              style={{ 
                width: `${timeSlots.length * HOUR_WIDTH}px`,
                minWidth: `${timeSlots.length * HOUR_WIDTH}px`, 
                transform: `translateX(-${scrollLeft}px)`
              }}
            >
              {timeSlots.map((time, i) => (
                <div 
                  key={time} 
                  className="flex-shrink-0 relative"
                  style={{ width: `${HOUR_WIDTH}px`, height: `${TIME_HEADER_HEIGHT}px` }}
                >
                  <span className="text-sm text-neutral-600 absolute top-1/2 transform -translate-y-1/2 left-2">
                    {time}
                  </span>
                </div>
              ))}

              {/* 30-minute dividers - RED LINES */}
              {halfHourDividers.map((divider, i) => (
                <div 
                  key={`divider-30min-${i}`}
                  className="absolute pointer-events-none bg-red-400" 
                  style={{ 
                    left: `${divider.position}px`,
                    top: '60%',
                    width: '1px',       
                    height: '10px',        
                    zIndex: 2
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div 
          className="absolute inset-0 z-[1]" 
          style={{ top: `${TIME_HEADER_HEIGHT}px` }}
        >
          <div
            ref={viewportRef}
            className="w-full h-full overflow-x-scroll overflow-y-auto"
            onScroll={handleScroll}
          >
            <div className="flex" style={{ minWidth: `${DAY_COLUMN_WIDTH + (timeSlots.length * HOUR_WIDTH)}px` }}>
              {/* Day Column */}
              <div 
                className="flex-shrink-0 bg-white sticky left-0"
                style={{ 
                  width: `${DAY_COLUMN_WIDTH}px`,
                  zIndex: 15
                }}
              >
                {days.map((day, index) => (
                  <div 
                    key={day.short} 
                    className="flex items-center justify-center"
                    style={{ height: `${DAY_ROW_HEIGHT}px` }}
                  >
                    <span className="text-base font-bold text-neutral-600">
                      {day.short}
                    </span>
                  </div>
                ))}
              </div>

              {/* Time Grid */}
              <div 
                className="relative"
                style={{ 
                  width: `${timeSlots.length * HOUR_WIDTH}px`, 
                  height: `${days.length * DAY_ROW_HEIGHT}px`,
                  minWidth: `${timeSlots.length * HOUR_WIDTH}px`
                }}
              >
                {/* Mouse event overlay - LOWER z-index than schedule events */}
                <div
                  className="absolute inset-0 cursor-pointer"
                  style={{ 
                    zIndex: 1,
                    backgroundColor: 'transparent'
                  }}
                  onMouseDown={handleMouseDown}
                />

                {/* Horizontal day lines - LOWEST z-index */}
                {days.map((_, i) => (
                  i > 0 && (
                    <div 
                      key={`hline-${i}`}
                      className="absolute left-0 right-0 h-px bg-zinc-200 pointer-events-none"
                      style={{ top: `${i * DAY_ROW_HEIGHT}px`, zIndex: -1 }}
                    />
                  )
                ))}

                {/* Render Schedule Events - HIGHER z-index, CLICKABLE */}
                {Object.entries(getScheduleToDisplay).map(([dayName, events]) => {
                  const dayIndex = days.findIndex(d => d.full === dayName);
                  if (dayIndex === -1) return null;

                  return events.map((event, eventIndex) => {
                    const left = timeToPosition(event.startTime);
                    const width = calculateEventWidth(event.startTime, event.endTime);
                    const top = dayIndex * DAY_ROW_HEIGHT + 5;
                    const height = DAY_ROW_HEIGHT - 10;

                    return (
                      <div
                        key={`${event.id}-${eventIndex}`}
                        className="schedule-event absolute rounded-md px-2 py-1 cursor-pointer hover:opacity-90 transition-opacity"
                        style={{
                          left: `${left}px`,
                          top: `${top}px`,
                          width: `${width}px`,
                          height: `${height}px`,
                          backgroundColor: event.color,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          zIndex: 20 // HIGHER than mouse overlay (1)
                        }}
                        onClick={(e) => handleScheduleClick(e, event)}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <div className="text-white text-xs font-semibold truncate">
                          {event.name}
                        </div>
                        <div className="text-white text-xs truncate">
                          {event.startTime} - {event.endTime} {event.timezoneDisplay} | {event.platform}
                        </div>
                      </div>
                    );
                  });
                })}

                {/* Empty day messages */}
                {selectedDates.length > 0 && days.map((day, dayIndex) => {
                  const hasEvents = getScheduleToDisplay[day.full] && getScheduleToDisplay[day.full].length > 0;
                  const isDaySelected = selectedDates.some(date => days[date.getDay()]?.full === day.full);
                  
                  if (isDaySelected && !hasEvents) {
                    const top = dayIndex * DAY_ROW_HEIGHT + 5;
                    const height = DAY_ROW_HEIGHT - 10;
                    
                    return (
                      <div
                        key={`empty-${dayIndex}`}
                        className="absolute rounded-md px-2 py-1 pointer-events-none flex items-center justify-center"
                        style={{
                          left: '200px',
                          top: `${top}px`,
                          width: '200px',
                          height: `${height}px`,
                          backgroundColor: 'transparent',
                          zIndex: 5
                        }}
                      >
                        <div className="text-gray-400 text-xs">
                          Belum ada jadwal
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}

                {/* Selection box */}
                {selectionBox}
              </div>
            </div>
          </div>
        </div>

        {/* Current time line - HIGHEST z-index */}
        <div 
          className="absolute pointer-events-none" 
          style={{ 
            left: `${DAY_COLUMN_WIDTH + getCurrentTimePosition() - scrollLeft + 10}px`,
            top: `${TIME_HEADER_HEIGHT}px`,
            bottom: '0px',
            zIndex: 60,
            width: '2px'
          }}
        >
          <div className="relative w-full h-full bg-red-500">
            <div className="absolute w-2.5 h-2.5 bg-red-500 rounded-full" 
                 style={{ top: '-5px', left: '50%', transform: 'translateX(-50%)' }} />
            
            <div className="absolute" style={{ left: '6px', top: '2px' }}>
              <div className="bg-black bg-opacity-80 rounded text-white text-xs font-mono px-1.5 py-1 whitespace-nowrap shadow-lg">
                {getCurrentTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleGrid;