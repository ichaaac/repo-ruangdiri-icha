import SchedulePage from "../../../components/shared/schedule/SchedulePage.jsx";

const SchoolSchedule = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <SchedulePage
        type="school"
        className="pb-6"
        showTopRightControl={false}
      />
    </div>
  );
};

export default SchoolSchedule;