// src/components/shared/schedule/components/ScheduleDragHandler.jsx

import { useCallback } from "react";
import { toast } from "sonner";
import { GRID_CONFIG, DAYS } from "./scheduleGridConfig";

const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const useDragHandler = ({
  viewportRef,
  scrollLeft,
  scrollTop,
  dayRowHeights,
  getDateFromDayIndex,
  selectedDates,
  onTimeSlotSelect,
}) => {
  const getTimeFromPosition = useCallback(
    (clientX, clientY, getHourDisplayIndex, getActualHour) => {
      if (!viewportRef.current) return null;

      const rect = viewportRef.current.getBoundingClientRect();
      const x = clientX - rect.left + scrollLeft;
      const y = clientY - rect.top + scrollTop;
      const gridX = x - GRID_CONFIG.paddingOffset;
      const gridY = y;

      if (gridX < 0 || gridY < 0) return null;

      const hourIndex = Math.floor(gridX / GRID_CONFIG.hourWidth);
      if (hourIndex < 0 || hourIndex >= 19) return null; // TIME_SLOTS.length

      let dayIndex = -1;
      let currentTop = 0;

      for (let i = 0; i < DAYS.length; i++) {
        const dayHeight = dayRowHeights[DAYS[i].full] || GRID_CONFIG.minDayRowHeight;
        if (gridY >= currentTop && gridY < currentTop + dayHeight) {
          dayIndex = i;
          break;
        }
        currentTop += dayHeight;
      }

      if (dayIndex < 0) return null;

      let actualHour = getActualHour(hourIndex);
      const pixelWithinHour = gridX - hourIndex * GRID_CONFIG.hourWidth;
      const exactMinute = (pixelWithinHour / GRID_CONFIG.hourWidth) * 60;

      let snappedMinute = Math.round(exactMinute / 15) * 15;

      if (snappedMinute >= 60) {
        snappedMinute = 0;
        actualHour += 1;

        if (actualHour >= 24) {
          actualHour = 23;
          snappedMinute = 45;
        }
      }

      const correctedHourIndex = getHourDisplayIndex(actualHour);
      const pixelX = correctedHourIndex * GRID_CONFIG.hourWidth + (snappedMinute / 60) * GRID_CONFIG.hourWidth;

      return {
        hour: actualHour,
        minute: snappedMinute,
        hourIndex: correctedHourIndex,
        dayIndex: dayIndex,
        exactMinute: exactMinute,
        pixelX: pixelX,
      };
    },
    [scrollLeft, scrollTop, dayRowHeights, viewportRef]
  );

  const handleMouseDown = useCallback(
    (e, { getTimeFromPosition, setDragStartPos, setSelectedArea, setIsDragging, setDragTimeTooltip }) => {
      if (e.target.closest(".schedule-event") || e.target.closest(".help-icon")) return;

      e.preventDefault();
      e.stopPropagation();

      const timeInfo = getTimeFromPosition(e.clientX, e.clientY);
      if (!timeInfo) return;

      setDragStartPos(timeInfo);
      setSelectedArea({
        startDay: timeInfo.dayIndex,
        endDay: timeInfo.dayIndex,
        startHour: timeInfo.hour,
        endHour: timeInfo.hour,
        startMinute: timeInfo.minute,
        endMinute: timeInfo.minute,
        startPixelX: timeInfo.pixelX,
        endPixelX: timeInfo.pixelX,
      });
      setIsDragging(true);

      const rect = viewportRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const relativeY = e.clientY - rect.top;

      // Initialize tooltip with a minimum 15-minute span, handling minute rollover
      let tooltipEndHour = timeInfo.hour;
      let tooltipEndMinute = timeInfo.minute + 15;
      if (tooltipEndMinute >= 60) {
        tooltipEndHour += 1;
        tooltipEndMinute -= 60;
      }
      if (tooltipEndHour >= 24) {
        tooltipEndHour = 23;
        tooltipEndMinute = 45;
      }

      setDragTimeTooltip({
        x: relativeX,
        y: relativeY,
        startTime: `${timeInfo.hour.toString().padStart(2, "0")}:${timeInfo.minute.toString().padStart(2, "0")}`,
        endTime: `${tooltipEndHour.toString().padStart(2, "0")}:${tooltipEndMinute.toString().padStart(2, "0")}`,
      });
    },
    [viewportRef]
  );

  const handleMouseMove = useCallback(
    (e, { 
      isDragging, 
      dragStartPos, 
      getTimeFromPosition, 
      setSelectedArea, 
      setDragTimeTooltip, 
      getDayRowTop 
    }) => {
      if (!isDragging || !dragStartPos) return;

      const timeInfo = getTimeFromPosition(e.clientX, e.clientY);
      if (!timeInfo) return;

      let constrainedDayIndex = timeInfo.dayIndex;

      if (timeInfo.dayIndex !== dragStartPos.dayIndex) {
        const startDayIndex = dragStartPos.dayIndex;
        const maxEndDay = Math.min(startDayIndex + GRID_CONFIG.maxDragDays - 1, DAYS.length - 1);
        const minEndDay = Math.max(startDayIndex - GRID_CONFIG.maxDragDays + 1, 0);
        constrainedDayIndex = Math.max(minEndDay, Math.min(maxEndDay, timeInfo.dayIndex));
      }

      setSelectedArea((prev) => ({
        ...prev,
        endDay: constrainedDayIndex,
        endHour: timeInfo.hour,
        endMinute: timeInfo.minute,
        endPixelX: timeInfo.pixelX,
      }));

      // Auto-scroll logic
      if (viewportRef.current) {
        const viewport = viewportRef.current;
        
        const startDayTop = getDayRowTop(Math.min(dragStartPos.dayIndex, constrainedDayIndex));
        const endDayTop = getDayRowTop(Math.max(dragStartPos.dayIndex, constrainedDayIndex));
        const endDayHeight = dayRowHeights[DAYS[Math.max(dragStartPos.dayIndex, constrainedDayIndex)]?.full] || GRID_CONFIG.minDayRowHeight;
        const dragAreaBottom = endDayTop + endDayHeight;
        
        const currentScrollTop = viewport.scrollTop;
        const viewportHeight = viewport.clientHeight;
        const visibleTop = currentScrollTop;
        const visibleBottom = currentScrollTop + viewportHeight;
        
        if (dragAreaBottom > visibleBottom) {
          const newScrollTop = dragAreaBottom - viewportHeight + 20;
          viewport.scrollTop = Math.min(newScrollTop, viewport.scrollHeight - viewportHeight);
        }
        
        if (startDayTop < visibleTop) {
          const newScrollTop = Math.max(0, startDayTop - 20);
          viewport.scrollTop = newScrollTop;
        }
      }

      const rect = viewportRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const relativeY = e.clientY - rect.top;

      const time1 = { hour: dragStartPos.hour, minute: dragStartPos.minute, day: dragStartPos.dayIndex };
      const time2 = { hour: timeInfo.hour, minute: timeInfo.minute, day: constrainedDayIndex };

      const time1Minutes = time1.day * 1440 + time1.hour * 60 + time1.minute;
      const time2Minutes = time2.day * 1440 + time2.hour * 60 + time2.minute;

      // Tooltip display: ensure non-zero span even if hour:minute match
      let startTime, endTime;
      let startH, startM, endH, endM;
      if (time1Minutes <= time2Minutes) {
        startH = time1.hour; startM = time1.minute;
        endH = time2.hour; endM = time2.minute;
      } else {
        startH = time2.hour; startM = time2.minute;
        endH = time1.hour; endM = time1.minute;
      }
      if (startH === endH && startM === endM) {
        // Add 15 minutes to end for tooltip readability
        endM += 15;
        if (endM >= 60) { endH += 1; endM -= 60; }
        if (endH >= 24) { endH = 23; endM = 45; }
      }
      // Visual normalization: always show ascending times-of-day in tooltip
      // to avoid confusing "across" display like 11:15 - 11:00 while dragging.
      const tooltipStartTotal = startH * 60 + startM;
      const tooltipEndTotal = endH * 60 + endM;
      if (tooltipEndTotal < tooltipStartTotal) {
        const swapH = startH; const swapM = startM;
        startH = endH; startM = endM;
        endH = swapH; endM = swapM;
      }
      startTime = `${startH.toString().padStart(2, "0")}:${startM.toString().padStart(2, "0")}`;
      endTime = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;

      setDragTimeTooltip({
        x: relativeX,
        y: relativeY - 10,
        startTime: startTime,
        endTime: endTime,
      });
    },
    [viewportRef, dayRowHeights]
  );

  const handleMouseUp = useCallback(
    (isDragging, selectedArea, dragStartPos, setStates) => {
      if (!isDragging || !selectedArea || !dragStartPos) return;

      if (!selectedDates || selectedDates.length === 0) {
        toast.error("Pilih minggu di kalender terlebih dahulu untuk membuat jadwal.");
        setStates();
        return;
      }

      const isClick =
        selectedArea.startDay === selectedArea.endDay &&
        selectedArea.startHour === selectedArea.endHour &&
        selectedArea.startMinute === selectedArea.endMinute;

      let finalStartDateTime, finalEndDateTime;
      let draggedDaysCount;

      if (isClick) {
        const clickedDate = getDateFromDayIndex(selectedArea.startDay);
        finalStartDateTime = new Date(clickedDate);
        finalStartDateTime.setHours(selectedArea.startHour, selectedArea.startMinute, 0, 0);

        finalEndDateTime = new Date(finalStartDateTime);
        finalEndDateTime.setMinutes(finalEndDateTime.getMinutes() + 30);
        draggedDaysCount = 1;
      } else {
        const startDay = Math.min(selectedArea.startDay, selectedArea.endDay);
        const endDay = Math.max(selectedArea.startDay, selectedArea.endDay);

        let startHour, startMinute, endHour, endMinute;

        const time1 = { hour: selectedArea.startHour, minute: selectedArea.startMinute, day: selectedArea.startDay };
        const time2 = { hour: selectedArea.endHour, minute: selectedArea.endMinute, day: selectedArea.endDay };

        const time1Minutes = time1.day * 1440 + time1.hour * 60 + time1.minute;
        const time2Minutes = time2.day * 1440 + time2.hour * 60 + time2.minute;

        if (time1Minutes <= time2Minutes) {
          startHour = time1.hour;
          startMinute = time1.minute;
          endHour = time2.hour;
          endMinute = time2.minute;
        } else {
          startHour = time2.hour;
          startMinute = time2.minute;
          endHour = time1.hour;
          endMinute = time1.minute;
        }

        const startTotalMinutes = startDay * 1440 + startHour * 60 + startMinute;
        const endTotalMinutes = endDay * 1440 + endHour * 60 + endMinute;

        // Ensure selection has a non-zero span
        if (startTotalMinutes >= endTotalMinutes) {
          endMinute += 15;
          if (endMinute >= 60) {
            endHour += 1;
            endMinute -= 60;
            if (endHour >= 24) { endHour = 23; endMinute = 45; }
          }
        }
        // Additional guard: if hour & minute match (e.g., cross-day 10:45-10:45), bump end by 15m.
        if (startHour === endHour && startMinute === endMinute) {
          let newEndH = endHour;
          let newEndM = endMinute + 15;
          if (newEndM >= 60) { newEndH += 1; newEndM -= 60; }
          if (newEndH >= 24) {
            // If cannot push end further, pull start back by 15m if possible
            if (startHour > 0 || startMinute > 0) {
              let newStartH = startHour;
              let newStartM = startMinute - 15;
              if (newStartM < 0) { newStartH -= 1; newStartM += 60; }
              if (newStartH < 0) {
                // Fallback to 00:00 - 00:15
                startHour = 0; startMinute = 0;
                endHour = 0; endMinute = 15;
              } else {
                startHour = newStartH; startMinute = newStartM;
              }
            } else {
              // Start is 00:00; set end to 00:15
              endHour = 0; endMinute = 15;
            }
          } else {
            endHour = newEndH; endMinute = newEndM;
          }
        }

        const startDate = getDateFromDayIndex(startDay);
        finalStartDateTime = new Date(startDate);
        finalStartDateTime.setHours(startHour, startMinute, 0, 0);

        const endDate = getDateFromDayIndex(endDay);
        finalEndDateTime = new Date(endDate);
        finalEndDateTime.setHours(endHour, endMinute, 0, 0);

        draggedDaysCount = endDay - startDay + 1;
      }

      if (finalStartDateTime < new Date()) {
        toast.error("Tidak dapat membuat jadwal di masa lalu.");
        setStates();
        return;
      }

      const dates = [];
      // Ensure per-day start/end times produce a valid forward range
      let baseStartH = finalStartDateTime.getHours();
      let baseStartM = finalStartDateTime.getMinutes();
      let baseEndH = finalEndDateTime.getHours();
      let baseEndM = finalEndDateTime.getMinutes();
      // Handle equality (guarantee minimum duration)
      if (baseStartH === baseEndH && baseStartM === baseEndM) {
        baseEndM += 15;
        if (baseEndM >= 60) {
          baseEndH += 1;
          baseEndM -= 60;
        }
        if (baseEndH >= 24) {
          baseEndH = 23;
          baseEndM = 45;
        }
      }
      // Normalize if end-of-day is earlier than start-of-day (cross-day drag)
      const baseStartTotal = baseStartH * 60 + baseStartM;
      const baseEndTotal = baseEndH * 60 + baseEndM;
      if (baseEndTotal < baseStartTotal) {
        const tmpH = baseStartH;
        const tmpM = baseStartM;
        baseStartH = baseEndH;
        baseStartM = baseEndM;
        baseEndH = tmpH;
        baseEndM = tmpM;
      }
      for (
        let dayIndex = Math.min(selectedArea.startDay, selectedArea.endDay);
        dayIndex <= Math.max(selectedArea.startDay, selectedArea.endDay);
        dayIndex++
      ) {
        const dayDate = getDateFromDayIndex(dayIndex);
        dates.push({
          date: formatDateLocal(dayDate),
          startTime: `${baseStartH.toString().padStart(2, "0")}:${baseStartM.toString().padStart(2, "0")}`,
          endTime: `${baseEndH.toString().padStart(2, "0")}:${baseEndM.toString().padStart(2, "0")}`,
          timezone: "WIB",
        });
      }

      onTimeSlotSelect &&
        onTimeSlotSelect({
          startDateTime: finalStartDateTime,
          endDateTime: finalEndDateTime,
          day: DAYS[Math.min(selectedArea.startDay, selectedArea.endDay)]?.full,
          isMultipleDays: draggedDaysCount > 1,
          dates,
          draggedDays: draggedDaysCount,
        });

      setStates();
    },
    [selectedDates, getDateFromDayIndex, onTimeSlotSelect]
  );

  return {
    getTimeFromPosition,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
};
