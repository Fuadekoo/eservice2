"use client";

import UserLayout from "@/components/layout/userLayout";
import { LayoutDashboard, ClipboardList } from "lucide-react";
import React from "react";
import InstallPrompt from "@/components/installPrompt";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menu = [
    [
      {
        key: "overview",
        url: "overview",
        Icon: <LayoutDashboard className="size-6" />,
      },
    ],
    [
      {
        key: "requestManagement",
        url: "requestmanagement",
        Icon: <ClipboardList className="size-6" />,
      },
    ],
  ];

  return (
    <UserLayout menu={menu}>
      <InstallPrompt />
      {children}
    </UserLayout>
  );
}
