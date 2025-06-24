// src/pages/organization/company/CompanySchedule.jsx

import SchedulePage from "../../../components/shared/schedule/SchedulePage.jsx";

const CompanySchedule = () => {
return (
  <div className="min-h-screen bg-gray-50">
    {/* Page Header */}
    <div className="relative bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
          </div>
        </div>
      </div>
    </div>

    {/* Schedule Component with TopRightControl */}
    <SchedulePage 
      type="company"
      className="pb-6"
      showTopRightControl={true}
    />
  </div>
);
};

export default CompanySchedule;