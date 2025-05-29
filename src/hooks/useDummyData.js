// hooks/useDummyData.js - Dummy data helper untuk development
export const useDummyData = () => {
    // Notes untuk setiap bulan
    const monthlyNotes = {
      1: "Catatan untuk bulan Januari. Menunjukkan perkembangan yang baik dalam hal adaptasi dan kemampuan sosial.",
      2: "Catatan untuk bulan Februari. Performa stabil dengan peningkatan kecil dalam motivasi belajar.",
      3: "Catatan untuk bulan Maret. Mengalami kemajuan signifikan dalam aspek kemandirian dan tanggung jawab.",
      4: "Catatan untuk bulan April. Sedikit penurunan konsentrasi, tetapi masih dalam batas normal.",
      5: "Catatan untuk bulan Mei. Kembali ke performa baik dengan peningkatan fokus dan disiplin.",
      6: "Catatan untuk bulan Juni. Stabilitas emosi sangat baik, siap untuk tantangan berikutnya.",
      7: "Catatan untuk bulan Juli. Menunjukkan ketahanan yang baik dalam menghadapi tekanan.",
      8: "Catatan untuk bulan Agustus. Motivasi meningkat dengan baik, lebih bersemangat.",
      9: "Catatan untuk bulan September. Kemampuan sosial meningkat secara konsisten.",
      10: "Catatan untuk bulan Oktober. Performa stabil dengan peningkatan kemampuan analisis.",
      11: "Catatan untuk bulan November. Stabilitas emosi sangat baik, adaptasi cepat.",
      12: "Catatan untuk bulan Desember. Akhir tahun ditutup dengan perkembangan positif di semua aspek."
    };
  
    // Status untuk setiap bulan (1: at_risk, 2: monitored, 3: stable)
    const monthlyStatus = {
      1: "at_risk",
      2: "monitored",
      3: "stable",
      4: "monitored",
      5: "monitored",
      6: "stable",
      7: "stable",
      8: "monitored",
      9: "at_risk",
      10: "monitored",
      11: "stable",
      12: "stable"
    };
  
    // Fungsi untuk mendapatkan note berdasarkan bulan
    const getNoteByMonth = (month) => {
      return monthlyNotes[month] || "Belum ada catatan perkembangan";
    };
  
    // Fungsi untuk mendapatkan status berdasarkan bulan
    const getStatusByMonth = (month) => {
      return monthlyStatus[month] || "stable";
    };
  
    // Fungsi untuk menghasilkan data history untuk 12 bulan
    const generateMentalHealthHistory = () => {
      const currentYear = new Date().getFullYear();
      const histories = [];
  
      for (let month = 1; month <= 12; month++) {
        histories.push({
          id: `dummy-${month}`,
          type: "screening",
          date: new Date(currentYear, month - 1, 15).toISOString(),
          status: getStatusByMonth(month),
          notes: getNoteByMonth(month)
        });
      }
  
      return histories;
    };
  
    return {
      monthlyNotes,
      monthlyStatus,
      getNoteByMonth,
      getStatusByMonth,
      generateMentalHealthHistory
    };
  };
  