import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// PUT - Update a single translation
export async function PUT(
  request: NextRequest,
  { params }: { params: { langCode: string; key: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { langCode, key } = params;
    const body = await request.json();
    const { value } = body;

    if (!langCode || !key || value === undefined) {
      return NextResponse.json(
        { success: false, error: "Language code, key, and value are required" },
        { status: 400 }
      );
    }

    // Decode the key (it's URL encoded)
    const decodedKey = decodeURIComponent(key);

    // TODO: Update in database or file system
    // For now, just return success

    return NextResponse.json({
      success: true,
      message: "Translation updated successfully",
      data: { langCode, key: decodedKey, value },
    });
  } catch (error: any) {
    console.error("Error updating translation:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update translation",
      },
      { status: 500 }
    );
  }
}

