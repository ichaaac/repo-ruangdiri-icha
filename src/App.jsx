// src/App.jsx
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider, } from "@tanstack/react-query";
import AppRoutes from "./routes/Route";
import { Toaster } from "sonner";
// import { PersistQueryClient } from "@tanstack/react-query-persist-client";
// import { CreateSyncStoragePersister } from "@tanstack/react-query-sync-storage-persister";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false, // Disable retry untuk mencegah multiple error
      staleTime: 60000,
      // cacheTime: 300000,
      // Suppress error toast globally - let components handle errors
      onError: () => {
        // Do nothing - suppress all query errors from showing toast
        // Components can handle their own errors if needed
      },
    },
    mutations: {
      // Keep mutation behavior as is for now
    },
  },
});

// const localStoragePersister = createSyncStoragePersister({
//   storage: window.localStorage,
// })
// const sessionStoragePersister = createSyncStoragePersister({ storage: window.sessionStorage })


export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
