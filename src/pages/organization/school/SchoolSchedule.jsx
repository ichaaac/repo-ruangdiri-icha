// src/pages/organization/school/SchoolSchedule.jsx

import SchedulePage from "../../../components/shared/schedule/SchedulePage.jsx";

const SchoolSchedule = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="relative bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Jadwal Sekolah</h1>
              <p className="text-sm text-gray-600 mt-1">
                Kelola jadwal kelas, konseling, dan kegiatan sekolah
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Component with TopRightControl */}
      <SchedulePage 
        type="school"
        className="pb-6"
        showTopRightControl={true}
      />
    </div>
  );
};

export default SchoolSchedule;