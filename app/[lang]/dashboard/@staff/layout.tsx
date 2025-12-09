"use client";

import UserLayout from "@/components/layout/userLayout";
import {
  LayoutDashboard,
  ClipboardList,
  User,
  Calendar,
  Briefcase,
  FileText,
} from "lucide-react";
import React from "react";
import InstallPrompt from "@/components/installPrompt";

export default function Layout({ children }: { children: React.ReactNode }) {
  const menu = [
    [
      {
        key: "overview",
        url: "",
        Icon: <LayoutDashboard className="size-6" />,
      },
    ],
    [
      {
        key: "requestManagement",
        url: "requestManagement",
        Icon: <ClipboardList className="size-6" />,
      },
      {
        key: "appointment",
        url: "appointment",
        Icon: <Calendar className="size-6" />,
      },
      {
        key: "serviceManagement",
        url: "serviceManagement",
        Icon: <Briefcase className="size-6" />,
      },
      {
        key: "report",
        url: "report",
        Icon: <FileText className="size-6" />,
      },
      // {
      //   key: "profile",
      //   url: "profile",
      //   Icon: <User className="size-6" />,
      // },
    ],
  ];

  return (
    <UserLayout menu={menu}>
      <InstallPrompt />
      {children}
    </UserLayout>
  );
}
