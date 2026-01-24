import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Target,
  FolderKanban,
  Calendar,
  Trophy,
  Settings,
  Sparkles,
  Brain,
  FlaskConical,
  ExternalLink,
  BarChart3,
} from "lucide-react";
import { categories, type Category } from "@shared/schema";
import { categoryColors } from "@/lib/categories";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "All Resolutions", url: "/resolutions", icon: Target },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Achievements", url: "/achievements", icon: Trophy },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "AI Analytics", url: "/ai-dashboard", icon: Brain },
  { title: "Prompt Playground", url: "/prompt-playground", icon: FlaskConical },
];

interface AppSidebarProps {
  selectedCategory: Category | null;
  onCategorySelect: (category: Category | null) => void;
}

export function AppSidebar({ selectedCategory, onCategorySelect }: AppSidebarProps) {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="rounded-md bg-primary p-1.5">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">Resolutions</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Categories</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={selectedCategory === null}
                  onClick={() => onCategorySelect(null)}
                  data-testid="filter-all-categories"
                >
                  <FolderKanban className="h-4 w-4" />
                  <span>All Categories</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {categories.map((category) => {
                const colors = categoryColors[category];
                return (
                  <SidebarMenuItem key={category}>
                    <SidebarMenuButton 
                      isActive={selectedCategory === category}
                      onClick={() => onCategorySelect(category)}
                      data-testid={`filter-${category.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <div className={`h-3 w-3 rounded-sm ${colors.bg}`} />
                      <span>{category}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild data-testid="nav-settings">
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="mt-2 pt-2 border-t border-sidebar-border">
          <a
            href={`https://github.com/nexaddo/ten-week-AI-resolution-project/releases/${__APP_VERSION__ !== "dev" ? `tag/${__APP_VERSION__}` : ""}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            data-testid="version-link"
          >
            <span>{__APP_VERSION__}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
