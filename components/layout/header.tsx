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
    <header className="overflow-hidden py-4 px-4 lg:px-10 bg-background/30 max-lg:shadow flex gap-2 items-center">
      <Button variant="ghost" size="icon" className="lg:hidden" asChild>
        <label htmlFor="sidebar">
          <AlignLeft className="h-4 w-4" />
        </label>
      </Button>
      <div className="flex-1"></div>
      <Lang />
      <Button
        variant="outline"
        size="icon"
        onClick={handleRefresh}
        className="bg-background/50 border border-primary/20 hover:bg-primary/10"
        title="Refresh page"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
      <Theme />
      {/* Mobile logout button - only visible on small screens */}
      <div className="lg:hidden">
        <MobileLogoutButton />
      </div>
    </header>
  );
}
