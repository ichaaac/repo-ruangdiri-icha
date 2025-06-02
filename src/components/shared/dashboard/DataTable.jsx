// src/components/shared/dashboard/DataTable.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Reusable data table component for dashboard
 */
const DataTable = ({ 
  type = 'student', 
  data = [], 
  onRowClick,
  showPagination = true,
  maxRows = 10 
}) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState(null);

  const totalPages = Math.ceil(data.length / maxRows);
  const startIndex = (currentPage - 1) * maxRows;
  const endIndex = startIndex + maxRows;
  const currentData = data.slice(startIndex, endIndex);

  const handleRowClick = (item) => {
    setSelectedRow(item.id);
    if (onRowClick) {
      onRowClick(item);
    }
  };

  const handleDetailClick = (item) => {
    const basePath = type === 'student' 
      ? '/organization/school/student' 
      : '/organization/company/employee';
    navigate(`${basePath}/${item.id}`);
  };

  const getColumns = () => {
    if (type === 'student') {
      return [
        { key: 'fullName', label: 'Nama', width: '25%' },
        { key: 'classroom', label: 'Kelas', width: '15%' },
        { key: 'gender', label: 'Jenis Kelamin', width: '15%' },
        { key: 'nis', label: 'NIS', width: '20%' },
        { key: 'actions', label: '', width: '25%' }
      ];
    } else {
      return [
        { key: 'fullName', label: 'Nama', width: '25%' },
        { key: 'department', label: 'Departemen', width: '20%' },
        { key: 'position', label: 'Jabatan', width: '20%' },
        { key: 'employeeId', label: 'ID Karyawan', width: '15%' },
        { key: 'actions', label: '', width: '20%' }
      ];
    }
  };

  const columns = getColumns();

  const renderCellContent = (item, column) => {
    switch (column.key) {
      case 'fullName':
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
              <img
                src={item.profilePicture || `https://i.pravatar.cc/40?u=${item.id}`}
                alt={item.fullName}
                className="object-cover w-full h-full"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.fullName)}&background=488BBE&color=fff`;
                }}
              />
            </div>
            <span className="text-[#8B8B8B] font-medium">{item.fullName}</span>
          </div>
        );
      case 'gender':
        return <span className="text-[#8B8B8B]">{item.gender === 'male' ? 'L' : 'P'}</span>;
      case 'classroom':
        return <span className="text-[#8B8B8B]">{item.classroom || '-'}</span>;
      case 'department':
        return <span className="text-[#8B8B8B]">{item.department || '-'}</span>;
      case 'position':
        return <span className="text-[#8B8B8B]">{item.position || '-'}</span>;
      case 'nis':
        return <span className="text-[#8B8B8B]">{item.nis || '-'}</span>;
      case 'employeeId':
        return <span className="text-[#8B8B8B]">{item.employeeId || '-'}</span>;
      case 'actions':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDetailClick(item);
            }}
            className="text-[#488BBE] hover:underline text-sm"
          >
            Lihat Detail
          </button>
        );
      default:
        return <span className="text-[#8B8B8B]">{item[column.key] || '-'}</span>;
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-8 text-center">
          <span className="material-icons text-gray-400 text-4xl mb-4 block">
            {type === 'student' ? 'school' : 'business'}
          </span>
          <p className="text-gray-500">
            Tidak ada data {type === 'student' ? 'siswa' : 'karyawan'} untuk ditampilkan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Table header */}
      <div className="grid bg-[#f5f5f7] p-3 font-medium" style={{ gridTemplateColumns: columns.map(col => col.width).join(' ') }}>
        {columns.map((column) => (
          <div key={column.key} className="text-[#488BBE] text-sm">
            {column.label}
          </div>
        ))}
      </div>

      {/* Table rows */}
      <div className="max-h-[400px] overflow-y-auto">
        {currentData.map((item, index) => (
          <div
            key={item.id}
            className={`grid p-3 border-b border-zinc-200 items-center relative transition-all hover:bg-gray-50 cursor-pointer ${
              selectedRow === item.id ? "bg-[#f5f5f7]" : ""
            }`}
            style={{ gridTemplateColumns: columns.map(col => col.width).join(' ') }}
            onClick={() => handleRowClick(item)}
          >
            {columns.map((column) => (
              <div key={column.key} className="text-sm">
                {renderCellContent(item, column)}
              </div>
            ))}

            {/* Orange highlight for selected row */}
            {selectedRow === item.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#ED8768]"></div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex justify-center p-4 gap-2">
          <button 
            className="w-8 h-8 flex items-center justify-center text-[#8B8B8B] hover:bg-gray-100 rounded-md disabled:opacity-50"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            «
          </button>
          <button 
            className="w-8 h-8 flex items-center justify-center text-[#8B8B8B] hover:bg-gray-100 rounded-md disabled:opacity-50"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            ‹
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <button 
                key={pageNum}
                className={`w-8 h-8 flex items-center justify-center rounded-md ${
                  currentPage === pageNum ? "bg-[#488BBE] text-white" : "text-[#8B8B8B] hover:bg-gray-100"
                }`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button 
            className="w-8 h-8 flex items-center justify-center text-[#8B8B8B] hover:bg-gray-100 rounded-md disabled:opacity-50"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            ›
          </button>
          <button 
            className="w-8 h-8 flex items-center justify-center text-[#8B8B8B] hover:bg-gray-100 rounded-md disabled:opacity-50"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            »
          </button>
        </div>
      )}
    </div>
  );
};

export default DataTable;