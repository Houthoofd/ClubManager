/**
 * ============================================================================
 * EXEMPLES D'UTILISATION DES PROCÉDURES STOCKÉES
 * ============================================================================
 *
 * Ce fichier contient des exemples concrets d'utilisation des procédures
 * stockées dans l'API ClubManager.
 *
 * ============================================================================
 */

import { PrismaClient } from '@prisma/client';
import { StoredProcedures } from './stored-procedures';

const prisma = new PrismaClient();

// ============================================================================
// EXEMPLE 1: INSCRIRE UN UTILISATEUR À UN SPORT
// ============================================================================

export async function exemple1_inscrireUtilisateurSport() {
  console.log('=== EXEMPLE 1: Inscrire un utilisateur à un sport ===\n');

  try {
    const result = await StoredProcedures.addUserSport(prisma, {
      userId: 1,
      sportId: 2, // Ex: Karaté
      initialGradeId: 5, // Ex: Ceinture blanche
      startDate: new Date(),
      isPrimary: true,
      subscriptionTypeId: 1
    });

    if (result.success) {
      console.log('✅ Succès:', result.message);
      console.log('   ID UserSport:', result.userSportId);
    } else {
      console.log('❌ Échec:', result.message);
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// ============================================================================
// EXEMPLE 2: PROMOUVOIR UN UTILISATEUR À UN NOUVEAU GRADE
// ============================================================================

export async function exemple2_promouvoirGrade() {
  console.log('\n=== EXEMPLE 2: Passage de grade ===\n');

  try {
    const result = await StoredProcedures.promoteUserGrade(prisma, {
      userId: 1,
      sportId: 2,
      newGradeId: 6, // Ex: Ceinture jaune
      examinedBy: 10, // ID du professeur/examinateur
      obtainedAt: new Date(),
      examScore: 85.5,
      notes: 'Excellent kata, bon kumite'
    });

    if (result.success) {
      console.log('✅ Succès:', result.message);
      console.log('   ID Historique:', result.historyId);
    } else {
      console.log('❌ Échec:', result.message);
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// ============================================================================
// EXEMPLE 3: CRÉER UN COURS RÉCURRENT AVEC PROFESSEURS
// ============================================================================

export async function exemple3_creerCoursRecurrent() {
  console.log('\n=== EXEMPLE 3: Créer un cours récurrent ===\n');

  try {
    const result = await StoredProcedures.createRecurringCourseWithTeachers(prisma, {
      sportId: 2,
      courseTypeId: 1,
      dayOfWeek: 'lundi',
      startTime: '18:00:00',
      endTime: '19:30:00',
      maxCapacity: 20,
      location: 'Dojo principal',
      teacherIds: [10, 15] // IDs des professeurs
    });

    if (result.success) {
      console.log('✅ Succès:', result.message);
      console.log('   ID Cours:', result.data?.courseId);
    } else {
      console.log('❌ Échec:', result.message);
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// ============================================================================
// EXEMPLE 4: INSCRIRE UN UTILISATEUR À UN COURS
// ============================================================================

export async function exemple4_inscrireUtilisateurCours() {
  console.log('\n=== EXEMPLE 4: Inscrire un utilisateur à un cours ===\n');

  try {
    const result = await StoredProcedures.enrollUserInCourse(prisma, {
      userId: 1,
      courseId: 42, // ID d'un cours spécifique
      status: 'active'
    });

    if (result.success) {
      console.log('✅ Succès:', result.message);
      console.log('   ID Inscription:', result.data?.inscriptionId);
    } else {
      console.log('❌ Échec:', result.message);
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// ============================================================================
// EXEMPLE 5: MARQUER LA PRÉSENCE
// ============================================================================

export async function exemple5_marquerPresence() {
  console.log('\n=== EXEMPLE 5: Marquer la présence ===\n');

  try {
    const result = await StoredProcedures.markAttendance(prisma, {
      userId: 1,
      courseId: 42,
      status: 'present',
      notes: 'Participation active'
    });

    if (result.success) {
      console.log('✅ Succès:', result.message);
      console.log('   ID Présence:', result.data?.attendanceId);
    } else {
      console.log('❌ Échec:', result.message);
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// ============================================================================
// EXEMPLE 6: VÉRIFIER LES PAIEMENTS EN RETARD
// ============================================================================

export async function exemple6_paiementsEnRetard() {
  console.log('\n=== EXEMPLE 6: Paiements en retard ===\n');

  try {
    const overduePayments = await StoredProcedures.checkOverduePayments(
      prisma,
      7, // Jours de retard minimum
      2  // Sport ID (optionnel)
    );

    console.log(`✅ Trouvé ${overduePayments.length} paiement(s) en retard:\n`);

    overduePayments.forEach((payment: any) => {
      console.log(`   - ${payment.full_name}`);
      console.log(`     Email: ${payment.email}`);
      console.log(`     Montant: ${payment.amount}€`);
      console.log(`     Retard: ${payment.days_overdue} jours`);
      console.log(`     Sport: ${payment.sport_name}`);
      console.log('');
    });
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// ============================================================================
// EXEMPLE 7: INSCRIRE À UN ÉVÉNEMENT
// ============================================================================

export async function exemple7_inscrireEvenement() {
  console.log('\n=== EXEMPLE 7: Inscrire à un événement ===\n');

  try {
    const result = await StoredProcedures.registerEventParticipant(prisma, {
      userId: 1,
      eventId: 5, // ID de l'événement
      registrationType: 'competitor',
      notes: 'Catégorie -75kg'
    });

    if (result.success) {
      console.log('✅ Succès:', result.message);
      console.log('   ID Inscription:', result.data?.registrationId);
    } else {
      console.log('❌ Échec:', result.message);
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// ============================================================================
// EXEMPLE 8: STATISTIQUES DE FRÉQUENTATION
// ============================================================================

export async function exemple8_statistiquesFrequentation() {
  console.log('\n=== EXEMPLE 8: Statistiques de fréquentation ===\n');

  try {
    const stats = await StoredProcedures.getUserAttendanceStatistics(
      prisma,
      1, // User ID
      2, // Sport ID (optionnel)
      new Date('2024-01-01'),
      new Date('2024-12-31')
    );

    console.log('✅ Statistiques récupérées:');
    console.log('   Overview:', stats.overview);
    console.log('   Par mois:', stats.byMonth);
    console.log('   Par sport:', stats.bySport);
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// ============================================================================
// EXEMPLE 9: STATISTIQUES SPORTIVES D'UN UTILISATEUR
// ============================================================================

export async function exemple9_statistiquesSportives() {
  console.log('\n=== EXEMPLE 9: Statistiques sportives ===\n');

  try {
    const stats = await StoredProcedures.getUserSportStats(
      prisma,
      1, // User ID
      2  // Sport ID (optionnel)
    );

    console.log(`✅ Trouvé ${stats.length} statistique(s):\n`);

    stats.forEach((stat: any) => {
      console.log(`   Sport ID: ${stat.sportId}`);
      console.log(`   Total sessions: ${stat.totalSessions}`);
      console.log(`   Total heures: ${stat.totalHours}h`);
      console.log(`   Taux présence: ${stat.averageAttendance}%`);
      console.log('');
    });
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// ============================================================================
// EXEMPLE 10: RAPPORT FINANCIER
// ============================================================================

export async function exemple10_rapportFinancier() {
  console.log('\n=== EXEMPLE 10: Rapport financier ===\n');

  try {
    const report = await StoredProcedures.getFinancialReport(
      prisma,
      new Date('2024-01-01'),
      new Date('2024-12-31'),
      2 // Sport ID (optionnel)
    );

    console.log('✅ Rapport financier généré:');
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// ============================================================================
// EXEMPLE 11: EXPORT DONNÉES RGPD
// ============================================================================

export async function exemple11_exportRGPD() {
  console.log('\n=== EXEMPLE 11: Export données RGPD ===\n');

  try {
    const userData = await StoredProcedures.exportUserDataGdpr(prisma, 1);

    console.log('✅ Données utilisateur exportées (RGPD):');
    console.log('   Profil:', userData.profile);
    console.log('   Sports:', userData.sports?.length || 0);
    console.log('   Paiements:', userData.payments?.length || 0);
    console.log('   Inscriptions:', userData.enrollments?.length || 0);
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// ============================================================================
// EXEMPLE 12: GÉNÉRER UN TOKEN
// ============================================================================

export async function exemple12_genererToken() {
  console.log('\n=== EXEMPLE 12: Générer un token ===\n');

  try {
    const token = await StoredProcedures.generateToken(prisma);
    console.log('✅ Token généré:', token);
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// ============================================================================
// EXEMPLE 13: VALIDATION EMAIL
// ============================================================================

export async function exemple13_validationEmail() {
  console.log('\n=== EXEMPLE 13: Validation email ===\n');

  try {
    // Créer un token de validation
    const tokenData = await StoredProcedures.createEmailValidationToken(prisma, 1);
    console.log('✅ Token créé:', tokenData.token);
    console.log('   Expire le:', tokenData.expires_at);

    // Valider le token
    const validation = await StoredProcedures.validateEmailToken(prisma, tokenData.token);
    if (validation.valid) {
      console.log('✅ Token validé pour utilisateur ID:', validation.userId);
    } else {
      console.log('❌ Token invalide ou expiré');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// ============================================================================
// EXEMPLE 14: GESTION DES PROFESSEURS
// ============================================================================

export async function exemple14_gestionProfesseurs() {
  console.log('\n=== EXEMPLE 14: Gestion des professeurs ===\n');

  try {
    const result = await StoredProcedures.removeTeacherFromCourse(
      prisma,
      10, // Teacher ID
      42  // Course ID
    );

    if (result.success) {
      console.log('✅ Succès:', result.message);
    } else {
      console.log('❌ Échec:', result.message);
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// ============================================================================
// UTILISATION DANS UNE ROUTE EXPRESS
// ============================================================================

export function exempleRouteExpress() {
  console.log('\n=== EXEMPLE: Route Express ===\n');

  const code = `
import { Router } from 'express';
import { StoredProcedures } from '@/shared/stored-procedures';
import { prisma } from '@/lib/prisma';

const router = Router();

// POST /api/sports/enroll
router.post('/enroll', async (req, res) => {
  try {
    const { userId, sportId, gradeId } = req.body;

    const result = await StoredProcedures.addUserSport(prisma, {
      userId,
      sportId,
      initialGradeId: gradeId,
      startDate: new Date(),
      isPrimary: false
    });

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: { userSportId: result.userSportId }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

export default router;
  `;

  console.log(code);
}

// ============================================================================
// FONCTION PRINCIPALE POUR EXÉCUTER TOUS LES EXEMPLES
// ============================================================================

export async function executerTousLesExemples() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  EXEMPLES D\'UTILISATION DES PROCÉDURES STOCKÉES           ║');
  console.log('║  ClubManager - API Backend                                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // await exemple1_inscrireUtilisateurSport();
  // await exemple2_promouvoirGrade();
  // await exemple3_creerCoursRecurrent();
  // await exemple4_inscrireUtilisateurCours();
  // await exemple5_marquerPresence();
  // await exemple6_paiementsEnRetard();
  // await exemple7_inscrireEvenement();
  // await exemple8_statistiquesFrequentation();
  // await exemple9_statistiquesSportives();
  // await exemple10_rapportFinancier();
  // await exemple11_exportRGPD();
  // await exemple12_genererToken();
  // await exemple13_validationEmail();
  // await exemple14_gestionProfesseurs();
  // exempleRouteExpress();

  console.log('\n✅ Exemples disponibles - Décommentez pour exécuter\n');

  await prisma.$disconnect();
}

// Exécuter si appelé directement
if (require.main === module) {
  executerTousLesExemples().catch(console.error);
}
