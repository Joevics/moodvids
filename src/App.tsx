
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { BottomNav } from "@/components/BottomNav";
import Index from "./pages/Index";
import History from "./pages/History";
import Recommendations from "./pages/Recommendations";
import Watchlist from "./pages/Watchlist";
import MovieDetails from "./pages/MovieDetails";
import NotFound from "./pages/NotFound";
import TopPicks from "./pages/TopPicks";

// Create a new QueryClient instance
const queryClient = new QueryClient();

const App = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="pb-20"> {/* Increased padding to ensure content is visible above the fixed nav */}
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/recommendations" element={<Recommendations />} />
                  <Route path="/watchlist" element={<Watchlist />} />
                  <Route path="/top-picks" element={<TopPicks />} />
                  <Route path="/movie/:id" element={<MovieDetails />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              <BottomNav />
            </BrowserRouter>
          </TooltipProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
