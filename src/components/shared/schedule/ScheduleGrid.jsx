// src/components/shared/schedule/ScheduleGrid.jsx - REFACTORED & BROKEN DOWN

import { useState, useEffect, useRef, useMemo, useCallback } from "react"

// Import broken down components
import ScheduleDayColumn from "./ScheduleGrid/ScheduleDayColumn"
import ScheduleTimeHeader from "./ScheduleGrid/ScheduleTimeHeader"
import ScheduleEmptyStates from "./ScheduleGrid/ScheduleEmptyStates"
import ScheduleEvent from "./ScheduleGrid/ScheduleEvent"
import ScheduleEventRenderer from "./ScheduleGrid/ScheduleEventRenderer"
import ScheduleHeader from "./ScheduleGrid/ScheduleHeader"
import ScheduleSelectionBox from "./ScheduleGrid/ScheduleSelectionBox"
import ScheduleTimeIndicator from "./ScheduleGrid/ScheduleTimeIndicator"
import { useDragHandler } from "./ScheduleGrid/ScheduleDragHandler"


// Import configuration
import { 
  GRID_CONFIG, 
  Z_INDICES, 
  DAYS, 
  TIME_SLOTS, 
  TYPE_COLORS 
} from "./ScheduleGrid/scheduleGridConfig"

const ScheduleGrid = ({
  onTimeSlotSelect,
  onScheduleClick,
  containerWidth = GRID_CONFIG.baseWidth,
  sidebarExpanded = false,
  selectedDates = [],
  weekStartDate,
  schedules = [],
  loading = false,
  getScheduleAtTime,
}) => {
  // State management
  const [selectedArea, setSelectedArea] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartPos, setDragStartPos] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [scrollLeft, setScrollLeft] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)
  const [dragTimeTooltip, setDragTimeTooltip] = useState(null)

  const viewportRef = useRef(null)

  // Computed dimensions
  const actualWidth = containerWidth
  const actualHeight = GRID_CONFIG.baseHeight

  // Helper functions
  const getTypeColor = useCallback((type) => {
    return TYPE_COLORS[type] || TYPE_COLORS.other
  }, [])

  const getLocationDisplay = useCallback((schedule) => {
    const location = schedule.location || schedule.customLocation

    if (location === "online") {
      return "Zoom"
    } else if (location === "offline") {
      return "Offline"
    } else if (location === "organization" || location === "seed-in") {
      return "Sit-in"
    } else if (location) {
      return location
    } else {
      return "TBD"
    }
  }, [])

  const parseUTCToLocal = useCallback((utcDateTimeString) => {
    const utcDate = new Date(utcDateTimeString)
    const wibOffset = 7 * 60 * 60 * 1000
    const wibDate = new Date(utcDate.getTime() + wibOffset)

    return new Date(
      wibDate.getUTCFullYear(),
      wibDate.getUTCMonth(),
      wibDate.getUTCDate(),
      wibDate.getUTCHours(),
      wibDate.getUTCMinutes(),
      wibDate.getUTCSeconds(),
    )
  }, [])

  const getHourDisplayIndex = useCallback(
    (hour) => {
      if (hour === 0) return TIME_SLOTS.length - 1
      return Math.max(0, Math.min(17, hour - 6))
    },
    [],
  )

  const getActualHour = useCallback(
    (index) => {
      if (index === TIME_SLOTS.length - 1) return 0
      if (index >= 0 && index <= 17) return index + 6
      return 6
    },
    [],
  )

  const timeToPosition = useCallback(
    (hour, minute) => {
      const hourIndex = getHourDisplayIndex(hour)
      const basePosition = hourIndex * GRID_CONFIG.hourWidth
      const minuteOffset = (minute / 60) * GRID_CONFIG.hourWidth
      const totalPosition = basePosition + minuteOffset

      return totalPosition
    },
    [getHourDisplayIndex],
  )

  const getDateFromDayIndex = useCallback(
    (dayIndex) => {
      const baseDate = weekStartDate ? new Date(weekStartDate) : new Date()
      const baseDayOfWeek = (baseDate.getDay() + 6) % 7
      baseDate.setDate(baseDate.getDate() - baseDayOfWeek)
      baseDate.setHours(0, 0, 0, 0)

      const targetDate = new Date(baseDate)
      targetDate.setDate(baseDate.getDate() + dayIndex)
      targetDate.setHours(0, 0, 0, 0)
      return targetDate
    },
    [weekStartDate],
  )

  // Check if current date is in selected week
  const isCurrentDateInSelectedWeek = useMemo(() => {
    if (!selectedDates || selectedDates.length === 0) return false

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return selectedDates.some((selectedDate) => {
      const normalizedSelectedDate = new Date(selectedDate)
      normalizedSelectedDate.setHours(0, 0, 0, 0)
      return normalizedSelectedDate.getTime() === today.getTime()
    })
  }, [selectedDates])

  // Process schedules with stacking logic
  const processedSchedules = useMemo(() => {
    const processed = {}
    const dayEvents = {}

    DAYS.forEach((day) => {
      processed[day.full] = {}
      dayEvents[day.full] = []
    })

    if (!selectedDates || selectedDates.length === 0) {
      return processed
    }

    schedules.forEach((schedule) => {
      const startDateTimeWIB = parseUTCToLocal(schedule.startDateTime)
      const endDateTimeWIB = parseUTCToLocal(schedule.endDateTime)

      const dayIndex = (startDateTimeWIB.getDay() + 6) % 7
      const dayName = DAYS[dayIndex]?.full

      if (dayName) {
        const isDateSelected = selectedDates.some((date) => {
          const selectedDateObj = new Date(date)
          return selectedDateObj.toDateString() === startDateTimeWIB.toDateString()
        })

        if (!isDateSelected) return

        const displaySchedule = {
          id: schedule.id,
          name: schedule.agenda || "No Title",
          startHour: startDateTimeWIB.getHours(),
          startMinute: startDateTimeWIB.getMinutes(),
          endHour: endDateTimeWIB.getHours(),
          endMinute: endDateTimeWIB.getMinutes(),
          startTime: startDateTimeWIB.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          endTime: endDateTimeWIB.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          location: getLocationDisplay(schedule),
          type: schedule.type || "other",
          color: getTypeColor(schedule.type),
          timezone: "WIB",
          participants: schedule.participants || [],
          originalData: schedule,
          startDateTime: startDateTimeWIB,
          endDateTime: endDateTimeWIB,
          duration: endDateTimeWIB - startDateTimeWIB,
          startMinutes: startDateTimeWIB.getHours() * 60 + startDateTimeWIB.getMinutes(),
          endMinutes: endDateTimeWIB.getHours() * 60 + endDateTimeWIB.getMinutes(),
          createdAt: schedule.createdAt || startDateTimeWIB,
        }

        dayEvents[dayName].push(displaySchedule)
      }
    })

    // Vertical stacking logic
    Object.keys(dayEvents).forEach((dayName) => {
      const events = dayEvents[dayName]

      events.sort((a, b) => {
        const timeDiff = a.startDateTime - b.startDateTime
        if (timeDiff !== 0) return timeDiff
        return new Date(a.createdAt) - new Date(b.createdAt)
      })

      const lanes = []

      events.forEach((event) => {
        let laneIndex = 0
        let placed = false

        for (let i = 0; i < lanes.length; i++) {
          const lastEventInLane = lanes[i][lanes[i].length - 1]

          if (event.startMinutes >= lastEventInLane.endMinutes) {
            lanes[i].push(event)
            laneIndex = i
            placed = true
            break
          }
        }

        if (!placed) {
          lanes.push([event])
          laneIndex = lanes.length - 1
        }

        event.stackIndex = laneIndex
        event.isStacked = lanes.length > 1
      })

      events.forEach((event) => {
        event.totalLanes = lanes.length
      })

      const timeSlotGroups = {}
      events.forEach((event) => {
        const timeSlot = `${event.startHour.toString().padStart(2, "0")}:00`

        if (!timeSlotGroups[timeSlot]) {
          timeSlotGroups[timeSlot] = []
        }
        timeSlotGroups[timeSlot].push(event)
      })

      Object.keys(timeSlotGroups).forEach((timeSlot) => {
        if (!processed[dayName][timeSlot]) {
          processed[dayName][timeSlot] = []
        }
        processed[dayName][timeSlot] = timeSlotGroups[timeSlot]
      })
    })

    return processed
  }, [schedules, selectedDates, parseUTCToLocal, getLocationDisplay, getTypeColor])

  // Calculate day row heights
  const dayRowHeights = useMemo(() => {
    const heights = {}

    DAYS.forEach((day) => {
      let maxStacks = 1
      let hasEvents = false

      Object.values(processedSchedules[day.full] || {}).forEach((eventsInSlot) => {
        if (eventsInSlot.length > 0) {
          hasEvents = true
          eventsInSlot.forEach((event) => {
            if (event.totalLanes) {
              maxStacks = Math.max(maxStacks, event.totalLanes)
            }
          })
        }
      })

      if (hasEvents) {
        const visibleStacks = Math.min(maxStacks, GRID_CONFIG.maxVisibleStacks)
        let totalHeight = GRID_CONFIG.dayPaddingTop + GRID_CONFIG.dayPaddingBottom

        for (let i = 0; i < visibleStacks; i++) {
          if (maxStacks === 1) {
            totalHeight += GRID_CONFIG.scheduleBaseHeight
          } else {
            totalHeight += GRID_CONFIG.scheduleStackedHeight
          }

          if (i < visibleStacks - 1) {
            totalHeight += GRID_CONFIG.laneSpacing
          }
        }

        heights[day.full] = Math.max(totalHeight, GRID_CONFIG.minDayRowHeight)
      } else {
        heights[day.full] = GRID_CONFIG.minDayRowHeight
      }
    })

    return heights
  }, [processedSchedules])

  const getDayRowTop = useCallback(
    (dayIndex) => {
      let top = 0
      for (let i = 0; i < dayIndex; i++) {
        const dayName = DAYS[i]?.full
        top += dayRowHeights[dayName] || GRID_CONFIG.minDayRowHeight
      }
      return top
    },
    [dayRowHeights],
  )

  const totalGridHeight = useMemo(() => {
    return Object.values(dayRowHeights).reduce((sum, height) => sum + height, 0)
  }, [dayRowHeights])

  const calculateEventWidth = useCallback(
    (startHour, startMinute, endHour, endMinute) => {
      const startPos = timeToPosition(startHour, startMinute)
      const endPos = timeToPosition(endHour, endMinute)
      const width = Math.max(endPos - startPos, GRID_CONFIG.hourWidth * 0.4)

      return width
    },
    [timeToPosition],
  )

  const handleScheduleClick = useCallback(
    (event, scheduleData) => {
      event.preventDefault()
      event.stopPropagation()

      if (!isDragging) {
        onScheduleClick && onScheduleClick(scheduleData.originalData || scheduleData)
      }
    },
    [isDragging, onScheduleClick],
  )

  const handleScroll = useCallback((e) => {
    setScrollLeft(e.target.scrollLeft)
    setScrollTop(e.target.scrollTop)
  }, [])

  // Initialize drag handler
  const { getTimeFromPosition, handleMouseDown, handleMouseMove, handleMouseUp } = useDragHandler({
    viewportRef,
    scrollLeft,
    scrollTop,
    dayRowHeights,
    getDateFromDayIndex,
    selectedDates,
    onTimeSlotSelect,
  })

  // Mouse event handlers
  const onMouseDown = useCallback((e) => {
    handleMouseDown(e, {
      getTimeFromPosition: (x, y) => getTimeFromPosition(x, y, getHourDisplayIndex, getActualHour),
      setDragStartPos,
      setSelectedArea,
      setIsDragging,
      setDragTimeTooltip,
    })
  }, [handleMouseDown, getTimeFromPosition, getHourDisplayIndex, getActualHour])

  const onMouseMove = useCallback((e) => {
    handleMouseMove(e, {
      isDragging,
      dragStartPos,
      getTimeFromPosition: (x, y) => getTimeFromPosition(x, y, getHourDisplayIndex, getActualHour),
      setSelectedArea,
      setDragTimeTooltip,
      getDayRowTop,
    })
  }, [handleMouseMove, isDragging, dragStartPos, getTimeFromPosition, getHourDisplayIndex, getActualHour, getDayRowTop])

  const onMouseUp = useCallback(() => {
    handleMouseUp(isDragging, selectedArea, dragStartPos, () => {
      setIsDragging(false)
      setSelectedArea(null)
      setDragStartPos(null)
      setDragTimeTooltip(null)
    })
  }, [handleMouseUp, isDragging, selectedArea, dragStartPos])

  // Auto-scroll to current day when today is in selected week
  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (isCurrentDateInSelectedWeek && viewportRef.current) {
      const currentDayIndex = (today.getDay() + 6) % 7

      let dayTop = 0
      for (let i = 0; i < currentDayIndex; i++) {
        const dayName = DAYS[i]?.full
        dayTop += dayRowHeights[dayName] || GRID_CONFIG.minDayRowHeight
      }

      const scrollContainer = viewportRef.current
      const targetScrollTop = Math.max(0, dayTop - 10)

      scrollContainer.scrollTop = targetScrollTop
    }
  }, [isCurrentDateInSelectedWeek, dayRowHeights])

  // Global mouse event handlers
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }
  }, [isDragging, onMouseMove, onMouseUp])

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const isTodayInCurrentWeek = useMemo(() => {
    if (!weekStartDate) return false
    const weekStart = new Date(weekStartDate)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    return today >= weekStart && today <= weekEnd
  }, [weekStartDate, today])

  return (
    <div
      className="rounded-md border border-zinc-400 bg-white select-none transition-all duration-300"
      style={{
        width: "100%",
        height: `${actualHeight}px`,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <ScheduleHeader headerHeight={GRID_CONFIG.headerHeight} />

      {/* Grid Container */}
      <div className="relative overflow-hidden" style={{ height: `${actualHeight - GRID_CONFIG.headerHeight}px` }}>
        {/* Time Header */}
        <ScheduleTimeHeader 
          dayColumnWidth={GRID_CONFIG.dayColumnWidth} 
          scrollLeft={scrollLeft} 
        />

        {/* Day Column */}
        <ScheduleDayColumn
          dayRowHeights={dayRowHeights}
          scrollTop={scrollTop}
          getDateFromDayIndex={getDateFromDayIndex}
          today={today}
          isTodayInCurrentWeek={isTodayInCurrentWeek}
        />

        {/* Scrollable Content Area */}
        <div
          className="absolute"
          style={{
            left: `${GRID_CONFIG.dayColumnWidth}px`,
            top: `${GRID_CONFIG.timeHeaderHeight}px`,
            right: "0px",
            bottom: "0px",
            zIndex: Z_INDICES.SCROLL_CONTENT,
          }}
        >
          <div ref={viewportRef} className="w-full h-full overflow-x-scroll overflow-y-auto" onScroll={handleScroll}>
            <div
              className="relative"
              style={{
                width: `${TIME_SLOTS.length * GRID_CONFIG.hourWidth}px`,
                height: `${totalGridHeight}px`,
                minWidth: `${TIME_SLOTS.length * GRID_CONFIG.hourWidth}px`,
                paddingLeft: `${GRID_CONFIG.paddingOffset}px`,
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  zIndex: Z_INDICES.BACKGROUND,
                  backgroundColor: "transparent",
                  cursor: isDragging ? "grabbing" : "cell",
                }}
                onMouseDown={onMouseDown}
              />

              {/* Day separator lines */}
              {DAYS.map((day, i) => {
                if (i === 0) return null
                const top = getDayRowTop(i)
                return (
                  <div
                    key={`separator-${i}`}
                    className="absolute left-0 right-0 pointer-events-none"
                    style={{
                      top: `${top}px`,
                      height: "1px",
                      backgroundColor: "#8B8B8B",
                      zIndex: Z_INDICES.DAY_ROW_LINES,
                    }}
                  />
                )
              })}

              {/* Schedule events */}
              <ScheduleEventRenderer
                processedSchedules={processedSchedules}
                timeToPosition={timeToPosition}
                calculateEventWidth={calculateEventWidth}
                getDayRowTop={getDayRowTop}
                handleScheduleClick={handleScheduleClick}
              />

              {/* Empty states */}
              <ScheduleEmptyStates
                selectedDates={selectedDates}
                processedSchedules={processedSchedules}
                dayRowHeights={dayRowHeights}
                getDayRowTop={getDayRowTop}
              />

              {/* Selection box */}
              <ScheduleSelectionBox
                selectedArea={selectedArea}
                isDragging={isDragging}
                getDayRowTop={getDayRowTop}
                dayRowHeights={dayRowHeights}
              />
            </div>
          </div>
        </div>

        {/* Current time line */}
        <ScheduleTimeIndicator
          isCurrentDateInSelectedWeek={isCurrentDateInSelectedWeek}
          timeToPosition={timeToPosition}
          dayColumnWidth={GRID_CONFIG.dayColumnWidth}
          paddingOffset={GRID_CONFIG.paddingOffset}
          totalGridHeight={totalGridHeight}
          timeHeaderHeight={GRID_CONFIG.timeHeaderHeight}
          scrollLeft={scrollLeft}
          zIndex={Z_INDICES.CURRENT_TIME}
        />

        {/* Tooltip */}
        {dragTimeTooltip && (
          <div
            className="absolute pointer-events-none bg-black text-white text-xs px-2 py-1 rounded shadow-lg"
            style={{
              left: `${dragTimeTooltip.x + 10}px`,
              top: `${dragTimeTooltip.y - 30}px`,
              zIndex: Z_INDICES.TOOLTIP,
            }}
          >
            {dragTimeTooltip.startTime} - {dragTimeTooltip.endTime}
          </div>
        )}
      </div>
    </div>
  )
}

export default ScheduleGrid
