"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { User } from "lucide-react";
import LogoutButton from "./logout-button";
import { ProfileDialog } from "./profile-dialog";

export default function Profile() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-1.5 w-full">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sm px-3 h-9 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10"
          onClick={() => setIsProfileOpen(true)}
        >
          <User className="h-4 w-4 text-black dark:text-white" />
          <span className="text-black dark:text-white">Profile</span>
        </Button>
        {/* Desktop logout button - hidden on mobile since we have it in header */}
        <div className="hidden lg:block">
          <LogoutButton />
        </div>
      </div>
      <ProfileDialog open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </>
  );
}
