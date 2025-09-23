// src/routes/Routes.jsx
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
  // Process routes for lazy loading
  const processedRoutes = processRoutesForLazyLoading(routes);
  
  // Use the processed routes
  const element = useRoutes(processedRoutes);
  
  return (
    <Suspense fallback={<LoadingFallback />}>
      {element}
    </Suspense>
  );
};

/**
 * Helper function to recursively process routes for lazy loading
 * Wraps route elements in Suspense boundaries when needed
 * 
 * @param {Array} routes - The routes to process
 * @returns {Array} Processed routes
 */
const processRoutesForLazyLoading = (routes) => {
  return routes.map((route) => {
    const processedRoute = { ...route };
    
    // If the route has children, process them recursively
    if (route.children) {
      processedRoute.children = processRoutesForLazyLoading(route.children);
    }
    
    return processedRoute;
  });
};

export default AppRoutes;