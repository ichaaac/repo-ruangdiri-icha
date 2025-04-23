import SchoolNavbar from "../school/Navbar";
import { Outlet } from "react-router-dom";

export default function ProtectedLayout() {
	return (
		<>
			<SchoolNavbar />
			<Outlet />
		</>
	);
}
