// src/components/shared/chats/components/MediaPreviewModal.jsx - FIXED: Hooks Order

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { loadImageWithHeaders, revokeImageUrl } from './utils/imageLoader';

const MediaPreviewModal = ({ 
  isOpen, 
  onClose, 
  mediaItems = [], 
  initialIndex = 0,
  onLoadMore = null,
  hasMoreMedia = false 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageErrors, setImageErrors] = useState(new Set());
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [imageBlobUrl, setImageBlobUrl] = useState('');
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const translateStartRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);
  const clickOffsetRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  // FIXED: Always call hooks in the same order - don't return early before all hooks
  // Update currentIndex when initialIndex changes
  useEffect(() => {
    if (isOpen && initialIndex !== currentIndex) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex, currentIndex]);

  // Handle keyboard events and block typing while modal open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      const allowed = ['Escape', 'ArrowLeft', 'ArrowRight'];
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        goToPrevious();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        goToNext();
        return;
      }
      if (!allowed.includes(e.key)) {
        // Block any other typing/interactions while modal is open
        e.preventDefault();
        e.stopPropagation();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown, true);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen]);

  // Lock body scroll when modal open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Reset zoom/pan when switching media or opening
  useEffect(() => {
    setIsZoomed(false);
    setTranslate({ x: 0, y: 0 });
    movedRef.current = false;
    setZoomOrigin({ x: 50, y: 50 });
  }, [currentIndex, isOpen]);

  // FIXED: Load image with custom headers for ngrok compatibility
  useEffect(() => {
    if (!isOpen || !mediaItems.length) {
      return;
    }

    const currentMedia = mediaItems[currentIndex];
    if (!currentMedia) {
      return;
    }

    const isImage = currentMedia?.attachmentType?.startsWith('image/');
    const attachmentUrl = currentMedia?.attachmentUrl;

    // Only load images with headers if it's an image type
    if (!isImage || !attachmentUrl) {
      return;
    }

    let isMounted = true;
    let currentBlobUrl = '';

    const loadImage = async () => {
      setIsLoadingImage(true);
      setImageErrors(new Set()); // Clear previous errors

      try {
        // Normalize URL
        const fullUrl = attachmentUrl?.startsWith('http') ?
                       attachmentUrl :
                       `https://${attachmentUrl}`;

        // Load image with custom headers
        const blobUrl = await loadImageWithHeaders(fullUrl);

        if (isMounted) {
          currentBlobUrl = blobUrl;
          setImageBlobUrl(blobUrl);
          setIsLoadingImage(false);
        } else {
          // Component unmounted during load, cleanup immediately
          revokeImageUrl(blobUrl);
        }
      } catch (error) {
        console.error('❌ Failed to load preview image with headers:', error);
        if (isMounted) {
          setImageErrors(prev => new Set([...prev, attachmentUrl]));
          setIsLoadingImage(false);
        }
      }
    };

    loadImage();

    // Cleanup: revoke blob URL when component unmounts or media changes
    return () => {
      isMounted = false;
      if (currentBlobUrl) {
        revokeImageUrl(currentBlobUrl);
      }
    };
  }, [currentIndex, isOpen, mediaItems]); // ✅ FIXED: Removed imageBlobUrl from dependencies

  const ZOOM_SCALE = 2;

  const clampTranslate = (tx, ty) => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return { x: tx, y: ty };

    const contW = container.clientWidth;
    const contH = container.clientHeight;
    const baseW = img.offsetWidth; // pre-transform width
    const baseH = img.offsetHeight; // pre-transform height

    const scaledW = baseW * ZOOM_SCALE;
    const scaledH = baseH * ZOOM_SCALE;

    const extraW = Math.max(0, scaledW - contW);
    const extraH = Math.max(0, scaledH - contH);
    // translate is applied AFTER scale; max translate is half of overflow
    const maxX = extraW / 2;
    const maxY = extraH / 2;

    const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
    return {
      x: clamp(tx, -maxX, maxX),
      y: clamp(ty, -maxY, maxY),
    };
  };
  
  // FIXED: Early return AFTER all hooks are called
  if (!isOpen || !mediaItems.length) return null;

  const currentMedia = mediaItems[currentIndex];
  if (!currentMedia) return null;

  const isImage = currentMedia?.attachmentType?.startsWith('image/');
  
  const getFileIcon = (type) => {
    if (type?.includes('pdf')) return 'picture_as_pdf';
    if (type?.includes('word')) return 'description';
    if (type?.includes('excel') || type?.includes('sheet')) return 'table_chart';
    if (type?.includes('zip') || type?.includes('rar')) return 'archive';
    return 'attach_file';
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (hasMoreMedia && onLoadMore) {
      onLoadMore();
    }
  };

  const goToNext = () => {
    if (currentIndex < mediaItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleDownload = async (e) => {
    e.preventDefault();

    try {
      const mediaUrl = currentMedia.attachmentUrl;

      if (!mediaUrl) {
        throw new Error('No media URL available');
      }

      const fullUrl = mediaUrl.startsWith('http') ? mediaUrl : `https://${mediaUrl}`;

      try {
        // FIXED: Add ngrok header for download
        const response = await fetch(fullUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = currentMedia.attachmentName || `attachment_${Date.now()}`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);

      } catch (fetchError) {
        const link = document.createElement('a');
        link.href = fullUrl;
        link.download = 'attachment';
        link.target = '_blank';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleView = (e) => {
    e.preventDefault();
    const mediaUrl = currentMedia.attachmentUrl;
    const fullUrl = mediaUrl?.startsWith('http') ? mediaUrl : `https://${mediaUrl}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  const handleImageError = (e) => {
    const imageUrl = e.currentTarget.src;
    
    setImageErrors(prev => new Set([...prev, imageUrl]));
    
    if (!imageErrors.has(imageUrl)) {
      e.currentTarget.src = '/image-placeholder.svg';
    }
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 sm:bg-black/35 md:bg-black/40 z-[10000] flex items-center justify-center backdrop-blur-[0.5px]"
        onClick={onClose}
      >
        {/* FIXED: Fixed size modal container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden w-[84vw] max-w-[420px] h-[48vh] max-h-[380px]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-2 border-b border-gray-100 bg-gray-50 h-12">
            <div className="flex items-center gap-2">
              <span 
                className="material-icons text-lg"
                style={{ color: '#488BBA' }}
              >
                {isImage ? 'image' : getFileIcon(currentMedia.attachmentType)}
              </span>
              <div>
                <p className="text-sm text-gray-500">
                  {mediaItems.length > 1 && (
                    <span className="text-blue-600">
                      {currentIndex + 1} of {mediaItems.length}
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="Download"
              >
                <span className="material-icons text-gray-600">download</span>
              </button>
              
              {!isImage && (
                <button
                  onClick={handleView}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Open in new tab"
                >
                  <span className="material-icons text-gray-600">open_in_new</span>
                </button>
              )}
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="Close"
              >
                <span className="material-icons text-gray-500">close</span>
              </button>
            </div>
          </div>

          {/* FIXED: Content area with side navigation */}
          <div className="relative h-full bg-gray-100" style={{ height: 'calc(100% - 3rem)' }}>
            {/* FIXED: Left Navigation Button - Positioned on the side */}
            {mediaItems.length > 1 && currentIndex > 0 && (
              <button
                onClick={goToPrevious}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors"
                title="Previous"
              >
                <span className="material-icons">chevron_left</span>
              </button>
            )}

            {/* FIXED: Right Navigation Button - Positioned on the side */}
            {mediaItems.length > 1 && currentIndex < mediaItems.length - 1 && (
              <button
                onClick={goToNext}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors"
                title="Next"
              >
                <span className="material-icons">chevron_right</span>
              </button>
            )}

            {/* Media Content - Fixed container size */}
            <div ref={containerRef} className="w-full h-full flex items-center justify-center p-3 overflow-hidden">
              {isImage ? (
                <>
                  {/* Loading Indicator */}
                  {isLoadingImage && !imageBlobUrl && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                      <span className="text-sm text-gray-500">Loading image...</span>
                    </div>
                  )}

                  {/* Image Display - Using blob URL from fetch with headers */}
                  {!isLoadingImage && imageBlobUrl && (
                    <img
                      ref={imgRef}
                      key={`${currentMedia.id || currentIndex}-${currentIndex}`}
                      src={imageBlobUrl}
                      alt="Attachment"
                      className={`max-w-full max-h-full object-contain rounded-lg select-none ${isZoomed ? (isDragging ? 'cursor-grabbing' : 'cursor-zoom-out') : 'cursor-zoom-in'}`}
                  style={{
                    transformOrigin: '50% 50%',
                    transform: isZoomed 
                      ? `translate(${translate.x}px, ${translate.y}px) scale(${ZOOM_SCALE})` 
                      : 'translate(0px, 0px) scale(1)',
                    transition: isDragging ? 'none' : 'transform 150ms ease-out',
                    willChange: 'transform',
                    touchAction: 'none',
                  }}
                  onPointerDown={(e) => {
                    // Record start point and prepare for drag or click-zoom
                    const rect = e.currentTarget.getBoundingClientRect();
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;
                    clickOffsetRef.current = { x: e.clientX - cx, y: e.clientY - cy };
                    movedRef.current = false;
                    dragStartRef.current = { x: e.clientX, y: e.clientY };
                    translateStartRef.current = translate;
                    if (isZoomed) {
                      setIsDragging(true);
                    }
                    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
                  }}
                  onPointerMove={(e) => {
                    if (!isZoomed || !isDragging) return;
                    const dx = e.clientX - dragStartRef.current.x;
                    const dy = e.clientY - dragStartRef.current.y;
                    if (Math.abs(dx) + Math.abs(dy) > 3) movedRef.current = true;
                    const next = {
                      x: translateStartRef.current.x + dx,
                      y: translateStartRef.current.y + dy,
                    };
                    setTranslate(clampTranslate(next.x, next.y));
                  }}
                  onPointerUp={(e) => {
                    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
                    if (!isZoomed) {
                      // Zoom in on tap/click if not moved
                      if (!movedRef.current) {
                        const desired = { 
                          x: -clickOffsetRef.current.x * ZOOM_SCALE, 
                          y: -clickOffsetRef.current.y * ZOOM_SCALE 
                        };
                        const clamped = clampTranslate(desired.x, desired.y);
                        setTranslate(clamped);
                        setIsZoomed(true);
                      }
                    } else {
                      // When zoomed: if it was just a tap (no drag), toggle zoom out
                      if (!movedRef.current) {
                        setIsZoomed(false);
                        setTranslate({ x: 0, y: 0 });
                      }
                      setIsDragging(false);
                    }
                  }}
                  onPointerCancel={() => {
                    setIsDragging(false);
                  }}
                  draggable={false}
                  onError={handleImageError}
                />
                  )}

                  {/* Error State */}
                  {!isLoadingImage && !imageBlobUrl && imageErrors.size > 0 && (
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-icons text-5xl text-gray-400">broken_image</span>
                      <span className="text-sm text-gray-500">Failed to load image</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <span 
                    className="material-icons text-4xl mb-2 block"
                    style={{ color: '#488BBA' }}
                  >
                    {getFileIcon(currentMedia.attachmentType)}
                  </span>
                  <p className="text-gray-600 mb-4">
                    Document • {currentMedia.attachmentType}
                  </p>
                  
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleView}
                      className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-colors"
                      style={{ backgroundColor: '#488BBA' }}
                    >
                      <span className="material-icons">open_in_new</span>
                      Open
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <span className="material-icons">download</span>
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default MediaPreviewModal;
