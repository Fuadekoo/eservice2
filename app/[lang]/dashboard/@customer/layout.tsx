import UserLayout from "@/components/layout/userLayout";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Calendar,
  Star,
  User,
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
        url: "",
        Icon: <LayoutDashboard className="size-6" />,
      },
    ],
    [
      {
        key: "applyService",
        url: "applyservice",
        Icon: <FileText className="size-6" />,
      },
      {
        key: "request",
        url: "request",
        Icon: <ClipboardList className="size-6" />,
      },
      {
        key: "appointment",
        url: "appointment",
        Icon: <Calendar className="size-6" />,
      },
      {
        key: "feedback",
        url: "feedback",
        Icon: <Star className="size-6" />,
      },
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
