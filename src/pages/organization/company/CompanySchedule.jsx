import SchedulePage from "../../../components/shared/schedule/SchedulePage.jsx";
import Breadcrumb from "../../../components/shared/Breadcrumb";

const CompanySchedule = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 pt-4">
        <Breadcrumb items={[
          { label: "Home", to: "/organization/company/dashboard" },
          { label: "Jadwal" },
        ]} />
      </div>
      <SchedulePage
        type="company"
        className="pb-6"
        showTopRightControl={false}
      />
    </div>
  );
};

export default CompanySchedule;