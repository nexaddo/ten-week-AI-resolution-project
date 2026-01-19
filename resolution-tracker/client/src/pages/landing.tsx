import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthProviderDialog } from "@/components/auth-provider-dialog";
import { Target, TrendingUp, Calendar, Award } from "lucide-react";
import { FaGoogle, FaGithub, FaApple } from "react-icons/fa";

export function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between gap-4 p-4 border-b">
        <div className="flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">Resolution Tracker</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <AuthProviderDialog>
            <Button data-testid="button-login">Sign In</Button>
          </AuthProviderDialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold tracking-tight mb-4" data-testid="text-hero-title">
            Track Your Goals, Achieve Your Dreams
          </h1>
          <p className="text-lg text-muted-foreground mb-8" data-testid="text-hero-description">
            Set meaningful resolutions, track your progress, and celebrate milestones. 
            Start your journey towards personal growth today.
          </p>
          <AuthProviderDialog title="Get Started" description="Choose your sign-in method to begin">
            <Button size="lg" data-testid="button-get-started">Get Started</Button>
          </AuthProviderDialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <Target className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Set Goals</CardTitle>
              <CardDescription>
                Create resolutions across different life categories
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Track Progress</CardTitle>
              <CardDescription>
                Log check-ins and watch your progress grow
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Stay Consistent</CardTitle>
              <CardDescription>
                View your activity calendar and maintain streaks
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Award className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Earn Achievements</CardTitle>
              <CardDescription>
                Unlock badges as you hit milestones
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center mt-16 text-sm text-muted-foreground">
          <p>Sign in with Google, GitHub, or Apple to get started.</p>
        </div>
      </main>
    </div>
  );
}
