
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const openingData = [
  ["Full Stack Developer", "Remote", 2, 5],
  ["Frontend React Developer", "Bengaluru", 1, 4],
  ["Backend Node.js Developer", "Remote", 2, 6],
  ["DevOps Engineer", "Hyderabad", 3, 7],
  ["AWS Cloud Engineer", "Remote", 2, 5],
  ["Python Developer", "Pune", 1, 4],
  ["Data Engineer", "Bengaluru", 3, 6],
  ["Machine Learning Engineer", "Remote", 2, 5],
  ["QA Automation Engineer", "Chennai", 2, 5],
  ["UI/UX Designer", "Remote", 2, 5],
  ["Cybersecurity Engineer", "Delhi", 3, 7],
  ["Technical Project Manager", "Mumbai", 5, 10],
] as const;

async function main() {
  console.log("Starting database seed...");

  // Find the tenant by its company name.
  let tenant = await prisma.tenants.findFirst({
    where: { companyName: "Bruce Wayne Corp" },
  });

  if (!tenant) {
    tenant = await prisma.tenants.create({
      data: { companyName: "Bruce Wayne Corp" },
    });
    console.log("Tenant created:", tenant.tenantId);
  } else {
    console.log("Existing tenant found:", tenant.tenantId);
  }

  for (const [title, location, min, max] of openingData) {
    const existing = await prisma.opening.findFirst({
      where: {
        tenantId: tenant.tenantId,
        title,
      },
    });

    if (existing) {
      console.log("Already exists:", title);
      continue;
    }

    await prisma.opening.create({
      data: {
        tenantId: tenant.tenantId,
        title,
        description: `Contract opening for ${title}.`,
        location,
        contractType: "CONTRACT",
        hiringManagerId: "seed-hiring-manager",
        experienceMin: min,
        experienceMax: max,
      },
    });

    console.log("Created:", title);
  }

  const tenantCount = await prisma.tenants.count({
    where: { tenantId: tenant.tenantId },
  });

  const openingCount = await prisma.opening.count({
    where: { tenantId: tenant.tenantId },
  });

  console.log("========== SEED SUMMARY ==========");
  console.log("Tenant:", tenant.companyName);
  console.log("Tenant ID:", tenant.tenantId);
  console.log("Tenant count:", tenantCount);
  console.log("Opening count:", openingCount);
  console.log("==================================");

  if (openingCount < 12) {
    throw new Error(
      `Expected at least 12 openings, found ${openingCount}`
    );
  }
}

main()
  .catch((error) => {
    console.error("SEED FAILED:", error);
    throw error;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
