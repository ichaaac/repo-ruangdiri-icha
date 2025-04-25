import React from "react";
import { useRoutes } from "react-router-dom";
import routes from "./routeConfig";
/**
 * Main routing component that uses the route configuration array
 * This approach is more maintainable than nested JSX routes
 * 
 * @returns {JSX.Element} The rendered routes based on current location
 */
const AppRoutes = () => {
  const element = useRoutes(routes);
  return element;
};

export default AppRoutes;