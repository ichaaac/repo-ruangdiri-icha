// src/components/shared/dashboard/MetricCard.jsx - Updated design matching the image
import { motion } from "framer-motion";

const MetricCard = ({
  title,
  count,
  total,
  icon,
  color,
  bgColor,
  borderColor,
  isActive,
  onCardClick,
  onReportClick,
}) => {
  const iconMap = {
    warning: "warning",
    assignment: "assignment",
    groups: "groups",
  };

  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl overflow-hidden w-full sm:max-w-[334px] h-[128px] ${
        isActive ? "shadow-md" : "shadow-sm"
      }`}
    >
      {/* Header bar - colored based on card type */}
      <div 
        className="h-3 w-full" 
        style={{ backgroundColor: isActive ? color : "#D9D9D9" }}
      />
      
      {/* Main content */}
      <div className="bg-white p-5 h-[calc(100%-12px)] flex flex-col justify-between">
        <div className="flex justify-between">
          {/* Count number */}
          <motion.h2
            whileHover={{ scale: 1.05 }}
            className={`text-5xl font-bold cursor-pointer ${isActive ? "" : "text-[#D9D9D9]"}`}
            style={{ color: isActive ? color : undefined }}
            onClick={onCardClick}
          >
            {count}
          </motion.h2>
          
          {/* Icon */}
          <div 
            className={`flex flex-col items-center ${isActive ? "" : "text-[#D9D9D9]"}`}
            onClick={isActive ? onReportClick : undefined}
            style={{ cursor: isActive ? "pointer" : "default" }}
          >
            <span 
              className="material-icons text-3xl"
              style={{ color: isActive ? color : undefined }}
            >
              {iconMap[icon]}
            </span>
            <span className="text-xs mt-1">
              Kirim Laporan
            </span>
          </div>
        </div>
        
        {/* Bottom section */}
        <div>
          <p className={`text-sm mb-2 ${isActive ? "text-zinc-600" : "text-[#D9D9D9]"}`}>
            {title}
          </p>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="h-2 rounded-full" 
              style={{ 
                width: `${percentage}%`, 
                backgroundColor: isActive ? color : "#D9D9D9" 
              }}
            />
          </div>
          
          {/* Count text */}
          <p className={`text-sm ${isActive ? "text-zinc-500" : "text-[#D9D9D9]"}`}>
            {count}/{total}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default MetricCard;