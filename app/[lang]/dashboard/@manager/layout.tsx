import UserLayout from "@/components/layout/userLayout";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Settings,
  Clock,
  FileText,
  ClipboardCheck,
} from "lucide-react";
import React from "react";
import InstallPrompt from "@/components/installPrompt";
import { auth } from "@/auth";
import { filterMenuByPermissions } from "@/lib/filter-menu-by-permissions";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        key: "services",
        url: "services",
        Icon: <Briefcase className="size-6" />,
      },
      {
        key: "staff",
        url: "staff",
        Icon: <Users className="size-6" />,
      },
      {
        key: "requestManagement",
        url: "requestmanagement",
        Icon: <FileText className="size-6" />,
      },
      {
        key: "report",
        url: "report",
        Icon: <ClipboardCheck className="size-6" />,
      },
    ],
    [
      {
        key: "configuration",
        url: "configuration/office",
        Icon: <Settings className="size-6" />,
      },
      {
        key: "availability",
        url: "configuration/avaibility",
        Icon: <Clock className="size-6" />,
      },
    ],
  ];

  // Filter menu items based on user permissions
  const menu = userId
    ? await filterMenuByPermissions(userId, "manager", allMenuItems)
    : allMenuItems;

  return (
    <UserLayout menu={menu}>
      <InstallPrompt />
      {children}
    </UserLayout>
  );
}
