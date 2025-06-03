// src/App.jsx
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRoutes from "./routes/Route";
import { Toaster } from "sonner";

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* ✅ Toaster untuk global notification */}
      <Toaster
        position="top-center"
        richColors
        duration={3000}
        closeButton
      />

      <Router>
        <AppRoutes />
      </Router>
    </QueryClientProvider>
  );
}
