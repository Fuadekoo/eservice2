import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const LOCALES_DIR = path.join(process.cwd(), "localization", "locales");

// Public endpoint to get translations for a specific language
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lang: string }> | { lang: string } }
) {
  try {
    const { lang } = await Promise.resolve(params);
    
    if (!lang || !["en", "am", "or"].includes(lang)) {
      return NextResponse.json(
        { success: false, error: "Invalid language code" },
        { status: 400 }
      );
    }

    const filePath = path.join(LOCALES_DIR, `${lang}.json`);
    
    try {
      const fileContent = await readFile(filePath, "utf-8");
      const translations = JSON.parse(fileContent);
      
      return NextResponse.json({
        success: true,
        data: translations,
      });
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return NextResponse.json(
          { success: false, error: "Translation file not found" },
          { status: 404 }
        );
      }
      throw error;
    }
  } catch (error: any) {
    console.error("Error fetching translations:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch translations",
      },
      { status: 500 }
    );
  }
}

