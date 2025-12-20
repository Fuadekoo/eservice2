import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { usernameSchema } from "@/lib/zodSchema";

// POST - Change username
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false,
          status: false,
          message: "Unauthorized",
          error: "You must be logged in to change your username"
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = await usernameSchema.parseAsync(body);
    const { username } = validatedData;

    // Check if username is already taken by another user
    const otherUser = await prisma.user.findFirst({ 
      where: { username } 
    });

    if (!otherUser) {
      // Username is available, update it
      await prisma.user.update({
        where: { id: session.user.id },
        data: { username },
      });
      
      return NextResponse.json(
        { 
          success: true,
          status: true,
          message: "Username successfully changed" 
        },
        { status: 200 }
      );
    } else if (otherUser.id === session.user.id) {
      // User already has this username
      return NextResponse.json(
        { 
          success: false,
          status: false,
          message: "This one is your username already",
          error: "This one is your username already"
        },
        { status: 400 }
      );
    } else {
      // Username is taken by another user
      return NextResponse.json(
        { 
          success: false,
          status: false,
          message: "Username is taken by other user",
          error: "Username is taken by other user"
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Change username error:", error);
    
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
        message: error.message || "Failed to change username",
        error: error.message || "Failed to change username"
      },
      { status: 500 }
    );
  }
}

