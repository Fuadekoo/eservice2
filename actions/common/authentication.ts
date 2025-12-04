"use server";

import { auth, CustomError, signIn, signOut } from "@/auth";
import prisma from "@/lib/db";
import { MutationState } from "@/lib/definitions";
import { LoginSchema, PasswordSchema, UsernameSchema } from "@/lib/zodSchema";
import bcrypt from "bcryptjs";

export async function authenticate(data: LoginSchema): Promise<MutationState> {
  try {
    await signIn("credentials", { ...data, redirect: false });
    return { status: true, message: "successfully login" };
  } catch (error) {
    return {
      status: false,
      message:
        error instanceof CustomError ? error.message : "invalid credentials",
    };
  }
}

export async function logout() {
  try {
    await signOut({
      redirect: false,
      redirectTo: "/en/login",
    });
    return { status: true, message: "successfully logout" };
  } catch {
    return { status: false, message: "failed to logout" };
  }
}

export async function changeUsername({ username }: UsernameSchema) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("");

  const otherUser = await prisma.user.findFirst({ where: { username } });
  if (!otherUser) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { username },
    });
    return { status: true, message: "username successfully changed" };
  } else if (otherUser.id == session.user.id) {
    return { status: false, message: "this one is your username already" };
  } else return { status: false, message: "username is taken by other user" };
}

export async function changePassword({
  password,
  confirmPassword,
}: PasswordSchema) {
  if (password === confirmPassword) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("");

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: await bcrypt.hash(password, 12) },
    });
    return { status: true, message: "password successfully changed" };
  }
  return { status: false, message: "password didn't match" };
}
