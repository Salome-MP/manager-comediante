import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcrypt';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  const pool = new pg.Pool({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://postgres:admin123@localhost:5432/comediantes_db',
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('🎭 Seeding Comediantes.com database...\n');

  // ==========================================
  // PASSWORD HASHES
  // ==========================================
  const [adminHash, artistHash, fanHash] = await Promise.all([
    bcrypt.hash('admin123', 10),
    bcrypt.hash('artista123', 10),
    bcrypt.hash('fan12345', 10),
  ]);

  // ==========================================
  // SUPER ADMIN + STAFF
  // ==========================================
  const admin = await prisma.user.upsert({
    where: { email: 'admin@comediantes.com' },
    update: {},
    create: {
      email: 'admin@comediantes.com',
      password: adminHash,
      firstName: 'Admin',
      lastName: 'Principal',
      role: 'SUPER_ADMIN',
    },
  });
  console.log('Admin:', admin.email);

  const staff = await prisma.user.upsert({
    where: { email: 'staff@comediantes.com' },
    update: {},
    create: {
      email: 'staff@comediantes.com',
      password: adminHash,
      firstName: 'Carlos',
      lastName: 'Operaciones',
      role: 'STAFF',
    },
  });
  console.log('Staff:', staff.email);

  // ==========================================
  // CATEGORIES (parent + sub)
  // ==========================================
  const parentCategories = [
    { name: 'Ropa', sortOrder: 0 },
    { name: 'Accesorios', sortOrder: 1 },
    { name: 'Hogar', sortOrder: 2 },
    { name: 'Coleccionables', sortOrder: 3 },
  ];

  const parentMap: Record<string, string> = {};
  for (const cat of parentCategories) {
    const slug = generateSlug(cat.name);
    const created = await prisma.category.upsert({
      where: { slug },
      update: { sortOrder: cat.sortOrder, parentId: null },
      create: { name: cat.name, slug, sortOrder: cat.sortOrder, parentId: null },
    });
    parentMap[cat.name] = created.id;
  }
  console.log('Parent categories: 4');

  const subCategories = [
    { name: 'Poleras', parent: 'Ropa', sortOrder: 0, variantTemplates: [{ name: 'Talla', options: ['S', 'M', 'L', 'XL'] }, { name: 'Color', options: ['Negro', 'Blanco', 'Gris'] }] },
    { name: 'Hoodies', parent: 'Ropa', sortOrder: 1, variantTemplates: [{ name: 'Talla', options: ['S', 'M', 'L', 'XL'] }, { name: 'Color', options: ['Negro', 'Blanco', 'Gris'] }] },
    { name: 'Gorros', parent: 'Ropa', sortOrder: 2, variantTemplates: [{ name: 'Talla', options: ['S', 'M', 'L'] }, { name: 'Color', options: ['Negro', 'Blanco'] }] },
    { name: 'Casacas', parent: 'Ropa', sortOrder: 3, variantTemplates: [{ name: 'Talla', options: ['S', 'M', 'L', 'XL'] }, { name: 'Color', options: ['Negro', 'Blanco', 'Gris'] }] },
    { name: 'Pantalones', parent: 'Ropa', sortOrder: 4, variantTemplates: [{ name: 'Talla', options: ['S', 'M', 'L', 'XL'] }, { name: 'Color', options: ['Negro', 'Gris'] }] },
    { name: 'Stickers', parent: 'Accesorios', sortOrder: 0, variantTemplates: [] },
    { name: 'Llaveros', parent: 'Accesorios', sortOrder: 1, variantTemplates: [] },
    { name: 'Mochilas', parent: 'Accesorios', sortOrder: 2, variantTemplates: [{ name: 'Color', options: ['Negro', 'Blanco', 'Gris'] }] },
    { name: 'Pines', parent: 'Accesorios', sortOrder: 3, variantTemplates: [] },
    { name: 'Tazas', parent: 'Hogar', sortOrder: 0, variantTemplates: [] },
    { name: 'Posters', parent: 'Hogar', sortOrder: 1, variantTemplates: [] },
    { name: 'Cojines', parent: 'Hogar', sortOrder: 2, variantTemplates: [] },
    { name: 'Edicion Limitada', parent: 'Coleccionables', sortOrder: 0, variantTemplates: [{ name: 'Talla', options: ['S', 'M', 'L', 'XL'] }] },
    { name: 'Vinilos', parent: 'Coleccionables', sortOrder: 1, variantTemplates: [] },
  ];

  const categoryMap: Record<string, string> = { ...parentMap };
  for (const sub of subCategories) {
    const slug = generateSlug(sub.name);
    const created = await prisma.category.upsert({
      where: { slug },
      update: { sortOrder: sub.sortOrder, parentId: parentMap[sub.parent], variantTemplates: sub.variantTemplates },
      create: {
        name: sub.name,
        slug,
        sortOrder: sub.sortOrder,
        parentId: parentMap[sub.parent],
        variantTemplates: sub.variantTemplates,
      },
    });
    categoryMap[sub.name] = created.id;
  }
  console.log('Subcategories:', subCategories.length);

  // ==========================================
  // ARTISTS (25 comedians)
  // ==========================================
  const artistsData = [
    {
      email: 'jorge@comediantes.com',
      firstName: 'Jorge',
      lastName: 'Luna',
      stageName: 'Jorge Luna',
      tagline: 'El humor que necesitas',
      biography: 'Comediante peruano con más de 10 años de trayectoria en el stand-up comedy. Conocido por su estilo irreverente y sus observaciones sobre la vida cotidiana limeña.',
      isFeatured: true,
      commissionRate: 50,
      socialLinks: { instagram: '@jorgeluna', youtube: 'JorgeLunaComedy', tiktok: '@jorgeluna' },
    },
    {
      email: 'ricardo@comediantes.com',
      firstName: 'Ricardo',
      lastName: 'Mendoza',
      stageName: 'Ricardo Mendoza',
      tagline: 'Sin filtros, sin límites',
      biography: 'Uno de los comediantes más populares de Perú. Co-creador de "Hablando Huevadas". Su humor negro y directo lo ha llevado a llenar estadios en toda Latinoamérica.',
      isFeatured: true,
      commissionRate: 55,
      socialLinks: { instagram: '@ricardomendoza', youtube: 'RicardoMendozaOficial', tiktok: '@ricardomendoza' },
    },
    {
      email: 'carlos@comediantes.com',
      firstName: 'Carlos',
      lastName: 'Alcántara',
      stageName: 'Carlos Alcántara',
      tagline: 'La risa es mi superpoder',
      biography: 'Actor y comediante peruano legendario. Protagonista de las películas más taquilleras del cine peruano. Su carisma en el escenario es inigualable.',
      isFeatured: true,
      commissionRate: 60,
      socialLinks: { instagram: '@cachinalcantara', youtube: 'CarlosAlcantaraOficial' },
    },
    {
      email: 'danny@comediantes.com',
      firstName: 'Danny',
      lastName: 'Rosales',
      stageName: 'Danny Rosales',
      tagline: 'El cómico del pueblo',
      biography: 'Comediante peruano conocido por sus personajes icónicos y su conexión con el público popular. Más de 20 años haciendo reír al Perú.',
      isFeatured: false,
      commissionRate: 45,
      socialLinks: { instagram: '@dannyrosales', tiktok: '@dannyrosalesoficial' },
    },
    {
      email: 'checho@comediantes.com',
      firstName: 'Sergio',
      lastName: 'Galliani',
      stageName: 'Checho Galliani',
      tagline: 'Humor con clase',
      biography: 'Actor y comediante peruano de larga trayectoria. Conocido por su versatilidad y talento tanto en cine, televisión como en stand-up.',
      isFeatured: false,
      commissionRate: 50,
      socialLinks: { instagram: '@chechogalliani' },
    },
    {
      email: 'miguelito@comediantes.com',
      firstName: 'Miguel',
      lastName: 'Campos',
      stageName: 'Miguelito',
      tagline: 'Pequeño pero matador',
      biography: 'Comediante chileno-peruano reconocido por su espontaneidad y carisma. Ha conquistado audiencias en toda Latinoamérica con su estilo único.',
      isFeatured: true,
      commissionRate: 50,
      socialLinks: { instagram: '@miguelitocorta', tiktok: '@miguelitocorta' },
    },
    {
      email: 'clara@comediantes.com',
      firstName: 'Clara',
      lastName: 'Seminara',
      stageName: 'Clara Seminara',
      tagline: 'Humor sin estereotipos',
      biography: 'Comediante y actriz peruana. Pionera del stand-up femenino en Perú. Su humor inteligente y observacional la ha llevado a ser una de las voces más importantes de la comedia latina.',
      isFeatured: false,
      commissionRate: 48,
      socialLinks: { instagram: '@claraseminara', youtube: 'ClaraSeminaraComedy' },
    },
    {
      email: 'chelo@comediantes.com',
      firstName: 'Marcelo',
      lastName: 'Oxenford',
      stageName: 'Chelo Oxenford',
      tagline: 'Teatro, cine y stand-up',
      biography: 'Actor y comediante peruano con décadas de experiencia. Reconocido en teatro, cine y televisión. Su humor elegante y referencias culturales lo distinguen.',
      isFeatured: false,
      commissionRate: 50,
      socialLinks: { instagram: '@chelooxenford' },
    },
    {
      email: 'katia@comediantes.com',
      firstName: 'Katia',
      lastName: 'Palma',
      stageName: 'Katia Palma',
      tagline: 'Improvisación pura',
      biography: 'Actriz y comediante peruana, maestra de la improvisación. Conocida por su trabajo en televisión y teatro. Su energía en el escenario es contagiosa.',
      isFeatured: true,
      commissionRate: 52,
      socialLinks: { instagram: '@katiapalma', tiktok: '@katiapalma' },
    },
    {
      email: 'pablo@comediantes.com',
      firstName: 'Pablo',
      lastName: 'Villanueva',
      stageName: 'Melcochita Jr',
      tagline: 'La herencia del humor',
      biography: 'Comediante peruano que lleva la tradición familiar del humor. Con un estilo fresco y moderno, rinde homenaje a la comedia clásica peruana.',
      isFeatured: false,
      commissionRate: 45,
      socialLinks: { instagram: '@melcochitajr' },
    },
    {
      email: 'franco@comediantes.com',
      firstName: 'Franco',
      lastName: 'Escamilla',
      stageName: 'Franco Escamilla',
      tagline: 'Comedia con guitarra',
      biography: 'Comediante mexicano reconocido internacionalmente. Mezcla stand-up con música y storytelling. Sus especiales en Netflix lo han catapultado a la fama mundial.',
      isFeatured: true,
      commissionRate: 55,
      socialLinks: { instagram: '@francoescamilla', youtube: 'FrancoEscamillaOficial', tiktok: '@francoescamilla' },
    },
    {
      email: 'sofia@comediantes.com',
      firstName: 'Sofía',
      lastName: 'Niño de Rivera',
      stageName: 'Sofia Nino de Rivera',
      tagline: 'Stand-up sin censura',
      biography: 'Comediante mexicana, una de las primeras mujeres en hacer stand-up profesional en México. Sus especiales de Netflix y tours internacionales la convierten en referente.',
      isFeatured: true,
      commissionRate: 53,
      socialLinks: { instagram: '@sofiandr', youtube: 'SofiaNinoDeRivera' },
    },
    {
      email: 'roberto@comediantes.com',
      firstName: 'Roberto',
      lastName: 'Arguelles',
      stageName: 'Beto Arguelles',
      tagline: 'El humor colombiano en estado puro',
      biography: 'Comediante colombiano con un estilo narrativo único. Sus historias sobre la vida en Bogotá y la cultura colombiana hacen reír y reflexionar al mismo tiempo.',
      isFeatured: false,
      commissionRate: 48,
      socialLinks: { instagram: '@betoarguelles', tiktok: '@betoarguelles' },
    },
    {
      email: 'valentina@comediantes.com',
      firstName: 'Valentina',
      lastName: 'Quintero',
      stageName: 'Valentina Quintero',
      tagline: 'Humor venezolano universal',
      biography: 'Comediante venezolana radicada en Lima. Su humor sobre la migración, la adaptación y las diferencias culturales la han convertido en una voz importante de la diáspora.',
      isFeatured: false,
      commissionRate: 47,
      socialLinks: { instagram: '@valquinterocomedy', tiktok: '@valquintero' },
    },
    {
      email: 'andres@comediantes.com',
      firstName: 'Andrés',
      lastName: 'López',
      stageName: 'Andres Lopez',
      tagline: 'La pelota de letras',
      biography: 'Comediante colombiano legendario. Creador de "La Pelota de Letras", uno de los shows más exitosos de la comedia latinoamericana. Llena teatros en todo el continente.',
      isFeatured: true,
      commissionRate: 55,
      socialLinks: { instagram: '@andreslopez', youtube: 'AndresLopezOficial' },
    },
    {
      email: 'natalia@comediantes.com',
      firstName: 'Natalia',
      lastName: 'Valdebenito',
      stageName: 'Natalia Valdebenito',
      tagline: 'Comedia con actitud',
      biography: 'Comediante chilena, una de las más reconocidas de Sudamérica. Su humor feminista y sin filtros la ha llevado a llenar teatros y tener especiales internacionales.',
      isFeatured: true,
      commissionRate: 52,
      socialLinks: { instagram: '@natyvaldebenito', youtube: 'NataliaValdebenito' },
    },
    {
      email: 'luis@comediantes.com',
      firstName: 'Luis',
      lastName: 'Slimming',
      stageName: 'Luis Slimming',
      tagline: 'Humor ácido chileno',
      biography: 'Comediante chileno conocido por su humor negro y ácido. Sus rutinas sobre política y sociedad lo convierten en uno de los comediantes más afilados de Chile.',
      isFeatured: false,
      commissionRate: 48,
      socialLinks: { instagram: '@luisslimming', tiktok: '@luisslimming' },
    },
    {
      email: 'ale@comediantes.com',
      firstName: 'Alejandra',
      lastName: 'Azcárate',
      stageName: 'Alejandra Azcarate',
      tagline: 'Elegancia y humor',
      biography: 'Comediante y actriz colombiana. Su estilo sofisticado y sus observaciones sobre la sociedad colombiana la han posicionado como una de las grandes de la comedia latina.',
      isFeatured: false,
      commissionRate: 50,
      socialLinks: { instagram: '@aleazcarate' },
    },
    {
      email: 'hassam@comediantes.com',
      firstName: 'Gerly',
      lastName: 'Hassam',
      stageName: 'Hassam',
      tagline: 'El camaleón de la comedia',
      biography: 'Comediante colombiano famoso por sus imitaciones y personajes. Su versatilidad y talento para transformarse en distintos personajes lo hacen único.',
      isFeatured: true,
      commissionRate: 50,
      socialLinks: { instagram: '@hassam', youtube: 'HassamOficial' },
    },
    {
      email: 'polo@comediantes.com',
      firstName: 'Polo',
      lastName: 'Polo',
      stageName: 'Polo Polo',
      tagline: 'El maestro del doble sentido',
      biography: 'Leyenda de la comedia mexicana. Décadas de carrera lo convierten en uno de los comediantes más influyentes de México. Maestro del humor pícaro.',
      isFeatured: false,
      commissionRate: 55,
      socialLinks: { youtube: 'PoloPoloOficial' },
    },
    {
      email: 'gianmarco@comediantes.com',
      firstName: 'Gian Marco',
      lastName: 'Zignago',
      stageName: 'Gian Marco Comedy',
      tagline: 'De la música a la risa',
      biography: 'Músico y comediante peruano. Combina su talento musical con humor en presentaciones únicas que mezclan canciones y monólogos.',
      isFeatured: false,
      commissionRate: 50,
      socialLinks: { instagram: '@gianmarcocomedy', youtube: 'GianMarcoComedy' },
    },
    {
      email: 'pilar@comediantes.com',
      firstName: 'Pilar',
      lastName: 'Rojas',
      stageName: 'Pilar Rojas',
      tagline: 'Humor real y directo',
      biography: 'Comediante peruana emergente. Su estilo auténtico y sus historias sobre maternidad, relaciones y vida en Lima la están convirtiendo en una de las favoritas del público.',
      isFeatured: false,
      commissionRate: 45,
      socialLinks: { instagram: '@pilarrojascomedy', tiktok: '@pilarrojas' },
    },
    {
      email: 'diego@comediantes.com',
      firstName: 'Diego',
      lastName: 'Calderón',
      stageName: 'Diego Calderon',
      tagline: 'El humor del milenial',
      biography: 'Comediante peruano de la nueva generación. Sus rutinas sobre tecnología, redes sociales y la vida millennial conectan con el público joven.',
      isFeatured: false,
      commissionRate: 45,
      socialLinks: { instagram: '@diegocalderoncomedy', tiktok: '@diegocalderon' },
    },
    {
      email: 'pamela@comediantes.com',
      firstName: 'Pamela',
      lastName: 'Cabanillas',
      stageName: 'Pamela Cab',
      tagline: 'Comedia millennial',
      biography: 'Comediante peruana conocida en redes sociales. Sus sketches virales y su humor sobre la vida moderna la han convertido en una estrella del stand-up digital.',
      isFeatured: true,
      commissionRate: 48,
      socialLinks: { instagram: '@pamelacab', tiktok: '@pamelacab', youtube: 'PamelaCab' },
    },
    {
      email: 'raul@comediantes.com',
      firstName: 'Raúl',
      lastName: 'Santana',
      stageName: 'Raul Santana',
      tagline: 'El cuentacuentos',
      biography: 'Comediante ecuatoriano especializado en storytelling. Sus historias largas y detalladas mantienen al público en vilo entre la risa y la sorpresa.',
      isFeatured: false,
      commissionRate: 47,
      socialLinks: { instagram: '@raulsantanacomedy' },
    },
  ];

  const artistIds: string[] = [];

  for (const a of artistsData) {
    const slug = generateSlug(a.stageName);
    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: {},
      create: {
        email: a.email,
        password: artistHash,
        firstName: a.firstName,
        lastName: a.lastName,
        role: 'ARTIST',
        artist: {
          create: {
            stageName: a.stageName,
            slug,
            tagline: a.tagline,
            biography: a.biography,
            isFeatured: a.isFeatured,
            commissionRate: a.commissionRate,
            socialLinks: a.socialLinks,
          },
        },
      },
      include: { artist: true },
    });
    if (user.artist) {
      artistIds.push(user.artist.id);
    } else {
      // Already existed, fetch artist
      const existing = await prisma.artist.findUnique({ where: { userId: user.id } });
      if (existing) artistIds.push(existing.id);
    }
    console.log(`  Artist: ${a.stageName}`);
  }
  console.log(`Total artists: ${artistIds.length}\n`);

  // ==========================================
  // FAN USERS (10 fans)
  // ==========================================
  const fansData = [
    { email: 'fan@email.com', firstName: 'María', lastName: 'García' },
    { email: 'pedro@email.com', firstName: 'Pedro', lastName: 'Sánchez' },
    { email: 'lucia@email.com', firstName: 'Lucía', lastName: 'Torres' },
    { email: 'jose@email.com', firstName: 'José', lastName: 'Ramírez' },
    { email: 'ana@email.com', firstName: 'Ana', lastName: 'Morales' },
    { email: 'miguel@email.com', firstName: 'Miguel', lastName: 'Herrera' },
    { email: 'carmen@email.com', firstName: 'Carmen', lastName: 'Flores' },
    { email: 'david@email.com', firstName: 'David', lastName: 'Castillo' },
    { email: 'rosa@email.com', firstName: 'Rosa', lastName: 'Vega' },
    { email: 'juan@email.com', firstName: 'Juan', lastName: 'Paredes' },
  ];

  for (const f of fansData) {
    await prisma.user.upsert({
      where: { email: f.email },
      update: {},
      create: {
        email: f.email,
        password: fanHash,
        firstName: f.firstName,
        lastName: f.lastName,
        role: 'USER',
      },
    });
  }
  console.log(`Fan users: ${fansData.length}`);

  // ==========================================
  // BASE PRODUCTS (40 products)
  // ==========================================
  const productsData = [
    // POLERAS (8)
    { name: 'Polera Clásica Negra', category: 'Poleras', mfgCost: 15, sugPrice: 59.90, variants: [{ name: 'Talla', options: ['S', 'M', 'L', 'XL'] }] },
    { name: 'Polera Clásica Blanca', category: 'Poleras', mfgCost: 15, sugPrice: 59.90, variants: [{ name: 'Talla', options: ['S', 'M', 'L', 'XL'] }] },
    { name: 'Polera Oversize Premium', category: 'Poleras', mfgCost: 20, sugPrice: 79.90, variants: [{ name: 'Talla', options: ['M', 'L', 'XL', 'XXL'] }] },
    { name: 'Polera Manga Larga', category: 'Poleras', mfgCost: 18, sugPrice: 69.90, variants: [{ name: 'Talla', options: ['S', 'M', 'L', 'XL'] }] },
    { name: 'Polera Crop Top', category: 'Poleras', mfgCost: 14, sugPrice: 54.90, variants: [{ name: 'Talla', options: ['S', 'M', 'L'] }] },
    { name: 'Polera Tie Dye', category: 'Poleras', mfgCost: 22, sugPrice: 84.90, variants: [{ name: 'Talla', options: ['S', 'M', 'L', 'XL'] }] },
    { name: 'Polera Vintage', category: 'Poleras', mfgCost: 19, sugPrice: 74.90, variants: [{ name: 'Talla', options: ['S', 'M', 'L', 'XL'] }] },
    { name: 'Polera Deportiva Dry-Fit', category: 'Poleras', mfgCost: 25, sugPrice: 89.90, variants: [{ name: 'Talla', options: ['S', 'M', 'L', 'XL'] }] },

    // HOODIES (4)
    { name: 'Hoodie Clásico', category: 'Hoodies', mfgCost: 30, sugPrice: 129.90, variants: [{ name: 'Talla', options: ['S', 'M', 'L', 'XL'] }] },
    { name: 'Hoodie Zip-Up Premium', category: 'Hoodies', mfgCost: 35, sugPrice: 149.90, variants: [{ name: 'Talla', options: ['S', 'M', 'L', 'XL'] }] },
    { name: 'Hoodie Oversize', category: 'Hoodies', mfgCost: 33, sugPrice: 139.90, variants: [{ name: 'Talla', options: ['M', 'L', 'XL', 'XXL'] }] },
    { name: 'Hoodie Cropped Mujer', category: 'Hoodies', mfgCost: 28, sugPrice: 119.90, variants: [{ name: 'Talla', options: ['S', 'M', 'L'] }] },

    // GORROS (3)
    { name: 'Gorro Snapback', category: 'Gorros', mfgCost: 12, sugPrice: 49.90, variants: [{ name: 'Color', options: ['Negro', 'Blanco', 'Gris'] }] },
    { name: 'Gorro Dad Hat', category: 'Gorros', mfgCost: 10, sugPrice: 44.90, variants: [{ name: 'Color', options: ['Negro', 'Beige', 'Azul'] }] },
    { name: 'Beanie Invernal', category: 'Gorros', mfgCost: 8, sugPrice: 39.90, variants: [{ name: 'Color', options: ['Negro', 'Gris', 'Rojo'] }] },

    // CASACAS (3)
    { name: 'Casaca Bomber', category: 'Casacas', mfgCost: 45, sugPrice: 199.90, variants: [{ name: 'Talla', options: ['S', 'M', 'L', 'XL'] }] },
    { name: 'Casaca Denim', category: 'Casacas', mfgCost: 40, sugPrice: 179.90, variants: [{ name: 'Talla', options: ['S', 'M', 'L', 'XL'] }] },
    { name: 'Casaca Cortaviento', category: 'Casacas', mfgCost: 35, sugPrice: 159.90, variants: [{ name: 'Talla', options: ['S', 'M', 'L', 'XL'] }] },

    // PANTALONES (2)
    { name: 'Jogger Streetwear', category: 'Pantalones', mfgCost: 28, sugPrice: 109.90, variants: [{ name: 'Talla', options: ['S', 'M', 'L', 'XL'] }] },
    { name: 'Short Deportivo', category: 'Pantalones', mfgCost: 18, sugPrice: 69.90, variants: [{ name: 'Talla', options: ['S', 'M', 'L', 'XL'] }] },

    // STICKERS (2)
    { name: 'Pack Stickers x10', category: 'Stickers', mfgCost: 3, sugPrice: 14.90, variants: [] },
    { name: 'Sticker Holográfico Grande', category: 'Stickers', mfgCost: 2, sugPrice: 9.90, variants: [] },

    // LLAVEROS (2)
    { name: 'Llavero Acrílico', category: 'Llaveros', mfgCost: 4, sugPrice: 19.90, variants: [] },
    { name: 'Llavero Metálico Premium', category: 'Llaveros', mfgCost: 6, sugPrice: 29.90, variants: [] },

    // MOCHILAS (2)
    { name: 'Mochila Urbana', category: 'Mochilas', mfgCost: 35, sugPrice: 149.90, variants: [{ name: 'Color', options: ['Negro', 'Gris'] }] },
    { name: 'Tote Bag Canvas', category: 'Mochilas', mfgCost: 10, sugPrice: 39.90, variants: [{ name: 'Color', options: ['Natural', 'Negro'] }] },

    // PINES (1)
    { name: 'Set de Pines Esmaltados x3', category: 'Pines', mfgCost: 5, sugPrice: 24.90, variants: [] },

    // TAZAS (3)
    { name: 'Taza Mágica (cambia color)', category: 'Tazas', mfgCost: 8, sugPrice: 34.90, variants: [] },
    { name: 'Taza Cerámica 11oz', category: 'Tazas', mfgCost: 6, sugPrice: 29.90, variants: [] },
    { name: 'Termo Acero 500ml', category: 'Tazas', mfgCost: 15, sugPrice: 59.90, variants: [{ name: 'Color', options: ['Negro', 'Blanco', 'Rojo'] }] },

    // POSTERS (2)
    { name: 'Poster A3 Alta Calidad', category: 'Posters', mfgCost: 5, sugPrice: 24.90, variants: [] },
    { name: 'Poster A2 Enmarcado', category: 'Posters', mfgCost: 18, sugPrice: 79.90, variants: [] },

    // COJINES (2)
    { name: 'Cojín Decorativo 40x40', category: 'Cojines', mfgCost: 12, sugPrice: 49.90, variants: [] },
    { name: 'Cojín Grande 60x60', category: 'Cojines', mfgCost: 18, sugPrice: 69.90, variants: [] },

    // EDICION LIMITADA (3)
    { name: 'Box Set Coleccionista', category: 'Edicion Limitada', mfgCost: 50, sugPrice: 249.90, variants: [{ name: 'Talla Polera', options: ['S', 'M', 'L', 'XL'] }] },
    { name: 'Polera Firmada Numerada', category: 'Edicion Limitada', mfgCost: 25, sugPrice: 149.90, variants: [{ name: 'Talla', options: ['S', 'M', 'L', 'XL'] }] },
    { name: 'Art Print Numerado', category: 'Edicion Limitada', mfgCost: 10, sugPrice: 89.90, variants: [] },

    // VINILOS (2)
    { name: 'Vinilo Decorativo Set', category: 'Vinilos', mfgCost: 8, sugPrice: 34.90, variants: [] },
    { name: 'Vinilo para Laptop', category: 'Vinilos', mfgCost: 4, sugPrice: 19.90, variants: [] },
  ];

  const productIds: string[] = [];
  for (const p of productsData) {
    const slug = generateSlug(p.name);
    const product = await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name: p.name,
        slug,
        description: `${p.name} - Producto oficial de Comediantes.com. Diseño exclusivo del artista, alta calidad garantizada.`,
        categoryId: categoryMap[p.category],
        manufacturingCost: p.mfgCost,
        suggestedPrice: p.sugPrice,
        images: [],
        variants: p.variants,
      },
    });
    productIds.push(product.id);
  }
  console.log(`Base products: ${productIds.length}`);

  // ==========================================
  // ARTIST-PRODUCT ASSIGNMENTS
  // Each artist gets 6-15 random products with custom prices
  // ==========================================
  let totalArtistProducts = 0;

  for (let i = 0; i < artistIds.length; i++) {
    const artistId = artistIds[i];
    // Each artist gets a different subset of products
    const numProducts = 6 + Math.floor(Math.abs(Math.sin(i * 7)) * 10); // 6-15
    const shuffled = [...productIds].sort(() => Math.sin(i + productIds.indexOf(productIds[0])) - 0.5);
    const selectedProducts = shuffled.slice(0, Math.min(numProducts, productIds.length));

    for (const productId of selectedProducts) {
      const product = productsData[productIds.indexOf(productId)];
      if (!product) continue;

      // Vary the sale price slightly per artist (-5% to +15%)
      const priceMultiplier = 0.95 + (Math.abs(Math.sin(i * 3 + productIds.indexOf(productId) * 5)) * 0.20);
      const salePrice = Math.round(product.sugPrice * priceMultiplier * 100) / 100;
      const commission = 40 + Math.floor(Math.abs(Math.sin(i * 11 + productIds.indexOf(productId))) * 20); // 40-60%
      const stock = 10 + Math.floor(Math.abs(Math.sin(i * 13 + productIds.indexOf(productId) * 7)) * 90); // 10-100

      try {
        await prisma.artistProduct.create({
          data: {
            artistId,
            productId,
            salePrice,
            artistCommission: commission,
            stock,
            isActive: true,
            isFeatured: Math.random() > 0.7,
          },
        });
        totalArtistProducts++;
      } catch {
        // Skip duplicate artist-product combos
      }
    }
  }
  console.log(`Artist-Product assignments: ${totalArtistProducts}`);

  // ==========================================
  // SHOWS (2-3 per featured artist)
  // ==========================================
  const venues = [
    { name: 'Teatro Municipal de Lima', address: 'Jr. Ica 300, Cercado de Lima', city: 'Lima' },
    { name: 'Centro de Convenciones de Lima', address: 'Av. Javier Prado Este 2465, San Borja', city: 'Lima' },
    { name: 'Teatro Peruano Japonés', address: 'Av. Gregorio Escobedo 803, Jesús María', city: 'Lima' },
    { name: 'Auditorio del Pentagonito', address: 'Av. Boulevard s/n, San Borja', city: 'Lima' },
    { name: 'Teatro Canout', address: 'Jr. Manuel Segura 199, Cercado de Lima', city: 'Lima' },
    { name: 'Plaza Arena', address: 'Av. Arequipa 2450, Lince', city: 'Lima' },
    { name: 'Teatro Marsano', address: 'Av. Mariscal La Mar 1075, Miraflores', city: 'Lima' },
    { name: 'Centro Cultural PUCP', address: 'Av. Camino Real 1075, San Isidro', city: 'Lima' },
    { name: 'Teatro La Plaza', address: 'Larcomar, Miraflores', city: 'Lima' },
    { name: 'Estadio Nacional', address: 'Paseo de la República, Cercado de Lima', city: 'Lima' },
    { name: 'Arena Perú', address: 'Av. Angamos Este, Surquillo', city: 'Lima' },
    { name: 'Teatro Municipal de Arequipa', address: 'Calle Mercaderes 210', city: 'Arequipa' },
    { name: 'Teatro Municipal de Trujillo', address: 'Jr. San Martín 375', city: 'Trujillo' },
    { name: 'Auditorio Santa Úrsula', address: 'Av. Santo Toribio 135, San Isidro', city: 'Lima' },
  ];

  const showNames = [
    'Noche de Stand-Up', 'Sin Filtros Tour', 'Riéndose a Carcajadas',
    'Comedy Night Live', 'Humor Sin Censura', 'La Última Risa',
    'Monólogos de Medianoche', 'Tour Latinoamérica 2026', 'Show Especial de Aniversario',
    'Festival de la Risa', 'Open Mic Deluxe', 'Gira Nacional 2026',
  ];

  let totalShows = 0;
  for (let i = 0; i < artistIds.length; i++) {
    const numShows = 1 + Math.floor(Math.abs(Math.sin(i * 17)) * 3); // 1-3 shows
    for (let j = 0; j < numShows; j++) {
      const venue = venues[(i * 3 + j) % venues.length];
      const showName = `${showNames[(i + j) % showNames.length]}`;
      const slug = generateSlug(`${artistsData[i].stageName}-${showName}-${j + 1}`);
      // Future dates: 1-6 months from now
      const daysAhead = 15 + Math.floor(Math.abs(Math.sin(i * 5 + j * 3)) * 165);
      const showDate = new Date();
      showDate.setDate(showDate.getDate() + daysAhead);
      showDate.setHours(20, 0, 0, 0);

      const ticketPrice = 30 + Math.floor(Math.abs(Math.sin(i * 7 + j)) * 170); // 30-200
      const capacity = 100 + Math.floor(Math.abs(Math.sin(i * 11 + j * 2)) * 900); // 100-1000

      try {
        await prisma.show.upsert({
          where: { slug },
          update: {},
          create: {
            artistId: artistIds[i],
            name: showName,
            slug,
            description: `${showName} con ${artistsData[i].stageName}. Una noche inolvidable de humor en ${venue.name}. No te lo pierdas!`,
            venue: venue.name,
            address: venue.address,
            city: venue.city,
            date: showDate,
            ticketPrice,
            totalCapacity: capacity,
            ticketsEnabled: true,
            status: 'SCHEDULED',
          },
        });
        totalShows++;
      } catch {
        // Skip duplicates
      }
    }
  }
  console.log(`Shows: ${totalShows}`);

  // ==========================================
  // COUPONS
  // ==========================================
  const couponsData = [
    { code: 'BIENVENIDO10', description: 'Descuento de bienvenida', discountType: 'percentage', discountValue: 10, minPurchase: 50 },
    { code: 'HUMOR20', description: '20% en toda la tienda', discountType: 'percentage', discountValue: 20, minPurchase: 100, maxUses: 200 },
    { code: 'ENVIOGRATIS', description: 'Envío gratis', discountType: 'fixed', discountValue: 15, minPurchase: 80 },
    { code: 'COMEDY50', description: 'S/ 50 de descuento', discountType: 'fixed', discountValue: 50, minPurchase: 200, maxUses: 50 },
    { code: 'NAVIDAD25', description: 'Promo navideña 25%', discountType: 'percentage', discountValue: 25, minPurchase: 150, maxUses: 100 },
  ];

  for (const c of couponsData) {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 6);
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code,
        description: c.description,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minPurchase: c.minPurchase,
        maxUses: c.maxUses ?? null,
        isActive: true,
        expiresAt,
      },
    });
  }
  console.log(`Coupons: ${couponsData.length}`);

  // ==========================================
  // REVIEWS (fans reviewing random products)
  // ==========================================
  const fanUsers = await prisma.user.findMany({
    where: { role: 'USER' },
    select: { id: true },
  });

  const allArtistProducts = await prisma.artistProduct.findMany({
    select: { id: true },
  });

  let totalReviews = 0;
  const comments = [
    'Excelente calidad, me encantó!',
    'Muy buen producto, lo recomiendo.',
    'Llegó rápido y bien empaquetado.',
    'El diseño es increíble, tal cual la foto.',
    'Buena calidad pero la talla corre un poco grande.',
    'Regalo perfecto para fans de la comedia.',
    'Super bonito, mi favorito!',
    'Cumple con lo esperado, buena compra.',
    'La calidad del material es premium.',
    'Me encanta, ya es mi segundo pedido!',
    null, // some reviews have no comment
    null,
    null,
  ];

  // Each fan reviews 15-40 random products
  for (let fi = 0; fi < fanUsers.length; fi++) {
    const fan = fanUsers[fi];
    const numReviews = 15 + Math.floor(Math.abs(Math.sin(fi * 13)) * 25);
    const shuffledProducts = [...allArtistProducts].sort(
      () => Math.sin(fi * 7 + allArtistProducts.length) - 0.5,
    );
    const toReview = shuffledProducts.slice(0, Math.min(numReviews, shuffledProducts.length));

    for (let ri = 0; ri < toReview.length; ri++) {
      // Weighted towards 4-5 stars (realistic e-commerce distribution)
      const rand = Math.abs(Math.sin(fi * 11 + ri * 7));
      let rating: number;
      if (rand < 0.05) rating = 1;
      else if (rand < 0.10) rating = 2;
      else if (rand < 0.20) rating = 3;
      else if (rand < 0.50) rating = 4;
      else rating = 5;

      const comment = comments[Math.floor(Math.abs(Math.sin(fi * 3 + ri * 5)) * comments.length)] || null;

      try {
        await prisma.review.create({
          data: {
            userId: fan.id,
            artistProductId: toReview[ri].id,
            rating,
            comment,
          },
        });
        totalReviews++;
      } catch {
        // Skip duplicates (unique constraint)
      }
    }
  }
  console.log(`Reviews: ${totalReviews}`);

  // ==========================================
  // DONE
  // ==========================================
  await prisma.$disconnect();
  await pool.end();

  console.log('\n========================================');
  console.log('  Seed completed successfully!');
  console.log('========================================');
  console.log('\nLogin credentials (all artists use artista123):');
  console.log('  Admin:   admin@comediantes.com / admin123');
  console.log('  Staff:   staff@comediantes.com / admin123');
  console.log('  Artists: jorge@comediantes.com / artista123');
  console.log('           ricardo@comediantes.com / artista123');
  console.log('           carlos@comediantes.com / artista123');
  console.log('           ... (25 artists total)');
  console.log('  Fans:    fan@email.com / fan12345');
  console.log('           ... (10 fans total)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
