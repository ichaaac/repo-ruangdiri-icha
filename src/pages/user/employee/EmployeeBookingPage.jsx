import React from 'react';
import BookingContainer from "../../../components/shared/booking/BookingContainer";

const EmployeeBookingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <BookingContainer
        userType="employee"
        className="pb-6"
        showTopRightControl={true}
      />
    </div>
  );
};

export default EmployeeBookingPage;
