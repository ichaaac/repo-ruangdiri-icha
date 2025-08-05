import { useLocation, useParams } from "react-router-dom"
import BookingSession from "../../../components/shared/booking/BookingSession"

const BookingSessionStandalone = () => {
  const { userType } = useParams()
  const location = useLocation()

  // Get selected method from location state
  const selectedMethod = location.state?.selectedMethod

  return (
    <div className="min-h-screen bg-gray-50">
      <BookingSession userType={userType} selectedMethod={selectedMethod} standalone={true} />
    </div>
  )
}

export default BookingSessionStandalone
