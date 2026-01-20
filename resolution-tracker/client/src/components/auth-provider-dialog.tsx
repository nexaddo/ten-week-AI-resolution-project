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

interface AuthProviderDialogProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function AuthProviderDialog({ 
  children, 
  title = "Choose Sign In Method",
  description = "Select a provider to continue"
}: AuthProviderDialogProps) {
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
          <Button variant="outline" asChild className="w-full">
            <a href="/api/login?provider=google">
              <FaGoogle className="mr-2 h-4 w-4" />
              Continue with Google
            </a>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <a href="/api/login?provider=github">
              <FaGithub className="mr-2 h-4 w-4" />
              Continue with GitHub
            </a>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <a href="/api/login?provider=apple">
              <FaApple className="mr-2 h-4 w-4" />
              Continue with Apple
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
