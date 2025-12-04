import UserLayout from "@/components/layout/userLayout";
import { BadgeDollarSignIcon, User, Users } from "lucide-react";
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
        key: "home",
        url: "home",
        Icon: <User className="size-6" />,
      },
      {
        key: "dashboard",
        url: "dashboard",
        Icon: <Users className="size-6" />,
      },
      {
        key: "citizens",
        url: "citizenManagement",
        Icon: <Users className="size-6" />,
      },
      {
        key: "reports",
        url: "stationAdminReport",
        Icon: <Users className="size-6" />,
      },
      {
        key: "profile",
        url: "profile",
        Icon: <BadgeDollarSignIcon className="size-6" />,
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
