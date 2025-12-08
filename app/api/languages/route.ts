import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { loadAllTranslations, saveTranslations } from "./utils";

// Default languages
const defaultLanguages = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "am", name: "Amharic", nativeName: "አማርኛ" },
  { code: "or", name: "Oromo", nativeName: "Afaan Oromoo" },
];

// GET - Fetch languages and translations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Load all translations from JSON files
    const translations = await loadAllTranslations();

    return NextResponse.json({
      success: true,
      data: {
        availableLanguages: defaultLanguages,
        translations,
      },
    });
  } catch (error: any) {
    console.error("Error fetching languages:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch languages",
      },
      { status: 500 }
    );
  }
}

// PUT - Save languages and translations
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
    const { translations } = body;

    // Validate input
    if (!Array.isArray(translations)) {
      return NextResponse.json(
        { success: false, error: "Invalid data format" },
        { status: 400 }
      );
    }

    // Save translations to JSON files
    await saveTranslations(translations);

    return NextResponse.json({
      success: true,
      message: "Languages and translations saved successfully",
    });
  } catch (error: any) {
    console.error("Error saving languages:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to save languages",
      },
      { status: 500 }
    );
  }
}

// POST - Add a new language
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
    const { language } = body;

    if (!language || !language.code || !language.name) {
      return NextResponse.json(
        { success: false, error: "Invalid language data" },
        { status: 400 }
      );
    }

    // TODO: Save to database or file system
    // For now, just return success

    return NextResponse.json({
      success: true,
      message: "Language added successfully",
      data: language,
    });
  } catch (error: any) {
    console.error("Error adding language:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add language",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a language
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
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Language code is required" },
        { status: 400 }
      );
    }

    // Prevent deleting default languages
    if (["en", "am", "or"].includes(code)) {
      return NextResponse.json(
        { success: false, error: "Cannot delete default language" },
        { status: 400 }
      );
    }

    // TODO: Delete from database or file system
    // For now, just return success

    return NextResponse.json({
      success: true,
      message: "Language deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting language:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete language",
      },
      { status: 500 }
    );
  }
}
