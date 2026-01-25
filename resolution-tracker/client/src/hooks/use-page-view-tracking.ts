import { useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export function usePageViewTracking() {
  const [location] = useLocation();

  useEffect(() => {
    // Log page view when location changes
    const logPageView = async () => {
      try {
        await apiRequest("POST", "/api/analytics/pageview", {
          path: location,
          referrer: document.referrer || null,
        });
      } catch (error) {
        // Silently fail - don't disrupt user experience
        console.debug("Failed to log page view:", error);
      }
    };

    logPageView();
  }, [location]);
}
