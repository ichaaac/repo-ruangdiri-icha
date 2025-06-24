// src/components/shared/schedule/CounselingQueue.jsx

const CounselingQueue = () => {
  // Sample queue data - in real app this would come from props or API
  const queueData = [];

  return (
    <div className="rounded-md border border-zinc-500 bg-white">
      {/* Header */}
      <header className="flex items-center gap-4 px-5 py-3 border-b border-zinc-200">
        <div className="w-[30px] h-[30px] bg-[#488BBE] rounded flex items-center justify-center">
          <span className="material-icons text-white text-lg">people</span>
        </div>
        <h2 className="text-xl font-semibold text-blue-500">Antrean Konseling</h2>
      </header>

      {/* Table Header */}
      <div className="bg-indigo-50 px-9 py-3">
        <div className="grid grid-cols-6 gap-4 lg:gap-20">
          <div className="text-sm font-bold text-blue-500">Nama</div>
          <div className="text-sm font-bold text-blue-500">Kategori</div>
          <div className="text-sm font-bold text-blue-500">Tanggal</div>
          <div className="text-sm font-bold text-blue-500">Waktu</div>
          <div className="text-sm font-bold text-blue-500">Lokasi</div>
          <div className="text-sm font-bold text-blue-500">Ket</div>
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
