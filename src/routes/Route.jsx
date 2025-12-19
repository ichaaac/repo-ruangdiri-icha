// src/routes/Routes.jsx - FIXED VERSION
import React, { lazy, Suspense } from "react";
import { useRoutes } from "react-router-dom";
import routes from "./RouteConfig";

/**
 * Loading component for Suspense fallback
 */
const LoadingFallback = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="flex items-center space-x-2">
      <span className="material-icons animate-spin text-primary">sync</span>
      <span className="text-primary">Loading...</span>
    </div>
  </div>
);

/**
 * Main routing component that uses the route configuration array
 * Enhanced with lazy loading and suspense for better performance
 * 
 * @returns {JSX.Element} The rendered routes based on current location
 */
const AppRoutes = () => {
  // ✅ NO CHANGES NEEDED - This file is correct
  // Just use routes as-is
  const element = useRoutes(routes);
  
  return (
    <Suspense fallback={<LoadingFallback />}>
      {element}
    </Suspense>
  );
};

export default AppRoutes;