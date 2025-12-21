import UserLayout from "@/components/layout/userLayout";
import {
  User,
  Users,
  LayoutDashboard,
  Building2,
  Languages,
  Images,
  Info,
  FileText,
  Briefcase,
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
        key: "office",
        url: "office",
        Icon: <Building2 className="size-6" />,
      },
      {
        key: "myoffice",
        url: "myoffice",
        Icon: <Briefcase className="size-6" />,
      },
      {
        key: "userManagement",
        url: "userManagement",
        Icon: <Users className="size-6" />,
      },
    ],
    [
      {
        key: "languages",
        url: "languages",
        Icon: <Languages className="size-6" />,
      },
      {
        key: "gallery",
        url: "configuration/gallery",
        Icon: <Images className="size-6" />,
      },
      {
        key: "about",
        url: "configuration/about",
        Icon: <Info className="size-6" />,
      },
    ],
    [
      {
        key: "report",
        url: "report",
        Icon: <FileText className="size-6" />,
      },
      {
        key: "requestManagement",
        url: "requestManagement",
        Icon: <FileText className="size-6" />,
      },
    ],
  ];

  // Filter menu items based on user permissions
  const menu = userId
    ? await filterMenuByPermissions(userId, "admin", allMenuItems)
    : allMenuItems;

  return (
    <UserLayout menu={menu}>
      <div className="h-dvh overflow-auto">
        <InstallPrompt />
        {children}
      </div>
    </UserLayout>
  );
}
