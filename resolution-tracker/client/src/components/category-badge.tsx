import { Category } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { categoryColors } from "@/lib/categories";
import { 
  Activity, 
  Briefcase, 
  BookOpen, 
  Wallet, 
  Heart, 
  Sparkles 
} from "lucide-react";

const categoryIcons: Record<Category, React.ReactNode> = {
  "Health & Fitness": <Activity className="h-3 w-3" />,
  "Career": <Briefcase className="h-3 w-3" />,
  "Learning": <BookOpen className="h-3 w-3" />,
  "Finance": <Wallet className="h-3 w-3" />,
  "Relationships": <Heart className="h-3 w-3" />,
  "Personal Growth": <Sparkles className="h-3 w-3" />,
};

interface CategoryBadgeProps {
  category: Category;
  showIcon?: boolean;
}

export function CategoryBadge({ category, showIcon = true }: CategoryBadgeProps) {
  const colors = categoryColors[category];
  
  return (
    <Badge 
      variant="secondary" 
      className={`${colors.bg} ${colors.text} gap-1 border-0 font-medium`}
      data-testid={`badge-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {showIcon && categoryIcons[category]}
      {category}
    </Badge>
  );
}
