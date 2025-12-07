import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { normalizePhoneNumber } from "@/lib/utils/phone-number";
import bcryptjs from "bcryptjs";
import { randomUUID } from "crypto";

// POST - Register a new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phoneNumber, password, otpCode } = body;

    // Validate required fields
    if (!name || !phoneNumber || !password) {
      return NextResponse.json(
        { success: false, error: "Name, phone number, and password are required" },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // Verify OTP if provided
    if (otpCode) {
      const otp = await prisma.otp.findFirst({
        where: { phoneNumber: normalizedPhone },
      });

      if (!otp || otp.code !== parseInt(otpCode)) {
        return NextResponse.json(
          { success: false, error: "Invalid or expired OTP code" },
          { status: 400 }
        );
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { phoneNumber: normalizedPhone },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this phone number already exists" },
        { status: 400 }
      );
    }

    // Get or create customer role
    // Note: Customer role should not have an officeId (it's a global role)
    let customerRole = await prisma.role.findFirst({
      where: {
        name: "customer",
        officeId: null, // Customer role is not office-specific
      },
    });

    // Create customer role if it doesn't exist
    if (!customerRole) {
      console.log("📝 Customer role not found, creating it...");
      customerRole = await prisma.role.create({
        data: {
          name: "customer",
          officeId: null, // Customer role is global, not office-specific
        },
      });
      console.log("✅ Customer role created:", customerRole.id);
    }

    // Generate username from name
    const username =
      name.toLowerCase().replace(/\s+/g, "") +
      "_" +
      normalizedPhone.replace(/[^0-9]/g, "").slice(-4);

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user (following database structure)
    const newUser = await prisma.user.create({
      data: {
        id: randomUUID(),
        username,
        phoneNumber: normalizedPhone,
        password: hashedPassword,
        roleId: customerRole.id,
        isActive: true,
        phoneVerified: true, // Set to true after OTP verification
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Delete OTP after successful registration
    if (otpCode) {
      await prisma.otp.deleteMany({
        where: { phoneNumber: normalizedPhone },
      });
    }

    console.log("✅ User registered successfully:", newUser.id);

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      data: {
        id: newUser.id,
        username: newUser.username,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in signup:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create account",
      },
      { status: 500 }
    );
  }
}


