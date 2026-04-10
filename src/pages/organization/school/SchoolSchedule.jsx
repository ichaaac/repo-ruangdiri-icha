import SchedulePage from "../../../components/shared/schedule/SchedulePage.jsx";
import Breadcrumb from "../../../components/shared/Breadcrumb";

const SchoolSchedule = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 pt-4">
        <Breadcrumb items={[
          { label: "Home", to: "/organization/school/dashboard" },
          { label: "Jadwal" },
        ]} />
      </div>
      <SchedulePage
        type="school"
        className="pb-6"
        showTopRightControl={false}
      />
    </div>
  );
};

export default SchoolSchedule;