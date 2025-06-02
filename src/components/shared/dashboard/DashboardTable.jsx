// src/components/shared/dashboard/DashboardTable.jsx - Enhanced with better UI
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DashboardTable = ({
  type = "student",
  data = [],
  isLoading = false,
  onClose,
  title = "",
  hasNextPage = false,
  fetchNextPage = () => {},
  isFetchingNextPage = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemSelect = (item) => {
    setSelectedItem(item.id === selectedItem?.id ? null : item);
  };

  const handleDetailClick = (id) => {
    const detailPath =
      type === "student" ? `/organization/school/student/${id}` : `/organization/company/employee/${id}`;
    window.open(detailPath, "_blank");
  };

  if (isLoading) {
    return (
      <div className="bg-blue-100 p-7 rounded-xl">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex justify-between items-center bg-[#f5f5f7] p-3 font-medium">
            <h3 className="text-[#488BBE] font-semibold">{title}</h3>
            <button onClick={onClose} className="text-[#EE4266] hover:opacity-80 transition-opacity">
              <span className="material-icons">cancel</span>
            </button>
          </div>
          <div className="flex justify-center items-center p-8">
            <span className="material-icons animate-spin text-[#488BBE] text-2xl">refresh</span>
            <span className="text-[#488BBE] text-sm ml-2">Memuat data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-blue-100 p-7 rounded-xl">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex justify-between items-center bg-[#f5f5f7] p-3 font-medium">
            <h3 className="text-[#488BBE] font-semibold">{title}</h3>
            <button onClick={onClose} className="text-[#EE4266] hover:opacity-80 transition-opacity">
              <span className="material-icons">cancel</span>
            </button>
          </div>
          <div className="flex flex-col items-center justify-center p-8">
            <span className="material-icons text-gray-400 text-4xl mb-2">
              {type === "student" ? "school" : "business_center"}
            </span>
            <p className="text-gray-500 text-sm">Tidak ada data {type === "student" ? "siswa" : "karyawan"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-100 p-7 rounded-xl">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 bg-[#f5f5f7] p-3 font-medium">
          <div className="col-span-3 text-[#488BBE]">Nama</div>
          {type === "student" ? (
            <>
              <div className="col-span-2 text-[#488BBE]">Kelas</div>
              <div className="col-span-2 text-[#488BBE]">Jenis Kelamin</div>
              <div className="col-span-3 text-[#488BBE]">NIS</div>
            </>
          ) : (
            <>
              <div className="col-span-3 text-[#488BBE]">Departemen</div>
              <div className="col-span-2 text-[#488BBE]">Jenis Kelamin</div>
              <div className="col-span-2 text-[#488BBE]">Usia</div>
            </>
          )}
          <div className="col-span-2 text-right">
            <button onClick={onClose} className="text-[#EE4266] hover:opacity-80 transition-opacity">
              <span className="material-icons">cancel</span>
            </button>
          </div>
        </div>

        {/* Table rows */}
        {data.map((item) => (
          <motion.div
            key={item.id}
            initial={{ backgroundColor: "#ffffff" }}
            whileHover={{ scale: 1.01, backgroundColor: "#f9f9f9" }}
            className={`grid grid-cols-12 p-3 border-b border-zinc-200 items-center relative transition-transform cursor-pointer ${
              selectedItem?.id === item.id ? "bg-[#f5f5f7]" : ""
            }`}
            onClick={() => handleItemSelect(item)}
          >
            <div className="col-span-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                <img
                  src={`https://i.pravatar.cc/40?u=${item.id}`}
                  alt={item.fullName}
                  className="object-cover w-full h-full"
                />
              </div>
              <span className="text-[#8B8B8B]">{item.fullName}</span>
            </div>

            {type === "student" ? (
              <>
                <div className="col-span-2 text-[#8B8B8B]">
                  {item.classroom && item.grade ? `${item.classroom} ${item.grade}` : item.classroom || "-"}
                </div>
                <div className="col-span-2 text-[#8B8B8B]">{item.gender === "male" ? "L" : "P"}</div>
                <div className="col-span-3 text-[#8B8B8B]">{item.nis || "-"}</div>
              </>
            ) : (
              <>
                <div className="col-span-3 text-[#8B8B8B]">{item.department || "-"}</div>
                <div className="col-span-2 text-[#8B8B8B]">{item.gender === "male" ? "L" : "P"}</div>
                <div className="col-span-2 text-[#8B8B8B]">{item.age || "-"}</div>
              </>
            )}

            <div className="col-span-2 text-right">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDetailClick(item.id);
                }}
                className="text-[#488BBE] hover:underline"
              >
                Lihat Detail
              </button>
            </div>

            {/* Orange highlight for selected row */}
            <AnimatePresence>
              {selectedItem?.id === item.id && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-0 left-0 right-0 h-1 bg-[#ED8768]"
                />
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {/* Load more button for infinite scroll */}
        {hasNextPage && (
          <div className="flex justify-center p-4">
            <button
              onClick={fetchNextPage}
              disabled={isFetchingNextPage}
              className="px-4 py-2 bg-[#488BBE] text-white rounded-md hover:bg-[#3399e9] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isFetchingNextPage ? (
                <>
                  <span className="material-icons animate-spin text-sm mr-1">refresh</span>
                  Memuat...
                </>
              ) : (
                "Muat Lebih Banyak"
              )}
            </button>
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-center p-4 gap-2">
          <button className="w-8 h-8 flex items-center justify-center text-[#8B8B8B] hover:bg-gray-100 rounded-md">
            «
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-[#8B8B8B] hover:bg-gray-100 rounded-md">
            ‹
          </button>
          <button
            className={`w-8 h-8 flex items-center justify-center rounded-md ${
              currentPage === 1 ? "bg-[#488BBE] text-white" : "text-[#8B8B8B] hover:bg-gray-100"
            }`}
            onClick={() => handlePageChange(1)}
          >
            1
          </button>
          <button
            className={`w-8 h-8 flex items-center justify-center rounded-md ${
              currentPage === 2 ? "bg-[#488BBE] text-white" : "text-[#8B8B8B] hover:bg-gray-100"
            }`}
            onClick={() => handlePageChange(2)}
          >
            2
          </button>
          <button
            className={`w-8 h-8 flex items-center justify-center rounded-md ${
              currentPage === 3 ? "bg-[#488BBE] text-white" : "text-[#8B8B8B] hover:bg-gray-100"
            }`}
            onClick={() => handlePageChange(3)}
          >
            3
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-[#8B8B8B] hover:bg-gray-100 rounded-md">
            ›
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-[#8B8B8B] hover:bg-gray-100 rounded-md">
            »
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardTable;