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
      <div className="flex flex-col gap-2 w-full">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => setIsProfileOpen(true)}
        >
          <User className="h-4 w-4" />
          Profile
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
