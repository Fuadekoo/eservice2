import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  addTranslationKey,
  deleteTranslationKey,
  updateTranslation,
} from "@/app/api/languages/utils";

// POST - Add a new translation key
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { key, translations } = body;

    if (!key || !translations || typeof translations !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid translation key data" },
        { status: 400 }
      );
    }

    // Add translation key to JSON files
    await addTranslationKey(key, translations);

    return NextResponse.json({
      success: true,
      message: "Translation key added successfully",
      data: { key, translations },
    });
  } catch (error: any) {
    console.error("Error adding translation key:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add translation key",
      },
      { status: 500 }
    );
  }
}

// PUT - Update a translation key
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { key, translations } = body;

    if (!key || !translations || typeof translations !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid translation key data" },
        { status: 400 }
      );
    }

    // Update translation key in JSON files
    // Update each language separately
    for (const langCode in translations) {
      await updateTranslation(langCode, key, translations[langCode]);
    }

    return NextResponse.json({
      success: true,
      message: "Translation key updated successfully",
      data: { key, translations },
    });
  } catch (error: any) {
    console.error("Error updating translation key:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update translation key",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a translation key
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { success: false, error: "Translation key is required" },
        { status: 400 }
      );
    }

    // Decode the key (it's URL encoded)
    const decodedKey = decodeURIComponent(key);

    // Delete translation key from JSON files
    await deleteTranslationKey(decodedKey);

    return NextResponse.json({
      success: true,
      message: "Translation key deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting translation key:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete translation key",
      },
      { status: 500 }
    );
  }
}

