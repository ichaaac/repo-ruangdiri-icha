// Enhanced Smooth Floating Scrollbar - Sleek Design & Sidebar Responsive
import { useMemo, useRef, useState, useCallback, useEffect } from "react"
import clsx from "clsx"

const FloatingTableScrollbar = ({ tableRef, sidebarExpanded }) => {
  const scrollbarRef = useRef(null)
  const thumbRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const rafRef = useRef(null)
  const cleanupRef = useRef(null)

  // Enhanced scroll calculation with caching
  const getScrollInfo = useCallback(() => {
    if (!tableRef.current) return null

    const { scrollLeft, scrollWidth, clientWidth } = tableRef.current
    const maxScroll = scrollWidth - clientWidth

    if (maxScroll <= 5) return null

    const scrollRatio = scrollLeft / maxScroll
    const thumbWidth = Math.max((clientWidth / scrollWidth) * 100, 12)

    return {
      scrollRatio,
      thumbWidth,
      maxScroll,
      tableWidth: clientWidth,
      scrollLeft,
    }
  }, [tableRef])

  // Ultra smooth thumb update with RAF optimization
  const updateThumb = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    rafRef.current = requestAnimationFrame(() => {
      const info = getScrollInfo()
      if (!info || !thumbRef.current) return

      const thumbLeft = info.scrollRatio * (100 - info.thumbWidth)
      
      // Use transform3d for hardware acceleration
      thumbRef.current.style.transform = `translate3d(${thumbLeft}%, 0, 0)`
      thumbRef.current.style.width = `${info.thumbWidth}%`
    })
  }, [getScrollInfo])

  // Setup scrollbar with optimized listeners
  const scrollbarCallback = useCallback((node) => {
    // Cleanup previous
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }

    scrollbarRef.current = node
    if (!node || !tableRef.current) return

    const table = tableRef.current

    // Throttled event handlers for performance
    let scrollTicking = false
    const handleScroll = () => {
      if (!scrollTicking) {
        requestAnimationFrame(() => {
          updateThumb()
          scrollTicking = false
        })
        scrollTicking = true
      }
    }

    let resizeTicking = false
    const handleResize = () => {
      if (!resizeTicking) {
        requestAnimationFrame(() => {
          updateThumb()
          resizeTicking = false
        })
        resizeTicking = true
      }
    }

    // Attach event listeners
    table.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })

    // Initial update
    requestAnimationFrame(updateThumb)

    // Store cleanup function
    cleanupRef.current = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      table.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [updateThumb, tableRef])

  // Enhanced click handling with smooth scroll
  const handleClick = useCallback((e) => {
    if (!tableRef.current || !scrollbarRef.current || e.target === thumbRef.current) return

    e.preventDefault()
    const rect = scrollbarRef.current.getBoundingClientRect()
    const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const info = getScrollInfo()
    if (!info) return

    const targetScrollLeft = percentage * info.maxScroll
    
    // Smooth scroll to target position
    tableRef.current.scrollTo({
      left: Math.max(0, Math.min(targetScrollLeft, info.maxScroll)),
      behavior: 'smooth'
    })
  }, [getScrollInfo, tableRef])

  // Enhanced drag handling with momentum and smooth motion
  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)

    const startX = e.clientX
    const startScrollLeft = tableRef.current?.scrollLeft || 0
    const scrollbarRect = scrollbarRef.current?.getBoundingClientRect()
    const scrollbarWidth = scrollbarRect?.width || 1
    const info = getScrollInfo()
    if (!info) return

    let lastMoveTime = Date.now()
    let velocity = 0

    const handleMouseMove = (moveEvent) => {
      if (!tableRef.current) return

      const currentTime = Date.now()
      const deltaTime = currentTime - lastMoveTime
      const deltaX = moveEvent.clientX - startX
      
      // Calculate velocity for momentum
      if (deltaTime > 0) {
        velocity = deltaX / deltaTime
      }
      
      const percentage = deltaX / scrollbarWidth
      const newScrollLeft = startScrollLeft + percentage * info.maxScroll
      const clampedScrollLeft = Math.max(0, Math.min(newScrollLeft, info.maxScroll))

      // Direct scroll during drag for immediate feedback
      tableRef.current.scrollLeft = clampedScrollLeft
      
      lastMoveTime = currentTime
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      
      // Apply momentum if drag was fast enough
      if (Math.abs(velocity) > 0.3 && tableRef.current) {
        const momentumDistance = velocity * 80 // Adjust multiplier for feel
        const currentScrollLeft = tableRef.current.scrollLeft
        const targetScrollLeft = Math.max(0, Math.min(
          currentScrollLeft + momentumDistance,
          info.maxScroll
        ))
        
        if (Math.abs(targetScrollLeft - currentScrollLeft) > 3) {
          tableRef.current.scrollTo({
            left: targetScrollLeft,
            behavior: 'smooth'
          })
        }
      }
      
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove, { passive: false })
    document.addEventListener('mouseup', handleMouseUp, { passive: true })
  }, [getScrollInfo, tableRef])

  // Update on sidebar state change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updateThumb)
    }, 320) // Wait for sidebar transition
    
    return () => clearTimeout(timeoutId)
  }, [sidebarExpanded, updateThumb])

  // Check if scrollbar is needed
  const currentInfo = getScrollInfo()
  if (!currentInfo) return null

  // Enhanced position calculation with responsive behavior
  const getScrollbarPosition = () => {
    const sidebarWidth = sidebarExpanded ? 237 : 60
    const padding = 24
    const scrollbarLeft = sidebarWidth + padding
    
    // Use actual table width for better accuracy
    const availableWidth = Math.max(currentInfo.tableWidth - padding * 2, 200)
    
    return {
      left: scrollbarLeft,
      width: availableWidth,
    }
  }

  const position = getScrollbarPosition()

  return (
    <div
      className="fixed z-[9998] transition-all duration-300 ease-out pointer-events-none"
      style={{
        bottom: '16px',
        left: `${position.left}px`,
        width: `${position.width}px`,
        height: '16px',
        willChange: 'left, width',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="w-full h-full flex items-center px-1 pointer-events-auto">
        <div
          ref={scrollbarCallback}
          className={clsx(
            "relative w-full rounded-full cursor-pointer transition-all duration-200 ease-out",
            "bg-black/10 hover:bg-black/15 backdrop-blur-sm",
            "border border-white/30 shadow-sm",
            isHovered || isDragging ? "h-3" : "h-2"
          )}
          onClick={handleClick}
          style={{
            willChange: 'height, background-color',
          }}
        >
          {/* Scrollbar thumb */}
          <div
            ref={thumbRef}
            className={clsx(
              "absolute top-0 h-full rounded-full transition-all duration-150 ease-out",
              "shadow-sm border border-white/40",
              isDragging 
                ? "bg-[#3399e9] shadow-md scale-105" 
                : isHovered
                  ? "bg-[#488BBE] shadow-md"
                  : "bg-[#488BBE]/90"
            )}
            style={{
              cursor: isDragging ? "grabbing" : "grab",
              willChange: "transform, width, background-color, box-shadow, scale",
              transformOrigin: "left center",
              minWidth: "16px",
            }}
            onMouseDown={handleMouseDown}
          />
        </div>
      </div>
      
      {/* Subtle glow effect when active */}
      {(isHovered || isDragging) && (
        <div 
          className="absolute inset-0 rounded-full bg-[#488BBE]/5 blur-sm -z-10 transition-opacity duration-300"
          style={{ transform: 'scale(1.2)' }}
        />
      )}
    </div>
  )
}

export default FloatingTableScrollbar