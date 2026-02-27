/**
 * One-time script to backfill all 5 customization types for existing artists.
 * Run with: npx ts-node prisma/backfill-customizations.ts
 */
import { PrismaClient, CustomizationType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const ALL_TYPES = [
  { type: CustomizationType.AUTOGRAPH, description: 'Autografo personalizado' },
  { type: CustomizationType.HANDWRITTEN_LETTER, description: 'Carta manuscrita personalizada' },
  { type: CustomizationType.VIDEO_GREETING, description: 'Video saludo personalizado' },
  { type: CustomizationType.VIDEO_CALL, description: 'Videollamada con el artista' },
  { type: CustomizationType.PRODUCT_PERSONALIZATION, description: 'Personalizacion de producto' },
];

async function main() {
  const pool = new pg.Pool({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://postgres:admin123@localhost:5432/comediantes_db',
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const artists = await prisma.artist.findMany({ select: { id: true, stageName: true } });
  console.log(`Found ${artists.length} artists\n`);

  let created = 0;

  for (const artist of artists) {
    const existing = await prisma.artistCustomization.findMany({
      where: { artistId: artist.id },
      select: { type: true },
    });
    const existingTypes = existing.map((e) => e.type);
    const missing = ALL_TYPES.filter((t) => !existingTypes.includes(t.type));

    if (missing.length > 0) {
      await prisma.artistCustomization.createMany({
        data: missing.map((c) => ({
          artistId: artist.id,
          type: c.type,
          description: c.description,
          price: 0,
          isActive: false,
        })),
      });
      created += missing.length;
      console.log(`  ${artist.stageName}: added ${missing.length} customization(s)`);
    } else {
      console.log(`  ${artist.stageName}: already has all 5 types`);
    }
  }

  console.log(`\nDone! Created ${created} customization records.`);
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
