// src/components/shared/schedule/CounselingQueue.jsx - Fixed Height with Infinite Scroll

import { useState, useEffect } from "react";

const CounselingQueue = ({ 
  containerWidth = 808,
  sidebarExpanded = false 
}) => {
  const [queueData, setQueueData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Sample data as shown in Figma - expandable for infinite scroll
  const allQueueData = [
    {
      id: 1,
      nama: "Armani",
      kategori: "Berisiko",
      tanggal: "03.06.25",
      waktu: "10.00",
      lokasi: "Daring",
      keterangan: "Pertama"
    },
    {
      id: 2,
      nama: "Comenni",
      kategori: "Berisiko", 
      tanggal: "03.06.25",
      waktu: "10.00",
      lokasi: "Jiwaku Sehat",
      keterangan: "Pertama"
    },
    {
      id: 3,
      nama: "Elberto",
      kategori: "Berisiko",
      tanggal: "03.06.25", 
      waktu: "10.00",
      lokasi: "Daring",
      keterangan: "Pertama"
    },
    {
      id: 4,
      nama: "Berthold",
      kategori: "Berisiko",
      tanggal: "03.06.25",
      waktu: "10.00", 
      lokasi: "My Life is Good",
      keterangan: "Pertama"
    },
    {
      id: 5,
      nama: "Berthold",
      kategori: "Berisiko",
      tanggal: "03.06.25",
      waktu: "10.00",
      lokasi: "Daring", 
      keterangan: "Pertama"
    },
    // Additional data for infinite scroll demo
    {
      id: 6,
      nama: "Sarah",
      kategori: "Berisiko",
      tanggal: "04.06.25",
      waktu: "11.00",
      lokasi: "Daring",
      keterangan: "Kedua"
    },
    {
      id: 7,
      nama: "Michael",
      kategori: "Berisiko",
      tanggal: "04.06.25",
      waktu: "11.30",
      lokasi: "Offline",
      keterangan: "Pertama"
    },
    {
      id: 8,
      nama: "Jessica",
      kategori: "Berisiko",
      tanggal: "04.06.25",
      waktu: "12.00",
      lokasi: "Jiwaku Sehat",
      keterangan: "Pertama"
    }
  ];

  useEffect(() => {
    // Load initial data (first 5 items)
    setQueueData(allQueueData.slice(0, 5));
  }, []);

  const loadMoreData = () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setTimeout(() => {
      const currentCount = queueData.length;
      const newData = allQueueData.slice(currentCount, currentCount + 3);
      
      if (newData.length > 0) {
        setQueueData(prev => [...prev, ...newData]);
      } else {
        setHasMore(false);
      }
      setIsLoading(false);
    }, 500);
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 5) {
      loadMoreData();
    }
  };

  // CORRECT dimensions from Figma: 808x329px 
  const baseWidth = 808;
  const baseHeight = 329; // CORRECT height as per original Figma design
  const actualWidth = Math.max(baseWidth, containerWidth);
  const actualHeight = baseHeight;

  // Header height consistent with other components
  const headerHeight = 66;
  // Content area should fill the remaining space
  const contentHeight = actualHeight - headerHeight; // 329 - 66 = 263px

  // Custom scrollbar styles
  const scrollbarStyles = {
    scrollbarWidth: 'thin',
    scrollbarColor: '#CBD5E0 #F7FAFC',
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
        height: `${actualHeight}px` // Fixed height for alignment
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
      </header>

      {/* Table Header + Content Area - Correct 263px height for CounselingQueue */}
      <div 
        className="flex flex-col overflow-hidden"
        style={{ height: `${contentHeight}px` }} // Exactly 263px for CounselingQueue
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
          {queueData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-zinc-500">Belum ada antrean</p>
            </div>
          ) : (
            <div 
              className="h-full overflow-y-auto queue-scrollbar"
              onScroll={handleScroll}
              style={scrollbarStyles}
            >
              <div className="w-full">
                {queueData.map((item, index) => (
                  <div key={item.id}>
                    <div className="px-9 py-3 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-6 gap-4 lg:gap-8 items-center">
                        <div className="text-sm font-normal text-[#535353]">
                          {item.nama}
                        </div>
                        <div className="text-sm font-normal text-[#FF6B6B]">
                          {item.kategori}
                        </div>
                        <div className="text-sm font-normal text-[#535353]">
                          {item.tanggal}
                        </div>
                        <div className="text-sm font-normal text-[#535353]">
                          {item.waktu}
                        </div>
                        <div className="text-sm font-normal text-[#535353]">
                          {item.lokasi}
                        </div>
                        <div className="text-sm font-normal text-[#535353]">
                          {item.keterangan}
                        </div>
                      </div>
                    </div>
                    {/* Gradient Divider */}
                    {index < queueData.length - 1 && (
                      <div className="h-px w-full bg-gradient-to-r from-white via-[#488BBE] to-white" />
                    )}
                  </div>
                ))}

                {/* Loading indicator */}
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
                {!hasMore && queueData.length > 0 && (
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
    </div>
  );
};

export default CounselingQueue;