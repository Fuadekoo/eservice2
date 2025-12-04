"use server";

import { auth } from "@/auth";
import prisma from "@/lib/db";
// import { RegisterSchema } from "@/lib/zodSchema";
// import { UserStatus } from "@prisma/client";

// export async function changeUserStatus(id: string, status: UserStatus) {
//   await prisma.user.update({ where: { id }, data: { status } });
// }

export async function getUser() {
  const session = await auth();
  const data = await prisma.user.findFirst({
    where: { id: session?.user?.id },
    select: {
      username: true,
      phone: true,
      isAdmin: true,
      isActive: true,
      role: true,
    },
  });

  return data;
}

export async function updateUserPassword(password: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthenticated");
  const id = session?.user?.id;
  await prisma.user.update({ where: { id }, data: { password } });
}

export async function updateProfile({
  username,
  phone,
}: {
  username: string;
  phone: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthenticated");
  const id = session?.user?.id;
  await prisma.user.update({ where: { id }, data: { username, phone } });
}
