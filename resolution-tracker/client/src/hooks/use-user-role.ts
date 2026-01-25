import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useUserRole() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user/me"],
  });

  return {
    user,
    isLoading,
    isAdmin: user?.role === "admin",
    role: user?.role || "user",
  };
}
