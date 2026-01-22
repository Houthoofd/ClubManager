import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Seed script to create initial data for development
 * Creates a default tenant with sample data
 */
async function main() {
  console.log('🌱 Starting seed...');

  // Create default tenant
  const defaultTenant = await prisma.tenant.upsert({
    where: { slug: 'default-club' },
    update: {},
    create: {
      name: 'Default Club',
      slug: 'default-club',
      domain: 'default-club',
      status: 'ACTIVE',
      plan: 'PRO',
      maxUsers: 100,
      maxStorage: 5000,
      settings: {
        timezone: 'Europe/Paris',
        language: 'fr',
        currency: 'EUR',
      },
    },
  });

  console.log('✅ Created default tenant:', defaultTenant.id);

  // Create reference data (shared across all tenants)

  // Genres
  const genres = await Promise.all([
    prisma.genre.upsert({
      where: { id: 1 },
      update: {},
      create: { genreName: 'Homme' },
    }),
    prisma.genre.upsert({
      where: { id: 2 },
      update: {},
      create: { genreName: 'Femme' },
    }),
    prisma.genre.upsert({
      where: { id: 3 },
      update: {},
      create: { genreName: 'Autre' },
    }),
  ]);

  console.log('✅ Created genres:', genres.length);

  // Status
  const statuses = await Promise.all([
    prisma.status.upsert({
      where: { id: 1 },
      update: {},
      create: {
        nomRole: 'Membre',
        description: 'Membre régulier du club',
      },
    }),
    prisma.status.upsert({
      where: { id: 2 },
      update: {},
      create: {
        nomRole: 'Instructeur',
        description: 'Instructeur/Professeur',
      },
    }),
    prisma.status.upsert({
      where: { id: 3 },
      update: {},
      create: {
        nomRole: 'Administrateur',
        description: 'Administrateur du club',
      },
    }),
  ]);

  console.log('✅ Created statuses:', statuses.length);

  // Grades
  const grades = await Promise.all([
    prisma.grade.upsert({
      where: { id: 1 },
      update: {},
      create: { nom: 'Débutant', ordre: 1 },
    }),
    prisma.grade.upsert({
      where: { id: 2 },
      update: {},
      create: { nom: 'Intermédiaire', ordre: 2 },
    }),
    prisma.grade.upsert({
      where: { id: 3 },
      update: {},
      create: { nom: 'Avancé', ordre: 3 },
    }),
    prisma.grade.upsert({
      where: { id: 4 },
      update: {},
      create: { nom: 'Expert', ordre: 4 },
    }),
  ]);

  console.log('✅ Created grades:', grades.length);

  // Plans Tarifaires
  const plans = await Promise.all([
    prisma.planTarifaire.upsert({
      where: { id: 1 },
      update: {},
      create: {
        nom: 'FREE',
        description: 'Plan gratuit - Fonctionnalités de base',
        prix: 0,
        duree: 1,
        actif: true,
        maxUsers: 10,
        maxStorage: 100,
        features: {
          users: 10,
          courses: 5,
          storage: 100,
          features: ['basic'],
        },
      },
    }),
    prisma.planTarifaire.upsert({
      where: { id: 2 },
      update: {},
      create: {
        nom: 'STARTER',
        description: 'Plan Starter - Pour petits clubs',
        prix: 29.99,
        duree: 1,
        actif: true,
        maxUsers: 50,
        maxStorage: 1000,
        features: {
          users: 50,
          courses: 25,
          storage: 1000,
          features: ['basic', 'analytics', 'email-support'],
        },
      },
    }),
    prisma.planTarifaire.upsert({
      where: { id: 3 },
      update: {},
      create: {
        nom: 'PRO',
        description: 'Plan Pro - Pour clubs moyens',
        prix: 79.99,
        duree: 1,
        actif: true,
        maxUsers: 200,
        maxStorage: 5000,
        features: {
          users: 200,
          courses: 100,
          storage: 5000,
          features: ['basic', 'analytics', 'custom-branding', 'api-access', 'priority-support'],
        },
      },
    }),
    prisma.planTarifaire.upsert({
      where: { id: 4 },
      update: {},
      create: {
        nom: 'ENTERPRISE',
        description: 'Plan Enterprise - Illimité',
        prix: 199.99,
        duree: 1,
        actif: true,
        maxUsers: -1,
        maxStorage: -1,
        features: {
          users: -1,
          courses: -1,
          storage: -1,
          features: ['*'],
        },
      },
    }),
  ]);

  console.log('✅ Created plans:', plans.length);

  // Tailles (pour la boutique)
  const tailles = await Promise.all([
    prisma.taille.upsert({
      where: { nom: 'XS' },
      update: {},
      create: { nom: 'XS' },
    }),
    prisma.taille.upsert({
      where: { nom: 'S' },
      update: {},
      create: { nom: 'S' },
    }),
    prisma.taille.upsert({
      where: { nom: 'M' },
      update: {},
      create: { nom: 'M' },
    }),
    prisma.taille.upsert({
      where: { nom: 'L' },
      update: {},
      create: { nom: 'L' },
    }),
    prisma.taille.upsert({
      where: { nom: 'XL' },
      update: {},
      create: { nom: 'XL' },
    }),
    prisma.taille.upsert({
      where: { nom: 'XXL' },
      update: {},
      create: { nom: 'XXL' },
    }),
  ]);

  console.log('✅ Created tailles:', tailles.length);

  // Alert Types
  const alertTypes = await Promise.all([
    prisma.alerteType.upsert({
      where: { code: 'PAYMENT_DUE' },
      update: {},
      create: {
        code: 'PAYMENT_DUE',
        nom: 'Paiement en attente',
        description: 'Un paiement est en attente',
        priorite: 'haute',
        actif: true,
      },
    }),
    prisma.alerteType.upsert({
      where: { code: 'LOW_ATTENDANCE' },
      update: {},
      create: {
        code: 'LOW_ATTENDANCE',
        nom: 'Faible assiduité',
        description: 'Assiduité en baisse',
        priorite: 'normale',
        actif: true,
      },
    }),
  ]);

  console.log('✅ Created alert types:', alertTypes.length);

  // Create admin user for default tenant
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.upsert({
    where: {
      unique_email_per_tenant: {
        email: 'admin@default-club.com',
        tenantId: defaultTenant.id,
      }
    },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      email: 'admin@default-club.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      dateOfBirth: new Date('1990-01-01'),
      genderId: 1,
      statusId: 3, // Administrateur
      gradeId: 1,
      actif: true,
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create sample users
  const sampleUsers = await Promise.all([
    prisma.user.create({
      data: {
        tenantId: defaultTenant.id,
        email: 'john.doe@default-club.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1995-05-15'),
        genderId: 1,
        statusId: 1,
        gradeId: 2,
        actif: true,
      },
    }),
    prisma.user.create({
      data: {
        tenantId: defaultTenant.id,
        email: 'jane.smith@default-club.com',
        password: hashedPassword,
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: new Date('1992-08-22'),
        genderId: 2,
        statusId: 2,
        gradeId: 3,
        actif: true,
      },
    }),
  ]);

  console.log('✅ Created sample users:', sampleUsers.length);

  // Create sample courses
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const courses = await Promise.all([
    prisma.cours.create({
      data: {
        tenantId: defaultTenant.id,
        dateCours: today,
        typeCours: 'Judo Adultes',
        heureDebut: new Date('1970-01-01T18:00:00'),
        heureFin: new Date('1970-01-01T19:30:00'),
        capaciteMax: 20,
        description: 'Cours de judo pour adultes tous niveaux',
        actif: true,
      },
    }),
    prisma.cours.create({
      data: {
        tenantId: defaultTenant.id,
        dateCours: tomorrow,
        typeCours: 'Judo Enfants',
        heureDebut: new Date('1970-01-01T17:00:00'),
        heureFin: new Date('1970-01-01T18:00:00'),
        capaciteMax: 15,
        description: 'Cours de judo pour enfants 8-12 ans',
        actif: true,
      },
    }),
  ]);

  console.log('✅ Created sample courses:', courses.length);

  // Create sample articles (shop)
  const articles = await Promise.all([
    prisma.article.create({
      data: {
        tenantId: defaultTenant.id,
        nom: 'Kimono Blanc',
        description: 'Kimono de judo blanc en coton',
        prix: 45.00,
        tailleId: 3, // M
        actif: true,
      },
    }),
    prisma.article.create({
      data: {
        tenantId: defaultTenant.id,
        nom: 'Ceinture Noire',
        description: 'Ceinture noire de judo',
        prix: 15.00,
        actif: true,
      },
    }),
  ]);

  console.log('✅ Created sample articles:', articles.length);

  // Create stock for articles
  for (const article of articles) {
    await prisma.stock.create({
      data: {
        articleId: article.id,
        quantite: 50,
        seuil_min: 10,
      },
    });
  }

  console.log('✅ Created stock entries');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`   - Tenant: ${defaultTenant.name} (${defaultTenant.slug})`);
  console.log(`   - Admin: ${adminUser.email} / admin123`);
  console.log(`   - Users: ${sampleUsers.length + 1} total`);
  console.log(`   - Courses: ${courses.length}`);
  console.log(`   - Shop Articles: ${articles.length}`);
  console.log('\n🔐 Login with:');
  console.log(`   Email: ${adminUser.email}`);
  console.log(`   Password: admin123`);
  console.log(`   Tenant: ${defaultTenant.slug}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
