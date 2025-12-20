import { NextRequest, NextResponse } from "next/server";
import { signOut } from "@/auth";

// POST - Logout user
export async function POST(request: NextRequest) {
  try {
    await signOut({
      redirect: false,
      redirectTo: "/en/login",
    });
    
    return NextResponse.json(
      { 
        success: true,
        status: true,
        message: "Successfully logged out" 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { 
        success: false,
        status: false,
        message: "Failed to logout",
        error: error.message || "Failed to logout"
      },
      { status: 500 }
    );
  }
}

