// src/components/shared/TopRightControl.jsx
const TopRightControl = ({ className = "", isAbsolute = true }) => {
    const wrapperClass = isAbsolute
      ? "absolute top-[29px] right-[12px]"
      : "flex justify-end w-full"
  
    return (
      <div className={`${wrapperClass} ${className} flex items-center gap-4 sm:gap-6`}>
        <div className="flex items-center">
          <span className="font-bold text-primary text-sm sm:text-base">ID</span>
          <span className="mx-2 text-primary text-sm sm:text-base">/</span>
          <span className="text-zinc-500 text-sm sm:text-base">EN</span>
        </div>
        <button
          aria-label="Notifications"
          className="material-icons text-zinc-500 text-xl sm:text-2xl"
        >
          notifications
        </button>
      </div>
    )
  }
  
  export default TopRightControl
  