// src/components/shared/list/FloatingTableScrollbar.jsx - Stable Version
import { useRef, useState, useCallback, useEffect } from "react"
import clsx from "clsx"

const FloatingTableScrollbar = ({ tableRef, sidebarExpanded }) => {
  const scrollbarRef = useRef(null)
  const thumbRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isVisible, setIsVisible] = useState(false) // FIXED: Stable visibility state
  const [scrollInfo, setScrollInfo] = useState({ ratio: 0, thumbWidth: 0 })

  // FIXED: Stable scroll info calculation with proper checks
  const calculateScrollInfo = useCallback(() => {
    if (!tableRef?.current) return null

    const table = tableRef.current
    const scrollWidth = table.scrollWidth
    const clientWidth = table.clientWidth  
    const scrollLeft = table.scrollLeft
    const maxScroll = scrollWidth - clientWidth

    // Only show if there's actually scrollable content
    if (maxScroll <= 0) return null

    const scrollRatio = scrollLeft / maxScroll
    const thumbWidth = Math.max((clientWidth / scrollWidth) * 100, 8)

    return { scrollRatio, thumbWidth, maxScroll }
  }, [tableRef])

  // FIXED: Debounced update to prevent flickering
  const updateScrollbar = useCallback(() => {
    const info = calculateScrollInfo()
    
    if (!info) {
      setIsVisible(false)
      return
    }

    setIsVisible(true)
    setScrollInfo({
      ratio: info.scrollRatio,
      thumbWidth: info.thumbWidth
    })

    // Update thumb position directly
    if (thumbRef.current) {
      const thumbLeft = info.scrollRatio * (100 - info.thumbWidth)
      thumbRef.current.style.left = `${thumbLeft}%`
      thumbRef.current.style.width = `${info.thumbWidth}%`
    }
  }, [calculateScrollInfo])

  // FIXED: Optimized event listeners
  useEffect(() => {
    if (!tableRef?.current) return

    const table = tableRef.current
    let timeoutId = null

    // Debounced handler to prevent excessive updates
    const handleScroll = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(updateScrollbar, 16) // ~60fps
    }

    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(updateScrollbar, 100)
    }

    // Initial update
    updateScrollbar()

    table.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      table.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [tableRef, updateScrollbar])

  // FIXED: Update when sidebar changes with proper delay
  useEffect(() => {
    const timer = setTimeout(updateScrollbar, 350)
    return () => clearTimeout(timer)
  }, [sidebarExpanded, updateScrollbar])

  // FIXED: Stable click handler
  const handleScrollbarClick = useCallback((e) => {
    if (!tableRef?.current || !scrollbarRef.current) return
    if (e.target === thumbRef.current) return

    e.preventDefault()
    
    const rect = scrollbarRef.current.getBoundingClientRect()
    const clickRatio = (e.clientX - rect.left) / rect.width
    const info = calculateScrollInfo()
    
    if (!info) return

    const targetScrollLeft = clickRatio * info.maxScroll
    tableRef.current.scrollTo({
      left: Math.max(0, Math.min(targetScrollLeft, info.maxScroll)),
      behavior: 'smooth'
    })
  }, [tableRef, calculateScrollInfo])

  // FIXED: Stable drag handler
  const handleThumbMouseDown = useCallback((e) => {
    if (!tableRef?.current || !scrollbarRef.current) return

    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)

    const startX = e.clientX
    const startScrollLeft = tableRef.current.scrollLeft
    const scrollbarRect = scrollbarRef.current.getBoundingClientRect()
    const info = calculateScrollInfo()
    
    if (!info) return

    const handleMouseMove = (moveEvent) => {
      if (!tableRef?.current) return

      const deltaX = moveEvent.clientX - startX
      const scrollRatio = deltaX / scrollbarRect.width
      const newScrollLeft = startScrollLeft + (scrollRatio * info.maxScroll)
      
      tableRef.current.scrollLeft = Math.max(0, Math.min(newScrollLeft, info.maxScroll))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [tableRef, calculateScrollInfo])

  // FIXED: Don't render if not visible to prevent blinking
  if (!isVisible) return null

  // FIXED: Simplified positioning without complex calculations
  const sidebarWidth = sidebarExpanded ? 237 : 60
  const padding = 24
  const left = sidebarWidth + padding
  const width = Math.max(window.innerWidth - sidebarWidth - (padding * 2), 300)

  return (
    <div
      className="fixed bottom-4 z-[9998]"
      style={{
        left: `${left}px`,
        width: `${width}px`,
        height: '10px',
        transition: 'left 0.3s ease-out, width 0.3s ease-out', // FIXED: Smooth transition
      }}
    >
      <div
        ref={scrollbarRef}
        className="w-full h-full bg-black/10 hover:bg-black/15 rounded-full cursor-pointer transition-colors duration-150 relative"
        onClick={handleScrollbarClick}
      >
        <div
          ref={thumbRef}
          className={clsx(
            "absolute top-0 h-full rounded-full transition-colors duration-150",
            isDragging ? "bg-[#3399e9]" : "bg-[#488BBE] hover:bg-[#3399e9]"
          )}
          style={{
            left: `${scrollInfo.ratio * (100 - scrollInfo.thumbWidth)}%`,
            width: `${scrollInfo.thumbWidth}%`,
            cursor: isDragging ? "grabbing" : "grab",
            minWidth: '16px',
          }}
          onMouseDown={handleThumbMouseDown}
        />
      </div>
    </div>
  )
}

export default FloatingTableScrollbar