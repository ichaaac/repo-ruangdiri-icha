// src/components/shared/schedule/CounselingQueue.jsx - Backend Integration

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion"; 

// Fungsi truncateText LOKAL untuk CounselingQueue
const truncateLocalText = (text, maxLength = 15) => {
  if (!text) return "";
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

// Komponen Tooltip Custom (mirip HelpTooltip lo)
const CustomTruncateTooltip = ({ text, x, y, show }) => {
  if (!show || !text) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed bg-black/80 text-white text-xs rounded px-2 py-1 shadow-lg z-[9999]"
          style={{
            left: x,
            top: y,
            transform: "translateX(-50%)", // Pusatkan tooltip di bawah elemen
            maxWidth: "200px", // Maksimal lebar tooltip, sesuaikan kebutuhan lo
            whiteSpace: "normal", // Izinkan teks untuk wrap ke baris baru
            wordBreak: "break-word", // Pastikan kata panjang juga bisa pecah baris
            // --- Perubahan di sini, Admiral! ---
            overflow: "hidden", // Sembunyikan konten yang overflow
            textOverflow: "ellipsis", // Tambahkan ellipsis di akhir
            display: "-webkit-box", // Aktifkan multi-line ellipsis
            webkitLineClamp: 3, // Maksimal 3 baris sebelum ellipsis (sesuaikan angka ini)
            webkitBoxOrient: "vertical", // Orientasi vertikal untuk webkit-line-clamp
            // ------------------------------------
          }}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
        >
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  );
};


const CounselingQueue = ({ 
  containerWidth = 808,
  sidebarExpanded = false,
  queueData = [], // Real data from backend
  loading = false
}) => {
  const [displayData, setDisplayData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // State untuk mengontrol tooltip lokasi dan keterangan
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [hoveredKeterangan, setHoveredKeterangan] = useState(null);

  useEffect(() => {
    // Set the real data from backend
    setDisplayData(queueData);
    setHasMore(queueData.length > 0); // Only show "load more" if there's data
  }, [queueData]);

  const loadMoreData = () => {
    if (isLoading || !hasMore || loading) return;

    setIsLoading(true);
    // Simulate loading more data (for pagination when implemented)
    setTimeout(() => {
      setHasMore(false); // No more data to load for now
      setIsLoading(false);
    }, 500);
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 5) {
      loadMoreData();
    }
  };

  // Correct dimensions from Figma: 808x329px 
  const baseWidth = 808;
  const baseHeight = 329;
  const actualWidth = Math.max(baseWidth, containerWidth);
  const actualHeight = baseHeight;

  // Header height consistent with other components
  const headerHeight = 66;
  const contentHeight = actualHeight - headerHeight;

  // Custom scrollbar styles
  const scrollbarStyles = {
    scrollbarWidth: 'thin',
    scrollbarColor: '#CBD5E0 #F7FAFA', 
  };

  // Add custom scrollbar CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .queue-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .queue-scrollbar::-webkit-scrollbar-track {
        background: #F7FAFC;
        border-radius: 2px;
      }
      .queue-scrollbar::-webkit-scrollbar-thumb {
        background: #CBD5E0;
        border-radius: 2px;
      }
      .queue-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #A0AEC0;
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div 
      className="w-full rounded-md border border-zinc-500 bg-white transition-all duration-300 overflow-hidden"
      style={{ 
        width: `${actualWidth}px`,
        height: `${actualHeight}px`
      }}
    >
      
      {/* Header */}
      <header 
        className="flex items-center px-5 py-3 border-b border-zinc-200" 
        style={{ height: `${headerHeight}px` }}
      >
        <div className="flex items-center gap-x-[15px]">
          <div className="w-[30px] h-[30px] bg-[#488BBE] rounded flex items-center justify-center flex-shrink-0">
            <span className="material-icons text-white text-lg">people</span>
          </div>
          <h2 className="text-xl font-semibold text-[#488BBA]">
            Antrean Konseling
          </h2>
        </div>
        {loading && (
          <div className="ml-auto text-sm text-gray-500">Loading...</div>
        )}
      </header>

      {/* Table Header + Content Area */}
      <div 
        className="flex flex-col overflow-hidden"
        style={{ height: `${contentHeight}px` }}
      >
        {/* Table Header */}
        <div className="bg-[#E8F5FF] px-9 py-2 border-b border-zinc-200 flex-shrink-0">
          <div className="grid grid-cols-6 gap-4 lg:gap-8 items-center">
            <div className="text-sm font-bold text-[#488BBA]">Nama</div>
            <div className="text-sm font-bold text-[#488BBA]">Kategori</div>
            <div className="text-sm font-bold text-[#488BBA]">Tanggal</div>
            <div className="text-sm font-bold text-[#488BBA]">Waktu</div>
            <div className="text-sm font-bold text-[#488BBA]">Lokasi</div>
            <div className="text-sm font-bold text-[#488BBA]">Ket</div>
          </div>
        </div>

        {/* Scrollable Table Content */}
        <div className="bg-white flex-1 overflow-hidden">
          {loading && displayData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[#488BBA] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-zinc-500">Memuat antrean...</p>
              </div>
            </div>
          ) : displayData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-zinc-500">Belum ada antrean konseling</p>
            </div>
          ) : (
            <div 
              className="h-full overflow-y-auto queue-scrollbar"
              onScroll={handleScroll}
              style={scrollbarStyles}
            >
              <div className="w-full">
                {displayData.map((item, index) => {
                  const displayLocation = item.lokasi || item.location || "TBD";
                  const displayKeterangan = item.status || item.keterangan || "Pertama";
                  const displayNama = item.name;

                  return (
                    <div key={item.id || index}>
                      <div className="px-9 py-3 hover:bg-gray-50 transition-colors">
                        <div className="grid grid-cols-6 gap-4 lg:gap-8 items-center">
                          <div 
                            className="text-sm font-normal text-[#535353] whitespace-nowrap overflow-hidden text-ellipsis"
                          >
                            {truncateLocalText(displayNama, 20)}
                          </div>
                          <div className="text-sm font-normal text-[#FF6B6B]">
                            {item.category}
                          </div>
                          <div className="text-sm font-normal text-[#535353]">
                            {item.date}
                          </div>
                          <div className="text-sm font-normal text-[#535353]">
                            {item.time}
                          </div>
                          <div 
                            className="text-sm font-normal text-[#535353] whitespace-nowrap overflow-hidden text-ellipsis"
                            onMouseEnter={(e) => {
                              // Hanya tampilkan tooltip jika teks ASLI lebih panjang dari maxLength
                              if (displayLocation.length > 15) { 
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoveredLocation({
                                  text: displayLocation,
                                  x: rect.left + rect.width / 2, 
                                  y: rect.bottom + 5, 
                                });
                              }
                            }}
                            onMouseLeave={() => setHoveredLocation(null)}
                          >
                            {truncateLocalText(displayLocation, 15)} 
                          </div>
                          <div 
                            className="text-sm font-normal text-[#535353] whitespace-nowrap overflow-hidden text-ellipsis"
                            onMouseEnter={(e) => {
                              // Hanya tampilkan tooltip jika teks ASLI lebih panjang dari maxLength
                              if (displayKeterangan.length > 15) { 
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoveredKeterangan({
                                  text: displayKeterangan,
                                  x: rect.left + rect.width / 2, 
                                  y: rect.bottom + 5, 
                                });
                              }
                            }}
                            onMouseLeave={() => setHoveredKeterangan(null)}
                          >
                            {truncateLocalText(displayKeterangan, 15)} 
                          </div>
                        </div>
                      </div>
                      {/* Gradient Divider */}
                      {index < displayData.length - 1 && (
                        <div className="h-px w-full bg-gradient-to-r from-white via-[#488BBE] to-white" />
                      )}
                    </div>
                  );
                })}

                {/* Loading indicator for pagination */}
                {isLoading && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
                    <div style={{
                      width: '20px',
                      height: '20px', 
                      border: '2px solid #488BBA',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  </div>
                )}

                {/* No more data */}
                {!hasMore && displayData.length > 0 && (
                  <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                      Semua antrean telah dimuat
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Tooltip untuk Lokasi */}
      <CustomTruncateTooltip 
        text={hoveredLocation?.text} 
        x={hoveredLocation?.x} 
        y={hoveredLocation?.y} 
        show={!!hoveredLocation} 
      />

      {/* Custom Tooltip untuk Keterangan */}
      <CustomTruncateTooltip 
        text={hoveredKeterangan?.text} 
        x={hoveredKeterangan?.x} 
        y={hoveredKeterangan?.y} 
        show={!!hoveredKeterangan} 
      />
    </div>
  );
};

export default CounselingQueue;