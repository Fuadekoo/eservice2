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
  Newspaper,
  Briefcase,
} from "lucide-react";
import React from "react";
import InstallPrompt from "@/components/installPrompt";

export default async function Layout({
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
        key: "news",
        url: "news",
        Icon: <Newspaper className="size-6" />,
      },
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

  return (
    <UserLayout menu={menu}>
      <InstallPrompt />
      {children}
    </UserLayout>
  );
}
