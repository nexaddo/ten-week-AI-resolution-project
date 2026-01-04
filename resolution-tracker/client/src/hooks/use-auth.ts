import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";

async function fetchUser(): Promise<User | null> {
  const response = await fetch("/api/auth/user", {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function logout(): Promise<void> {
  try {
    const response = await fetch("/api/logout", {
      credentials: "include",
    });

    if (!response.ok) {
      // If the server-side logout fails, do not redirect away so the user remains in a consistent state.
      // This also allows error logging/monitoring to capture the failure.
      // eslint-disable-next-line no-console
      console.error(`Logout failed: ${response.status} ${response.statusText}`);
      return;
    }
  } catch (error) {
    // Network or other unexpected error during logout request.
    // eslint-disable-next-line no-console
    console.error("Logout request failed", error);
    return;
  }

  // Only redirect after the server-side logout has completed successfully.
  window.location.href = "/";
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
