import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

/**
 * GET /api/guest/data
 * Returns all active offices with their services grouped together
 * This is optimized for the guest service page
 */
export async function GET(request: NextRequest) {
  try {
    console.log("📋 Fetching guest data (offices with services)...");

    // Fetch all active offices
    const offices = await prisma.office.findMany({
      where: {
        status: true, // Only active offices
      },
      select: {
        id: true,
        name: true,
        logo: true,
        slogan: true,
        status: true,
        roomNumber: true,
        address: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Fetch all services from active offices
    const services = await prisma.service.findMany({
      where: {
        office: {
          status: true, // Only services from active offices
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        officeId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Create a map of officeId -> office for quick lookup
    const officeMap = new Map(
      offices.map((office) => [office.id, office])
    );

    // Group services by office
    const servicesByOffice = new Map<string, typeof services>();
    services.forEach((service) => {
      if (!servicesByOffice.has(service.officeId)) {
        servicesByOffice.set(service.officeId, []);
      }
      servicesByOffice.get(service.officeId)!.push(service);
    });

    // Build the response: offices with their services
    const officesWithServices = offices.map((office) => ({
      officeId: office.id,
      officeName: office.name,
      officeLogo: office.logo,
      officeSlogan: office.slogan,
      officeRoomNumber: office.roomNumber,
      officeAddress: office.address,
      services: servicesByOffice.get(office.id) || [],
    }));

    // Sort by office name (already sorted from query, but ensure consistency)
    officesWithServices.sort((a, b) =>
      a.officeName.localeCompare(b.officeName)
    );

    const totalOffices = officesWithServices.length;
    const totalServices = services.length;

    console.log(
      `✅ Successfully fetched ${totalOffices} offices with ${totalServices} total services`
    );

    return NextResponse.json({
      success: true,
      data: officesWithServices,
      meta: {
        totalOffices,
        totalServices,
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching guest data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch guest data",
      },
      { status: 500 }
    );
  }
}

