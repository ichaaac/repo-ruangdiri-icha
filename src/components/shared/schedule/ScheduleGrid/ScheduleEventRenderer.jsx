// src/components/shared/schedule/components/ScheduleEventRenderer.jsx

import ScheduleEvent from "./ScheduleEvent";
import { GRID_CONFIG, Z_INDICES, DAYS } from "./scheduleGridConfig";

const ScheduleEventRenderer = ({
  processedSchedules,
  timeToPosition,
  calculateEventWidth,
  getDayRowTop,
  handleScheduleClick,
}) => {
  return (
    <>
      {Object.entries(processedSchedules).map(([dayName, timeSlotStacks]) => {
        const dayIndex = DAYS.findIndex((d) => d.full === dayName);
        if (dayIndex === -1) return null;

        const dayTop = getDayRowTop(dayIndex);

        return Object.entries(timeSlotStacks).map(([timeSlot, eventsInSlot]) => {
          if (eventsInSlot.length === 0) return null;

          return eventsInSlot.map((event, eventIndex) => {
            const leftPosition = timeToPosition(event.startHour, event.startMinute);
            const width = calculateEventWidth(
              event.startHour,
              event.startMinute,
              event.endHour,
              event.endMinute,
            );

            const laneIndex = event.stackIndex || 0;

            let laneOffset = 0;
            if (event.totalLanes > 1) {
              laneOffset = laneIndex * (GRID_CONFIG.scheduleStackedHeight + GRID_CONFIG.laneSpacing);
            }

            const top = dayTop + GRID_CONFIG.dayPaddingTop + laneOffset;

            return (
              <ScheduleEvent
                key={`${event.id}-${laneIndex}`}
                event={event}
                style={{
                  left: `${leftPosition + 55}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  zIndex: Z_INDICES.SCHEDULE_EVENTS + laneIndex,
                }}
                onClickEvent={(scheduleData) =>
                  handleScheduleClick({ preventDefault: () => {}, stopPropagation: () => {} }, scheduleData)
                }
                maxVisibleStacks={GRID_CONFIG.maxVisibleStacks}
                stackedHeight={GRID_CONFIG.scheduleStackedHeight}
                baseHeight={GRID_CONFIG.scheduleBaseHeight}
              />
            );
          });
        });
      })}
    </>
  );
};

export default ScheduleEventRenderer;