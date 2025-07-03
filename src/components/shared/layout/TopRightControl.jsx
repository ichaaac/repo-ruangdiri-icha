import React, { useState, useEffect, useRef } from "react";

// Komponen Dropdown Notifikasi
const NotificationDropdown = () => {
  const notifications = [
    {
      icon: "settings",
      title: "Kamu sudah mengubah password kamu",
      time: "3 jam yang lalu",
    },
    {
      icon: "event",
      title: "Antony Martial buat jadwal konseling baru",
      description: "New bookings",
      time: "3 jam yang lalu",
    },
    {
      icon: "check_circle",
      title: "Kamu telah mengirim Laporan Berisiko ke e....",
      time: "3 jam yang lalu",
    },
  ];

  return (
    <div className="absolute right-0 mt-2 w-[395px] max-h-[350px] overflow-y-auto bg-white shadow-lg rounded-b-xl z-50 p-5 flex flex-col gap-4">
      {/* Title */}
      <div className="text-[#488abe] font-semibold text-base">Notifikasi</div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-5 text-sm text-[#535353]">
        <div className="flex items-center gap-1 font-bold underline cursor-pointer">
          Semua
          <span className="bg-[#004881] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            150
          </span>
        </div>
        <div className="font-normal cursor-pointer">Konseling</div>
      </div>

      {/* Date Separator */}
      <div className="text-xs text-[#8a8a8a]">Hari ini</div>

      {/* Notification List */}
      <div className="flex flex-col gap-4">
        {notifications.map((item, idx) => (
          <div key={idx} className="flex gap-3 items-start">
            <i className="material-icons text-[32px] text-[#535353]">
              {item.icon}
            </i>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-[#535353]">{item.title}</p>
              <p className="text-[10px] text-[#8a8a8a]">
                {item.description && (
                  <>
                    <span className="font-medium text-[#535353]">{item.description}</span>
                    <span className="mx-1">|</span>
                  </>
                )}
                {item.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-xs text-[#488abe] text-center mt-2 cursor-pointer hover:underline">
        Lihat semua
      </div>
    </div>
  );
};


// Komponen Utama
const TopRightControl = ({ className = "", isAbsolute = true }) => {
  const [openNotif, setOpenNotif] = useState(false);
  const notifRef = useRef(null); // 1. Membuat Ref

  // 2. Logic untuk menutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Jika ref ada dan klik terjadi di luar area ref
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setOpenNotif(false);
      }
    };

    // Menambahkan event listener saat komponen dimuat
    document.addEventListener("mousedown", handleClickOutside);

    // Membersihkan event listener saat komponen dibongkar (penting!)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notifRef]); // Dependensi array, efek ini hanya berjalan jika notifRef berubah


  const wrapperClass = isAbsolute
    ? "absolute top-[29px] right-[12px]"
    : "flex justify-end w-full";

  return (
    <div className={`${wrapperClass} ${className} flex items-center gap-4 sm:gap-6`}>
      {/* Language Switch */}
      <div className="flex items-center">
        <span className="font-bold text-primary text-sm sm:text-base">ID</span>
        <span className="mx-2 text-primary text-sm sm:text-base">/</span>
        <span className="text-zinc-500 text-sm sm:text-base">EN</span>
      </div>

      {/* Notification Container */}
      {/* 3. Menetapkan Ref ke container notifikasi */}
      <div className="relative" ref={notifRef}>
        <button
          aria-label="Notifications"
          onClick={() => setOpenNotif(!openNotif)} // Toggle dropdown
          className="material-icons text-zinc-500 text-xl sm:text-2xl"
        >
          notifications
        </button>

        {/* Dropdown akan muncul atau hilang berdasarkan state openNotif */}
        {openNotif && <NotificationDropdown />}
      </div>
    </div>
  );
};

export default TopRightControl;