"use client";

import UserLayout from "@/components/layout/userLayout";
import {
  LayoutDashboard,
  ClipboardList,
  User,
  Calendar,
  Briefcase,
} from "lucide-react";
import React from "react";
import InstallPrompt from "@/components/installPrompt";
import useTranslation from "@/hooks/useTranslation";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const menu = [
    [
      {
        key: t("navigation.overview"),
        url: "",
        Icon: <LayoutDashboard className="size-6" />,
      },
    ],
    [
      {
        key: t("navigation.requestManagement"),
        url: "requestManagement",
        Icon: <ClipboardList className="size-6" />,
      },
      {
        key: t("navigation.appointment"),
        url: "appointment",
        Icon: <Calendar className="size-6" />,
      },
      {
        key: t("navigation.serviceManagement"),
        url: "serviceManagement",
        Icon: <Briefcase className="size-6" />,
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
