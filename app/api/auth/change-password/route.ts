import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { passwordSchema } from "@/lib/zodSchema";
import bcrypt from "bcryptjs";

// POST - Change password
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false,
          status: false,
          message: "Unauthorized",
          error: "You must be logged in to change your password"
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = await passwordSchema.parseAsync(body);
    const { password, confirmPassword } = validatedData;

    // Check if passwords match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { 
          success: false,
          status: false,
          message: "Password didn't match",
          error: "Password didn't match"
        },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });
    
    return NextResponse.json(
      { 
        success: true,
        status: true,
        message: "Password successfully changed" 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Change password error:", error);
    
    // Handle validation errors
    if (error.errors?.[0]?.message) {
      return NextResponse.json(
        { 
          success: false,
          status: false,
          message: error.errors[0].message,
          error: error.errors[0].message
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        status: false,
        message: error.message || "Failed to change password",
        error: error.message || "Failed to change password"
      },
      { status: 500 }
    );
  }
}

