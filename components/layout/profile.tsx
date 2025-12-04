"use client";

import { Button } from "../ui/button";
import { User } from "lucide-react";
import LogoutButton from "./logout-button";

export default function Profile() {
  return (
    <div className="flex flex-col gap-2 w-full">
      <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
        <User className="h-4 w-4" />
        Profile
      </Button>
      {/* Desktop logout button - hidden on mobile since we have it in header */}
      <div className="hidden lg:block">
        <LogoutButton />
      </div>
    </div>
  );
}
