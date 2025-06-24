// src/pages/organization/school/SchoolSchedule.jsx

import SchedulePage from "../../../components/shared/schedule/SchedulePage.jsx";

const SchoolSchedule = () => {
  return (
    <div className="min-h-screen bg-gray-50">
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