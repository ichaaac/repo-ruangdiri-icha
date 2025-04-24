import SchoolSidebar from "../SchoolSidebar";
import { Outlet } from "react-router-dom";

export default function SchoolLayout() {
	return (
		<>
			<SchoolSidebar />
			<Outlet />
		</>
	);
}
