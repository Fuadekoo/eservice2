import { auth } from "@/auth";
import prisma from "@/lib/db";
import React from "react";
import Logout from "./logout";

export default async function Layout({
  children,
  admin,
  manager,
  customer,
  staff,
}: {
  children: React.ReactNode;
  admin: React.ReactNode;
  manager: React.ReactNode;
  customer: React.ReactNode;
  staff: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="grid place-content-center gap-5">
        <div className="p-10 bg-destructive/10 border border-destructive/50 rounded-xl text-destructive">
          <p className="text-2xl first-letter:font-bold">Access Denied!</p>
          <p className="text-sm">
            You need to be logged in to access this area.
          </p>
        </div>
        <Logout />
      </div>
    );
  }

  const data = await prisma.user.findFirst({
    where: { id: session.user.id },
    select: {
      isActive: true,
      role: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!data || !data.isActive) {
    return (
      <div className="grid place-content-center gap-5">
        <div className="p-10 bg-destructive/10 border border-destructive/50 rounded-xl text-destructive">
          <p className="text-2xl first-letter:font-bold">
            {!data?.isActive ? "Account Blocked!" : "Account Inactive!"}
          </p>
          <p className="text-sm">
            {!data?.isActive
              ? "Your account has been blocked. Please contact an administrator to unblock your account."
              : "Your account is not active. Please contact an administrator."}
          </p>
        </div>
        <Logout />
      </div>
    );
  }

  // Get role name from relation or session
  const roleName = data.role?.name || session.user.role;

  // Role-based rendering
  // admin -> admin slot
  // manager -> manager slot
  // staff or any other role -> staff slot
  if (roleName === "admin") {
    return admin;
  } else if (roleName === "manager") {
    return manager;
  } else if (roleName === "customer") {
    return customer;
  } else {
    // staff, customer, or any other role goes to staff slot
    return staff;
  }
}
