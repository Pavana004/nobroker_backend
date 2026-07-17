import { PrismaClient, PropertyType, FurnishingType } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const CITIES = [
  {
    city: "Bangalore",
    localities: ["Koramangala", "Indiranagar", "Whitefield", "HSR Layout"],
  },
  { city: "Mumbai", localities: ["Andheri", "Bandra", "Powai", "Malad"] },
  {
    city: "Pune",
    localities: ["Kothrud", "Hinjewadi", "Baner", "Viman Nagar"],
  },
  { city: "Delhi", localities: ["Dwarka", "Saket", "Rohini", "Vasant Kunj"] },
];

const PROPERTY_TYPES = Object.values(PropertyType);
const FURNISHING_TYPES = Object.values(FurnishingType);
const AMENITIES_POOL = [
  "parking",
  "lift",
  "gym",
  "swimming_pool",
  "power_backup",
  "security",
  "clubhouse",
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAmenities(): string[] {
  const count = 2 + Math.floor(Math.random() * 4);
  return [...AMENITIES_POOL].sort(() => 0.5 - Math.random()).slice(0, count);
}

async function main() {
  console.log("🌱 Seeding database...");

  const passwordHash = await bcrypt.hash("Password123", 12);

  const owners = await Promise.all(
    Array.from({ length: 10 }).map((_, i) =>
      prisma.user.create({
        data: {
          name: `Owner ${i + 1}`,
          email: `owner${i + 1}@example.com`,
          phone: `+9198765432${String(i).padStart(2, "0")}`,
          passwordHash,
        },
      }),
    ),
  );

  await prisma.user.create({
    data: {
      name: "Test Seeker",
      email: "seeker@example.com",
      phone: "+919999999999",
      passwordHash,
    },
  });

  console.log(
    `Created ${owners.length} owners + 1 seeker (password: Password123)`,
  );

  // Bulk-create 200 sample properties (bump the loop count for a heavier
  // local dataset to test pagination/search performance against).
  const BATCH_SIZE = 200;
  for (let i = 0; i < BATCH_SIZE; i++) {
    const { city, localities } = randomFrom(CITIES);
    const bedrooms = 1 + Math.floor(Math.random() * 5);
    const property = await prisma.property.create({
      data: {
        ownerId: randomFrom(owners).id,
        title: `${bedrooms}BHK ${randomFrom(PROPERTY_TYPES)} in ${randomFrom(localities)}, ${city}`,
        description:
          "A well-maintained property with great connectivity, natural light, and modern amenities. " +
          "Ideal for families and working professionals looking for a comfortable living space.",
        price: 15000 + Math.floor(Math.random() * 200000),
        city,
        locality: randomFrom(localities),
        address: `${Math.floor(Math.random() * 999)}, Main Road, ${randomFrom(localities)}, ${city}`,
        propertyType: randomFrom(PROPERTY_TYPES),
        bedrooms,
        bathrooms: Math.max(1, bedrooms - 1),
        area: 500 + Math.floor(Math.random() * 2000),
        furnishing: randomFrom(FURNISHING_TYPES),
        amenities: randomAmenities(),
      },
    });

    await prisma.propertyImage.createMany({
      data: [0, 1, 2].map((idx) => ({
        propertyId: property.id,
        url: `https://picsum.photos/seed/${property.id}-${idx}/800/600`,
        sortOrder: idx,
        isPrimary: idx === 0,
      })),
    });
  }

  console.log(`Created ${BATCH_SIZE} properties with images.`);
  console.log(`Seeker login: seeker@example.com / Password123`);
  console.log("✅ Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
