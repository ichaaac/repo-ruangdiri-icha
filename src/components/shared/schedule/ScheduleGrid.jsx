// src/components/shared/schedule/ScheduleGrid.jsx - FINAL FIXED ALL DATE MAPPINGS

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
  const [scrollTop, setScrollTop] = useState(0);
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
  const MIN_DAY_ROW_HEIGHT = 60;
  
  const SCHEDULE_BASE_HEIGHT = 40;
  const SCHEDULE_COMPRESSED_HEIGHT = 22;
  const SCHEDULE_MARGIN = 2; 
  const LANE_SPACING = 6;
  const MAX_VISIBLE_STACKS = 3; 
  const DAY_PADDING_TOP = 12;
  const DAY_PADDING_BOTTOM = 8;
  
  const TIME_HEADER_HEIGHT = 30;
  const DAY_COLUMN_WIDTH = 70;
  const HEADER_HEIGHT = 66;
  const DRAG_THRESHOLD = 5;
  const CLICK_TIMEOUT = 150;
  const MAX_DRAG_DAYS = 2;

  const Z_INDICES = {
    BACKGROUND: 0,
    GRID_LINES: 5,
    DAY_ROW_LINES: 10,        
    SCHEDULE_EVENTS: 15,
    STACKED_SCHEDULES: 20,
    OVERFLOW_INDICATORS: 25,
    SELECTION_BOX: 30,
    SCROLL_CONTENT: 35,
    TIME_HEADERS: 40,
    CURRENT_TIME: 45,
    DAY_HEADERS: 50,
    MODALS: 100
  };

  // Static data - Monday=0 format
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
    slots.push('00:00');
    return slots;
  }, []);

  const halfHourDividers = useMemo(() => {
    const dividers = [];
    for (let i = 0; i < timeSlots.length - 1; i++) {
      const position = i * HOUR_WIDTH + HOUR_WIDTH / 2 + 25;
      dividers.push({ position, hourIndex: i });
    }
    const last23Position = (timeSlots.length - 2) * HOUR_WIDTH + HOUR_WIDTH / 2 + 25;
    dividers.push({ position: last23Position, hourIndex: timeSlots.length - 2, isHalfPast: true });
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
    if (timezone === "WIB" || timezone === "WITA" || timezone === "WIT") {
      return timezone;
    }
    
    if (typeof timezone === 'string' && timezone.includes('+')) {
      const offset = timezone.split('+')[1];
      switch (offset) {
        case '07': return 'WIB';
        case '08': return 'WITA'; 
        case '09': return 'WIT';
        default: return 'WIB';
      }
    }
    
    if (typeof timezone === 'string' && (timezone.includes('T') || timezone.includes(' '))) {
      const offsetMatch = timezone.match(/([+-]\d{2})/);
      if (offsetMatch) {
        const offset = offsetMatch[1].replace('+', '');
        switch (offset) {
          case '07': return 'WIB';
          case '08': return 'WITA';
          case '09': return 'WIT';
          default: return 'WIB';
        }
      }
    }
    
    return 'WIB';
  }, []);

  const getHourDisplayIndex = useCallback((hour) => {
    if (hour === 0) return timeSlots.length - 1;
    return Math.max(0, Math.min(17, hour - 6));
  }, [timeSlots.length]);

  const getActualHour = useCallback((index) => {
    if (index === timeSlots.length - 1) return 0;
    if (index >= 0 && index <= 17) return index + 6;
    return 6;
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
    return Math.max(endPos - startPos, 60);
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

  // FIXED Schedule processing with proper day mapping
  const processedSchedules = useMemo(() => {
    const processed = {};
    const dayEvents = {};
    
    days.forEach(day => {
      processed[day.full] = {};
      dayEvents[day.full] = [];
    });

    schedules.forEach(schedule => {
      const scheduleDate = new Date(schedule.startDateTime);
      // Convert JS Date.getDay() (Sunday=0) to our format (Monday=0)
      const dayIndex = (scheduleDate.getDay() + 6) % 7;
      const dayName = days[dayIndex]?.full;
      
      if (dayName) {
        if (selectedDates.length > 0) {
          const isDateSelected = selectedDates.some(date => {
            const selectedDateObj = new Date(date);
            return selectedDateObj.toDateString() === scheduleDate.toDateString();
          });
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
          timezone: schedule.timezone || "WIB",
          timezoneDisplay: getTimezoneDisplay(schedule.timezone || schedule.startDateTime),
          participants: schedule.participants || [],
          originalData: schedule,
          startDateTime: startTime,
          endDateTime: endTime,
          duration: endTime - startTime,
          startMinutes: startTime.getHours() * 60 + startTime.getMinutes(),
          endMinutes: endTime.getHours() * 60 + endTime.getMinutes()
        };

        dayEvents[dayName].push(displaySchedule);
      }
    });

    Object.keys(dayEvents).forEach(dayName => {
      const events = dayEvents[dayName];
      
      events.sort((a, b) => {
        const timeDiff = a.startDateTime - b.startDateTime;
        if (timeDiff !== 0) return timeDiff;
        return a.duration - b.duration;
      });

      const lanes = [];
      
      events.forEach((event) => {
        let assignedLane = -1;
        
        // Check for overlaps with existing lanes
        for (let i = 0; i < lanes.length; i++) {
          const lane = lanes[i];
          const lastEventInLane = lane[lane.length - 1];
          
          // Check if this event can fit in this lane (no overlap)
          if (lastEventInLane.endMinutes <= event.startMinutes) {
            assignedLane = i;
            break;
          }
        }
        
        // If no lane is available, create a new one
        if (assignedLane === -1) {
          assignedLane = lanes.length;
          lanes.push([]);
        }
        
        // FIXED: Better stacking properties
        event.stackIndex = assignedLane;
        event.totalLanes = lanes.length + 1; // Will be updated after all events processed
        
        // Add to lane
        lanes[assignedLane].push(event);
        
        const startHour = event.startDateTime.getHours();
        const timeSlot = `${startHour.toString().padStart(2, '0')}:00`;
        
        if (!processed[dayName][timeSlot]) {
          processed[dayName][timeSlot] = [];
        }
        
        processed[dayName][timeSlot].push(event);
      });
      
      // FIXED: Update total lanes for all events in this day AFTER all processing
      const finalTotalLanes = lanes.length;
      events.forEach(event => {
        event.totalLanes = finalTotalLanes;
        // FIXED: Only mark as stacked if there are actually multiple lanes
        event.isStacked = finalTotalLanes > 1;
      });
    });

    return processed;
  }, [schedules, selectedDates, days, getTypeColor, getTimezoneDisplay]);

  const dayRowHeights = useMemo(() => {
    const heights = {};
    
    days.forEach(day => {
      let maxLanes = 1;
      let hasEvents = false;
      
      Object.values(processedSchedules[day.full] || {}).forEach(eventsInSlot => {
        if (eventsInSlot.length > 0) {
          hasEvents = true;
          const dayMaxLanes = Math.max(...eventsInSlot.map(e => e.totalLanes || 1));
          maxLanes = Math.max(maxLanes, dayMaxLanes);
        }
      });
      
      if (hasEvents) {
        const visibleLanes = Math.min(maxLanes, MAX_VISIBLE_STACKS);
        let totalHeight = DAY_PADDING_TOP + DAY_PADDING_BOTTOM;
        
        // FIXED: Calculate exact space needed for events
        for (let i = 0; i < visibleLanes; i++) {
          // FIXED: Single lane always gets full height, multiple lanes get compressed
          if (maxLanes === 1) {
            totalHeight += SCHEDULE_BASE_HEIGHT;
          } else {
            totalHeight += SCHEDULE_COMPRESSED_HEIGHT;
          }
          
          // Add spacing between lanes (except after last)
          if (i < visibleLanes - 1) {
            totalHeight += LANE_SPACING;
          }
        }
        
        heights[day.full] = Math.max(totalHeight, MIN_DAY_ROW_HEIGHT);
      } else {
        heights[day.full] = MIN_DAY_ROW_HEIGHT;
      }
    });
    
    return heights;
  }, [processedSchedules, days]);

  const totalGridHeight = useMemo(() => {
    return Object.values(dayRowHeights).reduce((sum, height) => sum + height, 0);
  }, [dayRowHeights]);

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

    // FIXED: More precise position calculation
    const absoluteX = clientX - rect.left + scrollLeft;
    const absoluteY = clientY - rect.top + scrollTop;

    // FIXED: Account for DAY_COLUMN_WIDTH and TIME_HEADER_HEIGHT properly
    const gridX = absoluteX - DAY_COLUMN_WIDTH;
    const gridY = absoluteY - TIME_HEADER_HEIGHT;

    // FIXED: Better boundary checking
    if (gridX < 0 || gridY < 0) return null;

    // FIXED: More accurate hour calculation
    const hourIndex = Math.floor(gridX / HOUR_WIDTH);
    
    // FIXED: Better day index calculation with proper boundary checking
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

    // FIXED: Strict boundary validation
    if (hourIndex < 0 || hourIndex >= timeSlots.length || dayIndex < 0 || dayIndex >= days.length) {
      return null;
    }

    const actualHour = getActualHour(hourIndex);
    const pixelWithinHour = gridX % HOUR_WIDTH;
    const minuteWithinHour = Math.floor((pixelWithinHour / HOUR_WIDTH) * 60);
    const actualMinute = Math.floor(minuteWithinHour / 5) * 5; // Snap to 5-minute intervals
    
    return { 
      hour: actualHour, 
      minute: actualMinute,
      hourIndex, 
      dayIndex, // This is in Monday=0 format
      exactPixelX: gridX,
      exactPixelY: gridY - getDayRowTop(dayIndex)
    };
  }, [getActualHour, days.length, timeSlots.length, dayRowHeights, getDayRowTop]);

 const ScheduleEventCard = ({ event, style, className, onClickEvent }) => {
  const isStacked = event.totalLanes > 1; // Logika yang lebih sederhana untuk menentukan stacked
  const isSingle = !isStacked;
  const laneIndex = event.stackIndex || 0;
  
  const height = isSingle ? SCHEDULE_BASE_HEIGHT : SCHEDULE_COMPRESSED_HEIGHT;

  // Handler untuk mencegah event bubbling saat mengklik
  const handleClick = (e) => {
    e.stopPropagation(); // Mencegah grid menangani klik
    onClickEvent && onClickEvent(event);
  };

  const handleMouseDown = (e) => {
    e.stopPropagation(); // Mencegah grid memulai drag
  };

  // Jika kartu berada di luar batas tumpukan yang terlihat, jangan render sama sekali
  // Ini akan ditangani oleh logika overflow indicator di tempat lain jika diperlukan.
  if (laneIndex >= MAX_VISIBLE_STACKS) {
    return null;
  }

  // Layout untuk Kartu Tunggal (Single Event)
  if (isSingle) {
    return (
      <div
        className={`absolute flex flex-col justify-center items-start cursor-pointer transition-transform duration-200 hover:scale-[1.03] ${className || ''}`}
        style={{
          ...style,
          height: `${height}px`,
          backgroundColor: event.color,
          borderRadius: '5px',
          paddingLeft: '8px', // Sesuai dengan 'px-2' Anda
          paddingRight: '8px', // Sesuai dengan 'px-2' Anda
          overflow: 'hidden',
          zIndex: Z_INDICES.SCHEDULE_EVENTS + laneIndex,
          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
        }}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
      >
        {/* Baris 1: Nama Agenda */}
        <div className="w-full text-white text-[10px] font-semibold font-['Public_Sans'] truncate">
          {event.name}
        </div>
        
        {/* Baris 2: Detail Waktu dan Lokasi */}
        <div className="w-full flex items-center">
          <span className="text-white text-[10px] font-normal font-['Public_Sans'] truncate">
            {event.startTime} - {event.endTime} {event.timezoneDisplay}
          </span>
          <span className="text-white text-[10px] font-normal font-['Public_Sans'] mx-1">
            |
          </span>
          {/* Untuk 'text-TEXT-NEW', saya asumsikan warna yang sedikit berbeda. 
              Di sini saya menggunakan text-white dengan font-semibold untuk penekanan.
              Ganti 'text-white' jika Anda punya kelas warna spesifik. */}
          <span className="text-white text-[10px] font-semibold font-['Public_Sans'] truncate">
            {event.platform}
          </span>
        </div>
      </div>
    );
  }

  // Layout untuk Kartu Bertumpuk (Stacked Event)
  return (
    <div
      className={`absolute flex items-center cursor-pointer transition-transform duration-200 hover:scale-[1.03] ${className || ''}`}
      style={{
        ...style,
        height: `${height}px`,
        backgroundColor: event.color,
        borderRadius: '4px',
        paddingLeft: '8px',
        paddingRight: '8px',
        overflow: 'hidden',
        zIndex: Z_INDICES.SCHEDULE_EVENTS + laneIndex,
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      {/* Hanya menampilkan nama agenda untuk stacked card */}
      <div className="w-full text-white text-[10px] font-semibold font-['Public_Sans'] truncate">
        {event.name}
      </div>
    </div>
  );
};

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

  // FIXED: Proper date calculation based on Monday week start
  const getDateFromDayIndex = useCallback((dayIndex) => {
    const today = new Date();
    const todayDayIndex = (today.getDay() + 6) % 7; // Convert to Monday=0 format
    
    // Calculate how many days to add/subtract from today
    const dayDiff = dayIndex - todayDayIndex;
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + dayDiff);
    
    return targetDate;
  }, []);

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
        // FIXED: Calculate correct date for clicked day
        const clickedDate = getDateFromDayIndex(info.dayIndex);
        
        const startDateTime = new Date(clickedDate);
        startDateTime.setHours(info.hour, info.minute, 0, 0);
        
        const endDateTime = new Date(clickedDate);
        endDateTime.setHours(info.hour, info.minute + 5, 0, 0);

        const dayName = days[info.dayIndex]?.full;

        onTimeSlotSelect && onTimeSlotSelect({ 
          startDateTime, 
          endDateTime, 
          day: dayName,
          isMultipleDays: false,
          dates: [{
            date: clickedDate.toISOString().split('T')[0],
            startTime: `${info.hour.toString().padStart(2, '0')}:${info.minute.toString().padStart(2, '0')}`,
            endTime: `${info.hour.toString().padStart(2, '0')}:${(info.minute + 5).toString().padStart(2, '0')}`,
            timezone: 'WIB'
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
          // FIXED: Calculate correct date for dragged start day
          const draggedStartDate = getDateFromDayIndex(startDay);
          
          const startDateTime = new Date(draggedStartDate);
          startDateTime.setHours(startHour, startMinute, 0, 0);
          
          const endDateTime = new Date(draggedStartDate);
          endDateTime.setHours(finalEndHour, finalEndMinute, 0, 0);

          const dayName = days[startDay]?.full;
          const isMultipleDays = startDay !== endDay;

          const dates = [];
          for (let dayIndex = startDay; dayIndex <= endDay; dayIndex++) {
            const dayDate = getDateFromDayIndex(dayIndex);
            
            dates.push({
              date: dayDate.toISOString().split('T')[0],
              startTime: `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`,
              endTime: `${finalEndHour.toString().padStart(2, '0')}:${finalEndMinute.toString().padStart(2, '0')}`,
              timezone: 'WIB'
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
  }, [isMouseDown, isDragging, selectedArea, dragStartPos, dragTimer, days, onTimeSlotSelect, getInfoFromPosition, getDateFromDayIndex]);

  const handleScroll = useCallback((e) => {
    const newScrollLeft = e.target.scrollLeft;
    const newScrollTop = e.target.scrollTop;
    setScrollLeft(newScrollLeft);
    setScrollTop(newScrollTop);
  }, []);

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
        className="absolute bg-blue-400/20 rounded-sm pointer-events-none"
        style={{ top, left, width, height, zIndex: Z_INDICES.SELECTION_BOX }}
      />
    );
  }, [selectedArea, isDragging, getDayRowTop, days, dayRowHeights]);

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
      <div className="flex items-center px-5 py-3" style={{ height: `${HEADER_HEIGHT}px` }}>
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
        
        {/* Time Header */}
        <div 
          className="absolute top-0 bg-white"
          style={{ 
            left: `${DAY_COLUMN_WIDTH}px`,
            right: '0px',
            height: `${TIME_HEADER_HEIGHT}px`,
            overflow: 'hidden',
            zIndex: Z_INDICES.TIME_HEADERS
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
                    top: '35%',
                    width: '1px',       
                    height: '10px',        
                    zIndex: Z_INDICES.GRID_LINES
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Day Column */}
        <div 
          className="absolute top-0 bg-white"
          style={{ 
            left: '0px',
            width: `${DAY_COLUMN_WIDTH}px`,
            height: '100%',
            zIndex: Z_INDICES.DAY_HEADERS
          }}
        >
          <div style={{ height: `${TIME_HEADER_HEIGHT}px` }} />
          
          <div 
            style={{ 
              height: `${totalGridHeight}px`,
              transform: `translateY(-${scrollTop}px)`
            }}
          >
            {days.map((day, index) => (
              <div 
                key={day.short} 
                className="flex items-center justify-center bg-white"
                style={{ 
                  height: `${dayRowHeights[day.full]}px`
                }}
              >
                <span className="text-sm font-semibold text-neutral-700">
                  {day.short}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div 
          className="absolute" 
          style={{ 
            left: `${DAY_COLUMN_WIDTH}px`,
            top: `${TIME_HEADER_HEIGHT}px`,
            right: '0px',
            bottom: '0px',
            zIndex: Z_INDICES.SCROLL_CONTENT
          }}
        >
          <div
            ref={viewportRef}
            className="w-full h-full overflow-x-scroll overflow-y-auto"
            onScroll={handleScroll}
          >
            <div 
              className="relative"
              style={{ 
                width: `${timeSlots.length * HOUR_WIDTH}px`, 
                height: `${totalGridHeight}px`,
                minWidth: `${timeSlots.length * HOUR_WIDTH}px`
              }}
            >
              {/* FIXED: Improved mouse event overlay for better hitbox */}
              <div
                className="absolute inset-0 cursor-pointer"
                style={{ 
                  zIndex: Z_INDICES.BACKGROUND,
                  backgroundColor: 'transparent',
                  width: '100%',
                  height: '100%'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              />

              {days.map((day, i) => {
                if (i === 0) return null;
                const top = getDayRowTop(i);
                return (
                  <div 
                    key={`separator-${i}`}
                    className="absolute left-0 right-0 pointer-events-none"
                    style={{ 
                      top: `${top}px`,
                      height: '1px',
                      backgroundColor: '#8B8B8B',
                      zIndex: Z_INDICES.DAY_ROW_LINES
                    }}
                  />
                );
              })}

              {Object.entries(processedSchedules).map(([dayName, timeSlotStacks]) => {
                const dayIndex = days.findIndex(d => d.full === dayName);
                if (dayIndex === -1) return null;

                const dayTop = getDayRowTop(dayIndex);

                return Object.entries(timeSlotStacks).map(([timeSlot, eventsInSlot]) => {
                  if (eventsInSlot.length === 0) return null;

                  return eventsInSlot.map((event, eventIndex) => {
                    const left = timeToPosition(event.startTime);
                    const width = calculateEventWidth(event.startTime, event.endTime);
                    
                    const laneIndex = event.stackIndex || 0;
                    const totalLanes = event.totalLanes || 1;
                    
                    // FIXED: Clean lane offset calculation
                    let laneOffset = 0;
                    if (totalLanes > 1) {
                      // Multiple events, use compressed height and spacing
                      laneOffset = laneIndex * (SCHEDULE_COMPRESSED_HEIGHT + LANE_SPACING);
                    }
                    // Single event case: laneOffset remains 0
                    
                    const top = dayTop + DAY_PADDING_TOP + laneOffset;

                    return (
                      <ScheduleEventCard
                        key={`${event.id}-${laneIndex}`}
                        event={event}
                        style={{
                          left: `${left}px`,
                          top: `${top}px`,
                          width: `${width}px`
                        }}
                        onClickEvent={(scheduleData) => handleScheduleClick({ preventDefault: () => {}, stopPropagation: () => {} }, scheduleData)}
                      />
                    );
                  });
                });
              })}

              {selectedDates.length > 0 && days.map((day, dayIndex) => {
                const hasEvents = Object.values(processedSchedules[day.full] || {}).some(events => events.length > 0);
                const isDaySelected = selectedDates.some(date => {
                  const selectedDateObj = new Date(date);
                  const selectedDayIndex = (selectedDateObj.getDay() + 6) % 7;
                  return selectedDayIndex === dayIndex;
                });
                
                if (isDaySelected && !hasEvents) {
                  const dayTop = getDayRowTop(dayIndex);
                  const dayHeight = dayRowHeights[day.full];
                  
                  return (
                    <div
                      key={`empty-${dayIndex}`}
                      className="absolute pointer-events-none flex items-center justify-center"
                      style={{
                        left: '120px',
                        top: `${dayTop + DAY_PADDING_TOP}px`,
                        width: '240px',
                        height: `${dayHeight - DAY_PADDING_TOP - DAY_PADDING_BOTTOM}px`,
                        zIndex: Z_INDICES.BACKGROUND + 1
                      }}
                    >
                      <div className="text-gray-400 text-xs font-medium bg-gray-50 px-3 py-1 rounded-md">
                        Belum ada jadwal
                      </div>
                    </div>
                  );
                }
                return null;
              })}

              {selectionBox}
            </div>
          </div>
        </div>

        {/* Current time line */}
        <div 
          className="absolute pointer-events-none" 
          style={{ 
            left: `${DAY_COLUMN_WIDTH + getCurrentTimePosition() - scrollLeft}px`,
            top: `${TIME_HEADER_HEIGHT}px`,
            height: `${totalGridHeight}px`,
            zIndex: Z_INDICES.CURRENT_TIME,
            width: '2px'
          }}
        >
          <div className="relative w-full h-full bg-red-500 shadow-sm">
            <div className="absolute w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm" 
                 style={{ top: '-5px', left: '50%', transform: 'translateX(-50%)' }} />
            
            <div className="absolute" style={{ left: '6px', top: '2px' }}>
              <div className="bg-black bg-opacity-90 rounded text-white text-xs font-mono px-1.5 py-1 whitespace-nowrap shadow-md">
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