/**
 * Script d'initialisation des données de test pour le système SaaS multitenant ClubManager
 */

import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config()

const prisma = new PrismaClient()

async function initSaasData() {
  console.log('🚀 Initialisation des données SaaS multitenant...')
  
  try {
    // 0. Créer les données de référence d'abord
    const statusAdmin = await prisma.status.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        nomRole: 'Administrateur',
        description: 'Administrateur de club'
      }
    })
    
    const gradeAdmin = await prisma.grade.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        nom: 'Administrateur',
        ordre: 1
      }
    })
    
    console.log('✅ Données de référence créées (Status & Grade)')
    
    // 1. Créer des tenants de test
    const tenant1 = await prisma.tenant.upsert({
      where: { slug: 'demo-club' },
      update: {},
      create: {
        name: 'Club de Football de Démo',
        slug: 'demo-club',
        plan: 'PREMIUM',
        status: 'ACTIVE',
        settings: {
          theme: 'football',
          language: 'fr',
          timezone: 'Europe/Paris',
          features: {
            members: true,
            events: true,
            payments: true,
            notifications: true
          }
        }
      }
    })
    
    const tenant2 = await prisma.tenant.upsert({
      where: { slug: 'tennis-club' },
      update: {},
      create: {
        name: 'Tennis Club Municipal',
        slug: 'tennis-club',
        plan: 'BASIC',
        status: 'ACTIVE',
        settings: {
          theme: 'tennis',
          language: 'fr',
          timezone: 'Europe/Paris',
          features: {
            members: true,
            events: true,
            payments: false,
            notifications: false
          }
        }
      }
    })
    
    console.log(`✅ Tenant créé: ${tenant1.name} (${tenant1.slug})`)
    console.log(`✅ Tenant créé: ${tenant2.name} (${tenant2.slug})`)
    
    // 2. Créer des utilisateurs admin pour chaque tenant
    const admin1 = await prisma.user.upsert({
      where: { 
        unique_email_per_tenant: {
          email: 'admin@demo-club.com',
          tenantId: tenant1.id
        }
      },
      update: {},
      create: {
        email: 'admin@demo-club.com',
        firstName: 'Administrateur',
        lastName: 'Démo',
        tenantId: tenant1.id,
        dateOfBirth: new Date('1990-01-01'),
        statusId: 1,
        gradeId: 1
      }
    })
    
    const admin2 = await prisma.user.upsert({
      where: { 
        unique_email_per_tenant: {
          email: 'admin@tennis-club.com',
          tenantId: tenant2.id
        }
      },
      update: {},
      create: {
        email: 'admin@tennis-club.com', 
        firstName: 'Admin',
        lastName: 'Tennis',
        tenantId: tenant2.id,
        dateOfBirth: new Date('1985-05-15'),
        statusId: 1,
        gradeId: 1
      }
    })
    
    console.log(`✅ Admin créé: ${admin1.firstName} ${admin1.lastName} (${admin1.email})`)
    console.log(`✅ Admin créé: ${admin2.firstName} ${admin2.lastName} (${admin2.email})`)
    
    // 3. Créer des plans tarifaires
    const planPremium = await prisma.planTarifaire.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        nom: 'Premium',
        description: 'Plan Premium avec toutes les fonctionnalités',
        prix: 49.99,
        duree: 1,
        maxUsers: 500,
        maxStorage: 10000,
        features: {
          members: true,
          events: true,
          payments: true,
          notifications: true,
          customBranding: true,
          api: true
        }
      }
    })
    
    const planBasic = await prisma.planTarifaire.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        nom: 'Basic',
        description: 'Plan Basic avec fonctionnalités de base',
        prix: 19.99,
        duree: 1,
        maxUsers: 50,
        maxStorage: 1000,
        features: {
          members: true,
          events: true,
          payments: false,
          notifications: false,
          customBranding: false,
          api: false
        }
      }
    })
    
    console.log('✅ Plans tarifaires créés')
    
    // 4. Créer des abonnements pour les tenants
    const subscription1 = await prisma.tenantSubscription.create({
      data: {
        tenantId: tenant1.id,
        planId: planPremium.id,
        status: 'ACTIVE',
        price: 49.99,
        currency: 'EUR',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
      }
    })
    
    const subscription2 = await prisma.tenantSubscription.create({
      data: {
        tenantId: tenant2.id,
        planId: planBasic.id,
        status: 'ACTIVE',
        price: 19.99,
        currency: 'EUR',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
      }
    })
    
    console.log(`✅ Abonnement créé: ${planPremium.nom} pour ${tenant1.name}`)
    console.log(`✅ Abonnement créé: ${planBasic.nom} pour ${tenant2.name}`)
    
    // 5. Statistiques finales
    const totalTenants = await prisma.tenant.count()
    const totalUsers = await prisma.user.count()
    const totalSubscriptions = await prisma.tenantSubscription.count()
    const totalPlans = await prisma.planTarifaire.count()
    
    console.log('')
    console.log('🎯 Initialisation terminée avec succès !')
    console.log(`   📊 ${totalTenants} tenants créés`)
    console.log(`   👥 ${totalUsers} utilisateurs créés`) 
    console.log(`   💳 ${totalSubscriptions} abonnements actifs`)
    console.log(`   📋 ${totalPlans} plans tarifaires disponibles`)
    console.log('')
    console.log('🌐 URLs d\'accès:')
    console.log(`   • http://demo-club.clubmanager.local - ${tenant1.name}`)
    console.log(`   • http://tennis-club.clubmanager.local - ${tenant2.name}`)
    console.log('')
    console.log('🔐 Comptes admin:')
    console.log(`   • admin@demo-club.com (${tenant1.name})`)
    console.log(`   • admin@tennis-club.com (${tenant2.name})`)
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter l'initialisation
initSaasData().catch(console.error)