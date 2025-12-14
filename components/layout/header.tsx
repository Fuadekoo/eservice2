import { AlignLeft, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import Lang from "./lang";
import Theme from "./theme";
import MobileLogoutButton from "./mobile-logout-button";

export default function Header() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-50 h-16 lg:h-20 bg-background/80 backdrop-blur-md border-b border-border/40 shadow-sm">
      <div className="h-full px-3 sm:px-4 lg:px-6 xl:px-10 flex items-center gap-2 sm:gap-3">
        {/* Mobile hamburger menu */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0 h-9 w-9"
          asChild
        >
          <label htmlFor="sidebar">
            <AlignLeft className="h-5 w-5" />
          </label>
        </Button>

        {/* Spacer */}
        <div className="flex-1 min-w-0"></div>

        {/* Right side actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Lang />
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            className="h-9 w-9 sm:h-10 sm:w-10 bg-background/50 border border-primary/20 hover:bg-primary/10"
            title="Refresh page"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Theme />
          {/* Mobile logout button - only visible on small screens */}
          <div className="lg:hidden">
            <MobileLogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
