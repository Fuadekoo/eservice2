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
import { auth } from "@/auth";
import { filterMenuByPermissions } from "@/lib/filter-menu-by-permissions";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userId = session?.user?.id;

  const allMenuItems = [
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
    ],
  ];

  // Filter menu items based on user permissions
  const menu = userId
    ? await filterMenuByPermissions(userId, "staff", allMenuItems)
    : allMenuItems;

  return (
    <UserLayout menu={menu}>
      <InstallPrompt />
      {children}
    </UserLayout>
  );
}
