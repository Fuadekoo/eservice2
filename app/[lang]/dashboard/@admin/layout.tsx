import UserLayout from "@/components/layout/userLayout";
import {
  BadgeDollarSignIcon,
  User,
  Users,
  LayoutDashboard,
  Building2,
  Shield,
  UserCog,
  Settings,
  Languages,
  ImageIcon,
  Info,
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
      {
        key: "dashboard",
        url: "dashboard",
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
        key: "userManagement",
        url: "userManagement",
        Icon: <Users className="size-6" />,
      },
      {
        key: "roles",
        url: "roles",
        Icon: <Shield className="size-6" />,
      },
      {
        key: "setPermission",
        url: "setPermission",
        Icon: <UserCog className="size-6" />,
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
        Icon: <ImageIcon className="size-6" />,
      },
      {
        key: "about",
        url: "configuration/about",
        Icon: <Info className="size-6" />,
      },
    ],
    [
      {
        key: "profile",
        url: "profile",
        Icon: <User className="size-6" />,
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
