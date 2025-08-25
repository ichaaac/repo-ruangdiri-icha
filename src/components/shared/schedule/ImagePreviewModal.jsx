// src/components/shared/schedule/ImagePreviewModal.jsx

import { useState, useEffect } from "react"

const ImagePreviewModal = ({ isOpen, onClose, imageUrl, imageName = "Image" }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      setHasError(false)
      setZoomLevel(1)
      setImagePosition({ x: 0, y: 0 })
    }
  }, [isOpen, imageUrl])

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = "unset"
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleImageLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 5))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.25))
  }

  const handleZoomReset = () => {
    setZoomLevel(1)
    setImagePosition({ x: 0, y: 0 })
  }

  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y
      })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging && zoomLevel > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Global mouse events for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  const handleWheel = (e) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[10000]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Header Controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="text-white font-medium text-lg max-w-md truncate">
            {imageName}
          </div>
          <div className="text-white/70 text-sm">
            {Math.round(zoomLevel * 100)}%
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <button
            onClick={handleZoomOut}
            className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
            title="Zoom Out"
          >
            <span className="material-icons text-[20px]">zoom_out</span>
          </button>
          
          <button
            onClick={handleZoomReset}
            className="px-3 py-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors text-sm"
            title="Reset Zoom"
          >
            Reset
          </button>
          
          <button
            onClick={handleZoomIn}
            className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
            title="Zoom In"
          >
            <span className="material-icons text-[20px]">zoom_in</span>
          </button>

          {/* Download Button */}
          <a
            href={imageUrl}
            download={imageName}
            className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
            title="Download Image"
          >
            <span className="material-icons text-[20px]">download</span>
          </a>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
            title="Close"
          >
            <span className="material-icons text-[20px]">close</span>
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div 
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onWheel={handleWheel}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <div className="text-white text-sm">Loading image...</div>
            </div>
          </div>
        )}

        {hasError && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-white">
              <span className="material-icons text-[64px] text-white/50">broken_image</span>
              <div className="text-center">
                <div className="text-lg font-medium mb-1">Failed to load image</div>
                <div className="text-sm text-white/70">The image could not be displayed</div>
              </div>
              <button
                onClick={() => {
                  setIsLoading(true)
                  setHasError(false)
                }}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {!hasError && imageUrl && (
          <img
            src={imageUrl}
            alt={imageName}
            onLoad={handleImageLoad}
            onError={handleImageError}
            onMouseDown={handleMouseDown}
            className={`max-w-full max-h-full object-contain transition-transform select-none ${
              zoomLevel > 1 ? 'cursor-grab' : 'cursor-default'
            } ${isDragging ? 'cursor-grabbing' : ''}`}
            style={{
              transform: `scale(${zoomLevel}) translate(${imagePosition.x / zoomLevel}px, ${imagePosition.y / zoomLevel}px)`,
              transformOrigin: 'center center',
              display: isLoading ? 'none' : 'block'
            }}
            draggable={false}
          />
        )}
      </div>

      {/* Instructions */}
      {!isLoading && !hasError && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-black/50 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-4">
            <span>Scroll to zoom</span>
            <span>•</span>
            <span>Drag to pan (when zoomed)</span>
            <span>•</span>
            <span>ESC to close</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImagePreviewModal