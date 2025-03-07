
import { Home, Star, List, History, Bookmark } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export const BottomNav = () => {
  const location = useLocation();

  const items = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Star, label: "For You", path: "/recommendations" },
    { icon: Bookmark, label: "Watchlist", path: "/watchlist" },
    { icon: History, label: "History", path: "/history" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-50">
      <div className="flex justify-around items-center h-16">
        {items.map(({ icon: Icon, label, path }) => (
          <Link
            key={path}
            to={path}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full",
              "text-muted-foreground hover:text-primary transition-colors",
              location.pathname === path && "text-primary"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs mt-1">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};
