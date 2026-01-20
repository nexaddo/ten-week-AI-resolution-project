import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FaGoogle, FaGithub, FaApple } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AuthProviderDialogProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

type OAuthProvider = "google" | "github" | "apple" | "custom";

const providerConfig: Record<OAuthProvider, { icon: React.ReactNode; label: string }> = {
  google: { icon: <FaGoogle className="mr-2 h-4 w-4" />, label: "Continue with Google" },
  github: { icon: <FaGithub className="mr-2 h-4 w-4" />, label: "Continue with GitHub" },
  apple: { icon: <FaApple className="mr-2 h-4 w-4" />, label: "Continue with Apple" },
  custom: { icon: null, label: "Continue with Custom Provider" },
};

export function AuthProviderDialog({ 
  children, 
  title = "Choose Sign In Method",
  description = "Select a provider to continue"
}: AuthProviderDialogProps) {
  const { data: providersData } = useQuery({
    queryKey: ["/api/auth/providers"],
    queryFn: async () => {
      return apiRequest<{ providers: OAuthProvider[] }>("/api/auth/providers");
    },
  });

  const availableProviders = providersData?.providers || [];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {availableProviders.map((provider) => {
            const config = providerConfig[provider];
            if (!config) return null;

            return (
              <Button key={provider} variant="outline" asChild className="w-full">
                <a href={`/api/login?provider=${provider}`}>
                  {config.icon}
                  {config.label}
                </a>
              </Button>
            );
          })}
          {availableProviders.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No authentication providers configured
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
