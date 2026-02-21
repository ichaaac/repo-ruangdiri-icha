// src/pages/organization/company/CompanySchedule.jsx

import SchedulePage from "../../../components/shared/schedule/SchedulePage.jsx";

const CompanySchedule = () => {
return (
  <div className="min-h-screen bg-gray-50">
    {/* Schedule Component with TopRightControl */}
    <SchedulePage 
      type="company"
      className="pb-6"
      showTopRightControl={false}
    />
  </div>
);
};

export default CompanySchedule;