import BookingContainer from "../../../components/shared/booking/BookingContainer"

const StudentBookingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <BookingContainer userType="student" className="pb-6" showTopRightControl={true} />
    </div>
  )
}

export default StudentBookingPage
