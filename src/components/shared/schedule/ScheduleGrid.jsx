// src/components/shared/schedule/ScheduleGrid.jsx - FULL FIXED CODE WITH STACKING SUPPORT

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
  const MIN_DAY_ROW_HEIGHT = 50;
  
  // STACKING CONSTANTS
  const SCHEDULE_BASE_HEIGHT = 32;
  const SCHEDULE_COMPRESSED_HEIGHT = 20;
  const SCHEDULE_MARGIN = 2;
  const STACK_OVERLAP = 4;
  const MAX_VISIBLE_STACKS = 5;
  
  const TIME_HEADER_HEIGHT = 30;
  const DAY_COLUMN_WIDTH = 70;
  const HEADER_HEIGHT = 66;
  const DRAG_THRESHOLD = 5;
  const CLICK_TIMEOUT = 150;
  const MAX_DRAG_DAYS = 2; // Maximum 2 days for drag selection

  // Static data
  const days = useMemo(() => [
    { short: "Sen", full: "Senin" }, { short: "Sel", full: "Selasa" },
    { short: "Rab", full: "Rabu" }, { short: "Kam", full: "Kamis" },
    { short: "Jum", full: "Jumat" }, { short: "Sab", full: "Sabtu" },
    { short: "Min", full: "Minggu" }
  ], []);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let i = 6; i <= 23; i++) {
      slots.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  const halfHourDividers = useMemo(() => {
    const dividers = [];
    for (let i = 0; i < timeSlots.length; i++) { 
      const position = i * HOUR_WIDTH + HOUR_WIDTH / 2 + 25;
      dividers.push({ position, hourIndex: i });
    }
    return dividers;
  }, [timeSlots.length]);

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
    return Math.max(0, Math.min(17, hour - 6));
  }, []);

  const getActualHour = useCallback((index) => {
    if (index >= 0 && index <= 17) return index + 6;
    return 6;
  }, []);

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

  // Current time helpers
  const getCurrentTimePosition = useCallback(() => {
    const now = currentTime;
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const hourIndex = getHourDisplayIndex(hour);
    const minuteOffset = (minutes / 60);
    const totalOffset = hourIndex + minuteOffset;
    return totalOffset * HOUR_WIDTH;
  }, [currentTime, getHourDisplayIndex]);

  const getCurrentTimeString = useCallback(() => {
    const now = currentTime;
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }, [currentTime]);

  // ENHANCED: Schedule processing with collision detection
  const processedSchedules = useMemo(() => {
    const processed = {};
    
    days.forEach(day => {
      processed[day.full] = {};
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

        const startTime = new Date(schedule.startDateTime);
        const endTime = new Date(schedule.endDateTime);
        
        const displaySchedule = {
          id: schedule.id,
          name: schedule.agenda || schedule.displayName || "No Title",
          startTime: startTime.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          endTime: endTime.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          platform: schedule.location || "Location",
          type: schedule.type || "other",
          color: getTypeColor(schedule.type),
          timezone: schedule.timezone || "Asia/Jakarta",
          timezoneDisplay: getTimezoneDisplay(schedule.timezone),
          participants: schedule.participants || [],
          originalData: schedule,
          startDateTime: startTime,
          endDateTime: endTime,
          duration: endTime - startTime
        };

        // Find the main hour slot for this event
        const startHour = startTime.getHours();
        const timeSlot = `${startHour.toString().padStart(2, '0')}:00`;
        
        if (!processed[dayName][timeSlot]) {
          processed[dayName][timeSlot] = [];
        }
        
        processed[dayName][timeSlot].push(displaySchedule);
      }
    });

    // Sort events in each slot by start time and detect overlaps
    Object.keys(processed).forEach(dayName => {
      Object.keys(processed[dayName]).forEach(timeSlot => {
        const events = processed[dayName][timeSlot];
        
        // Sort by start time, then by duration (longer first)
        events.sort((a, b) => {
          const timeDiff = a.startDateTime - b.startDateTime;
          if (timeDiff !== 0) return timeDiff;
          return b.duration - a.duration;
        });

        // Detect overlapping events and assign stack positions
        events.forEach((event, index) => {
          const overlapping = events.filter(otherEvent => {
            if (otherEvent.id === event.id) return false;
            return (event.startDateTime < otherEvent.endDateTime && 
                   event.endDateTime > otherEvent.startDateTime);
          });

          event.stackIndex = index;
          event.totalStacks = Math.max(1, overlapping.length + 1);
          event.isStacked = overlapping.length > 0;
        });
      });
    });

    return processed;
  }, [schedules, selectedDates, days, getTypeColor, getTimezoneDisplay]);

  // Calculate dynamic row heights based on maximum stacks
  const dayRowHeights = useMemo(() => {
    const heights = {};
    
    days.forEach(day => {
      let maxStackCount = 1;
      
      Object.values(processedSchedules[day.full] || {}).forEach(eventsInSlot => {
        if (eventsInSlot.length > 0) {
          const maxConcurrent = Math.max(...eventsInSlot.map(e => e.totalStacks || 1));
          maxStackCount = Math.max(maxStackCount, maxConcurrent);
        }
      });
      
      const baseHeight = MIN_DAY_ROW_HEIGHT;
      const additionalHeight = Math.min(maxStackCount - 1, MAX_VISIBLE_STACKS - 1) * 
        (SCHEDULE_COMPRESSED_HEIGHT + SCHEDULE_MARGIN);
      
      heights[day.full] = baseHeight + additionalHeight;
    });
    
    return heights;
  }, [processedSchedules, days]);

  const totalGridHeight = useMemo(() => {
    return Object.values(dayRowHeights).reduce((sum, height) => sum + height, 0);
  }, [dayRowHeights]);

  // Position calculation helpers
  const getDayRowTop = useCallback((dayIndex) => {
    let top = 0;
    for (let i = 0; i < dayIndex; i++) {
      const dayName = days[i]?.full;
      top += dayRowHeights[dayName] || MIN_DAY_ROW_HEIGHT;
    }
    return top;
  }, [days, dayRowHeights]);

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
    
    let dayIndex = -1;
    let currentTop = 0;
    
    for (let i = 0; i < days.length; i++) {
      const dayHeight = dayRowHeights[days[i].full] || MIN_DAY_ROW_HEIGHT;
      if (gridY >= currentTop && gridY < currentTop + dayHeight) {
        dayIndex = i;
        break;
      }
      currentTop += dayHeight;
    }

    if (hourIndex < 0 || hourIndex >= timeSlots.length || dayIndex < 0 || dayIndex >= days.length) {
      return null;
    }

    const actualHour = getActualHour(hourIndex);
    const pixelWithinHour = gridX % HOUR_WIDTH;
    const minuteWithinHour = Math.floor((pixelWithinHour / HOUR_WIDTH) * 60);
    const actualMinute = Math.floor(minuteWithinHour / 5) * 5;
    
    return { 
      hour: actualHour, 
      minute: actualMinute,
      hourIndex, 
      dayIndex,
      exactPixelX: gridX,
      exactPixelY: gridY - getDayRowTop(dayIndex)
    };
  }, [getActualHour, days.length, timeSlots.length, dayRowHeights, getDayRowTop]);

  // Event handlers
  const handleScheduleClick = useCallback((event, scheduleData) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!isDragging && !isMouseDown) {
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
  }, [getInfoFromPosition, days, isMouseDown]);

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
          
          const startDayIndex = selectedArea?.startDay || 0;
          const maxEndDay = Math.min(startDayIndex + MAX_DRAG_DAYS - 1, days.length - 1);
          const minEndDay = Math.max(startDayIndex - MAX_DRAG_DAYS + 1, 0);
          
          const constrainedDayIndex = Math.max(minEndDay, Math.min(maxEndDay, info.dayIndex));
          
          const currentPos = `${constrainedDayIndex}-${info.hourIndex}-${info.minute}`;
          if (lastMousePosRef.current !== currentPos) {
            lastMousePosRef.current = currentPos;
            setSelectedArea(prev => ({ 
              ...prev, 
              endDay: constrainedDayIndex, 
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
  }, [isMouseDown, isDragging, dragStartPos, dragTimer, getInfoFromPosition, days.length, selectedArea]);

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
        const today = new Date();
        const startDateTime = new Date(today);
        startDateTime.setHours(info.hour, info.minute, 0, 0);
        
        const endDateTime = new Date(today);
        endDateTime.setHours(info.hour, info.minute + 5, 0, 0);

        const dayName = days[info.dayIndex]?.full;

        // Backend will handle all conflicts and availability
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

        if (startDay >= 0 && startDay < days.length) {
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
    
    setIsDragging(false);
    setIsMouseDown(false);
    setSelectedArea(null);
    setDragStartPos(null);
    lastMousePosRef.current = null;
    dragStartTimeRef.current = null;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [isMouseDown, isDragging, selectedArea, dragStartPos, dragTimer, days, onTimeSlotSelect, getInfoFromPosition]);

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

    const top = getDayRowTop(startDayIndex);
    let height = 0;
    for (let i = startDayIndex; i <= endDayIndex; i++) {
      const dayName = days[i]?.full;
      height += dayRowHeights[dayName] || MIN_DAY_ROW_HEIGHT;
    }
    
    const left = startPixelX;
    const width = Math.max(endPixelX - startPixelX, 10);

    return (
      <div
        className="absolute bg-blue-400/20 border-2 border-blue-500 rounded-sm pointer-events-none"
        style={{ top, left, width, height, zIndex: 50 }}
      />
    );
  }, [selectedArea, isDragging, getDayRowTop, days, dayRowHeights]);

  // Effects
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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
      <div className="relative overflow-hidden" style={{ height: `${actualHeight - HEADER_HEIGHT}px` }}>
        
        {/* Fixed Time Header */}
        <div 
          className="absolute top-0 bg-white border-b border-zinc-200"
          style={{ 
            left: `${DAY_COLUMN_WIDTH - 15}px`,
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
                    className="flex items-center justify-center border-b border-zinc-200"
                    style={{ height: `${dayRowHeights[day.full]}px` }}
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
                  height: `${totalGridHeight}px`,
                  minWidth: `${timeSlots.length * HOUR_WIDTH}px`
                }}
              >
                {/* Mouse event overlay */}
                <div
                  className="absolute inset-0 cursor-pointer"
                  style={{ 
                    zIndex: 1,
                    backgroundColor: 'transparent'
                  }}
                  onMouseDown={handleMouseDown}
                />

                {/* Day separator lines */}
                {days.map((day, i) => {
                  if (i === 0) return null;
                  const top = getDayRowTop(i);
                  return (
                    <div 
                      key={`hline-${i}`}
                      className="absolute left-0 right-0 h-px bg-zinc-200 pointer-events-none"
                      style={{ top: `${top}px`, zIndex: 0 }}
                    />
                  );
                })}

                {/* ENHANCED: Render Stacked Schedule Events */}
                {Object.entries(processedSchedules).map(([dayName, timeSlotStacks]) => {
                  const dayIndex = days.findIndex(d => d.full === dayName);
                  if (dayIndex === -1) return null;

                  const dayTop = getDayRowTop(dayIndex);

                  return Object.entries(timeSlotStacks).map(([timeSlot, eventsInSlot]) => {
                    if (eventsInSlot.length === 0) return null;

                    return eventsInSlot.map((event, stackIndex) => {
                      const left = timeToPosition(event.startTime);
                      const width = calculateEventWidth(event.startTime, event.endTime);
                      
                      // ENHANCED: Smart stacking with compression
                      const isStacked = event.isStacked;
                      const height = isStacked ? SCHEDULE_COMPRESSED_HEIGHT : SCHEDULE_BASE_HEIGHT;
                      const top = dayTop + 8 + (stackIndex * (height + SCHEDULE_MARGIN));
                      
                      // Calculate opacity and positioning for stacked items
                      const isVisible = stackIndex < MAX_VISIBLE_STACKS;
                      const opacity = isVisible ? (stackIndex === 0 ? 1 : 0.85 - (stackIndex * 0.1)) : 0;

                      if (!isVisible) return null;

                      return (
                        <div
                          key={`${event.id}-${stackIndex}`}
                          className="schedule-event absolute rounded-md px-2 py-1 cursor-pointer hover:opacity-90 transition-all duration-200"
                          style={{
                            left: `${left}px`,
                            top: `${top}px`,
                            width: `${width - (isStacked ? stackIndex * 2 : 0)}px`,
                            height: `${height}px`,
                            backgroundColor: event.color,
                            opacity,
                            transform: isStacked ? `translateX(${stackIndex * STACK_OVERLAP}px)` : 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            zIndex: 20 + stackIndex,
                            fontSize: isStacked ? '10px' : '12px',
                            boxShadow: isStacked ? '0 1px 3px rgba(0,0,0,0.12)' : 'none'
                          }}
                          onClick={(e) => handleScheduleClick(e, event)}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <div className="text-white font-semibold truncate" style={{ lineHeight: '1.2' }}>
                            {event.name}
                          </div>
                          {!isStacked && (
                            <div className="text-white text-xs truncate opacity-90">
                              {event.startTime} - {event.endTime} {event.timezoneDisplay} | {event.platform}
                            </div>
                          )}
                        </div>
                      );
                    });
                  });
                })}

                {/* Stack count indicators for overflow */}
                {Object.entries(processedSchedules).map(([dayName, timeSlotStacks]) => {
                  const dayIndex = days.findIndex(d => d.full === dayName);
                  if (dayIndex === -1) return null;
                  const dayTop = getDayRowTop(dayIndex);

                  return Object.entries(timeSlotStacks).map(([timeSlot, eventsInSlot]) => {
                    const overflowCount = eventsInSlot.length - MAX_VISIBLE_STACKS;
                    if (overflowCount <= 0) return null;

                    const left = timeToPosition(timeSlot);
                    const top = dayTop + 8 + (MAX_VISIBLE_STACKS * (SCHEDULE_COMPRESSED_HEIGHT + SCHEDULE_MARGIN));

                    return (
                      <div
                        key={`overflow-${dayName}-${timeSlot}`}
                        className="absolute bg-gray-500 text-white text-xs rounded px-2 py-1 pointer-events-none"
                        style={{
                          left: `${left}px`,
                          top: `${top}px`,
                          height: `${SCHEDULE_COMPRESSED_HEIGHT}px`,
                          display: 'flex',
                          alignItems: 'center',
                          zIndex: 30
                        }}
                      >
                        +{overflowCount} more
                      </div>
                    );
                  });
                })}

                {/* Empty day messages */}
                {selectedDates.length > 0 && days.map((day, dayIndex) => {
                  const hasEvents = Object.values(processedSchedules[day.full] || {}).some(events => events.length > 0);
                  const isDaySelected = selectedDates.some(date => days[date.getDay()]?.full === day.full);
                  
                  if (isDaySelected && !hasEvents) {
                    const top = getDayRowTop(dayIndex);
                    const height = dayRowHeights[day.full] - 10;
                    
                    return (
                      <div
                        key={`empty-${dayIndex}`}
                        className="absolute rounded-md px-2 py-1 pointer-events-none flex items-center justify-center"
                        style={{
                          left: '200px',
                          top: `${top + 5}px`,
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

        {/* Current time line */}
        <div 
          className="absolute pointer-events-none" 
          style={{ 
            left: `${DAY_COLUMN_WIDTH + getCurrentTimePosition() - scrollLeft + 10}px`,
            top: `${TIME_HEADER_HEIGHT}px`,
            height: `${totalGridHeight}px`,
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