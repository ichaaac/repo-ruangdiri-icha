// src/components/shared/schedule/CounselingQueue.jsx - Fixed Layout Consistency

const CounselingQueue = ({ 
  containerWidth = 808,
  sidebarExpanded = false 
}) => {
  const queueData = [];

  // Base dimensions from Figma: 808x329px
  const baseWidth = 808;
  const baseHeight = 329;
  const actualWidth = Math.max(baseWidth, containerWidth);

  return (
    <div 
      className="w-full rounded-md border border-zinc-500 bg-white transition-all duration-300"
      style={{ 
        width: `${actualWidth}px`,
        height: `${baseHeight}px`
      }}
    >
      
      {/* Header */}
      <header className="flex items-center px-5 py-3 border-b border-zinc-200" style={{ height: '66px' }}>
        <div className="flex items-center gap-x-[15px]">
          <div className="w-[30px] h-[30px] bg-[#488BBE] rounded flex items-center justify-center flex-shrink-0">
            <span className="material-icons text-white text-lg">people</span>
          </div>
          <h2 className="text-xl font-semibold text-[#488BBA]">
            Antrean Konseling
          </h2>
        </div>
      </header>

      {/* Table Header */}
      <div className="bg-[#E8F5FF] px-9 py-3">
        <div className="grid grid-cols-6 gap-4 lg:gap-8">
          <div className="text-sm font-bold text-[#488BBA]">Nama</div>
          <div className="text-sm font-bold text-[#488BBA]">Kategori</div>
          <div className="text-sm font-bold text-[#488BBA]">Tanggal</div>
          <div className="text-sm font-bold text-[#488BBA]">Waktu</div>
          <div className="text-sm font-bold text-[#488BBA]">Lokasi</div>
          <div className="text-sm font-bold text-[#488BBA]">Keterangan</div>
        </div>
      </div>

      {/* Table Content */}
      <div className="min-h-[200px] flex items-center justify-center">
        {queueData.length === 0 ? (
          <p className="text-xs text-zinc-500">Belum ada antrean</p>
        ) : (
          <div className="w-full">
            {/* ... mapping data ... */}
          </div>
        )}
      </div>
    </div>
  );
};

export default CounselingQueue;