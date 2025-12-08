import { auth } from "@/auth";
import prisma from "@/lib/db";
import React from "react";
import { AccessDenied, AccountStatusMessage } from "./_components/access-denied";

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
    return <AccessDenied />;
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
    return <AccountStatusMessage isBlocked={!data?.isActive} />;
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
