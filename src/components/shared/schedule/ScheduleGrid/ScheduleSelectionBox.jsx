// src/components/shared/schedule/components/ScheduleSelectionBox.jsx

import { GRID_CONFIG, Z_INDICES, DAYS } from "./scheduleGridConfig";

const ScheduleSelectionBox = ({ 
  selectedArea, 
  isDragging, 
  getDayRowTop, 
  dayRowHeights 
}) => {
  if (!selectedArea || !isDragging) return null;

  const startDayIndex = Math.min(selectedArea.startDay, selectedArea.endDay);
  const endDayIndex = Math.max(selectedArea.startDay, selectedArea.endDay);
  const startPixelX = Math.min(selectedArea.startPixelX, selectedArea.endPixelX);
  const endPixelX = Math.max(selectedArea.startPixelX, selectedArea.endPixelX);

  const top = getDayRowTop(startDayIndex);
  let height = 0;
  for (let i = startDayIndex; i <= endDayIndex; i++) {
    const dayName = DAYS[i]?.full;
    height += dayRowHeights[dayName] || GRID_CONFIG.minDayRowHeight;
  }

  const left = GRID_CONFIG.paddingOffset + startPixelX + 2;
  const width = Math.max(endPixelX - startPixelX, 30);

  return (
    <div
      className="absolute bg-blue-400/20 border border-blue-400 rounded pointer-events-none"
      style={{
        top,
        left,
        width,
        height,
        zIndex: Z_INDICES.SELECTION_BOX,
      }}
    />
  );
};

export default ScheduleSelectionBox;