import SchedulePage from "../../../components/shared/schedule/SchedulePage.jsx";

const CompanySchedule = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <SchedulePage
        type="company"
        className="pb-6"
        showTopRightControl={false}
      />
    </div>
  );
};

export default CompanySchedule;