import React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UserFavorite, FavoriteType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface FavoriteButtonProps {
  favoriteType: FavoriteType;
  favoriteId: string;
  favoriteName: string;
  metadata?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost";
  showLabel?: boolean;
}

export function FavoriteButton({
  favoriteType,
  favoriteId,
  favoriteName,
  metadata,
  size = "icon",
  variant = "ghost",
  showLabel = false,
}: FavoriteButtonProps) {
  const { toast } = useToast();

  const { data: favorites = [] } = useQuery<UserFavorite[]>({
    queryKey: ["/api/favorites", favoriteType],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/favorites?type=${favoriteType}`);
      return res.json();
    },
  });

  const isFavorited = favorites.some(f => f.favoriteId === favoriteId);

  const addFavoriteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/favorites", {
        favoriteType,
        favoriteId,
        favoriteName,
        metadata: metadata || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: "Added to favorites",
        description: `${favoriteName} has been added to your favorites.`,
      });
    },
    onError: (error: any) => {
      if (error.message?.includes("409")) {
        toast({
          title: "Already favorited",
          description: "This item is already in your favorites.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add to favorites.",
          variant: "destructive",
        });
      }
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async () => {
      const favorite = favorites.find(f => f.favoriteId === favoriteId);
      if (!favorite) throw new Error("Favorite not found");
      
      const res = await apiRequest("DELETE", `/api/favorites/${favorite.id}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: "Removed from favorites",
        description: `${favoriteName} has been removed from your favorites.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove from favorites.",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isFavorited) {
      removeFavoriteMutation.mutate();
    } else {
      addFavoriteMutation.mutate();
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
      className={isFavorited ? "text-yellow-500 hover:text-yellow-600" : ""}
    >
      <Star className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
      {showLabel && (
        <span className="ml-2">
          {isFavorited ? "Unfavorite" : "Favorite"}
        </span>
      )}
    </Button>
  );
}

interface FavoritesListProps {
  favoriteType: FavoriteType;
  onSelectFavorite?: (favorite: UserFavorite) => void;
}

export function FavoritesList({ favoriteType, onSelectFavorite }: FavoritesListProps) {
  const { data: favorites = [], isLoading } = useQuery<UserFavorite[]>({
    queryKey: ["/api/favorites", favoriteType],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/favorites?type=${favoriteType}`);
      return res.json();
    },
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading favorites...</p>;
  }

  if (favorites.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No favorites yet. Click the star icon to add favorites!
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {favorites.map(favorite => (
        <div
          key={favorite.id}
          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
          onClick={() => onSelectFavorite?.(favorite)}
        >
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            <span className="font-medium">{favorite.favoriteName}</span>
          </div>
          <FavoriteButton
            favoriteType={favorite.favoriteType as FavoriteType}
            favoriteId={favorite.favoriteId}
            favoriteName={favorite.favoriteName}
            metadata={favorite.metadata || undefined}
            size="sm"
            variant="ghost"
          />
        </div>
      ))}
    </div>
  );
}
