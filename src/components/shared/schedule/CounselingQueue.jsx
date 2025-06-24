// src/components/shared/schedule/CounselingQueue.jsx - Fixed Layout and Sizing

const CounselingQueue = ({ 
  containerWidth = 808,
  sidebarExpanded = false 
}) => {
  // Sample queue data - in real app this would come from props or API
  const queueData = [];

  // Base dimensions (Figma: 808x329)
  const baseWidth = 808;
  const baseHeight = 329;
  const actualWidth = Math.max(baseWidth, containerWidth);
  const actualHeight = baseHeight;

  return (
    <div 
      className="rounded-md border border-zinc-500 bg-white transition-all duration-300"
      style={{ 
        width: `${actualWidth}px`, 
        height: `${actualHeight}px`
      }}
    >
      {/* Header */}
      <header className="flex items-center px-5 py-3 border-b border-zinc-200">
        <div className="w-[30px] h-[30px] bg-[#488BBE] rounded flex items-center justify-center">
          <span className="material-icons text-white text-lg">people</span>
        </div>
        <h2 
          className="text-xl font-semibold text-[#488BBA]" 
          style={{ marginLeft: '15px' }}
        >
          Antrean Konseling
        </h2>
      </header>

      {/* Table Header */}
      <div className="bg-[#E8F5FF] px-9 py-3">
        <div className="grid grid-cols-6 gap-4 lg:gap-20">
          <div className="text-sm font-bold text-[#488BBA]">Nama</div>
          <div className="text-sm font-bold text-[#488BBA]">Kategori</div>
          <div className="text-sm font-bold text-[#488BBA]">Tanggal</div>
          <div className="text-sm font-bold text-[#488BBA]">Waktu</div>
          <div className="text-sm font-bold text-[#488BBA]">Lokasi</div>
          <div className="text-sm font-bold text-[#488BBA]">Ket</div>
        </div>
      </div>

      {/* Table Content */}
      <div className="min-h-[200px] flex items-center justify-center">
        {queueData.length === 0 ? (
          <p className="text-xs text-zinc-500">Belum ada antrean</p>
        ) : (
          <div className="w-full">
            {queueData.map((item, index) => (
              <div key={index} className="grid grid-cols-6 gap-4 lg:gap-20 px-9 py-3 border-b border-zinc-100 last:border-b-0">
                <div className="text-sm text-neutral-600">{item.nama}</div>
                <div className="text-sm text-neutral-600">{item.kategori}</div>
                <div className="text-sm text-neutral-600">{item.tanggal}</div>
                <div className="text-sm text-neutral-600">{item.waktu}</div>
                <div className="text-sm text-neutral-600">{item.lokasi}</div>
                <div className="text-sm text-neutral-600">{item.keterangan}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CounselingQueue;