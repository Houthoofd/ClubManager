/**
 * Service Vérification - Logique métier
 * Gère les opérations de vérification d'existence
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Vérifier l'existence d'un utilisateur par email
 */
export async function verifierEmailUtilisateur(email: string): Promise<{
  exists: boolean;
  message: string;
}> {
  console.log(`📧 [Service Vérification] Vérification email: ${email}`);

  try {
    const utilisateur = await prisma.utilisateurs.findFirst({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, active: true },
    });

    const exists = !!utilisateur;

    console.log(
      `${exists ? "✅" : "ℹ️"} [Service Vérification] Email ${exists ? "trouvé" : "disponible"}`,
    );

    return {
      exists,
      message: exists ? "Email déjà utilisé." : "Email disponible.",
    };
  } catch (error) {
    console.error(
      `❌ [Service Vérification] Erreur vérification email:`,
      error,
    );
    throw error;
  }
}

/**
 * Vérifier l'existence d'un utilisateur par nom d'utilisateur
 */
export async function verifierNomUtilisateur(nom_utilisateur: string): Promise<{
  exists: boolean;
  message: string;
}> {
  console.log(
    `👤 [Service Vérification] Vérification nom d'utilisateur: ${nom_utilisateur}`,
  );

  try {
    const utilisateur = await prisma.utilisateurs.findFirst({
      where: { userId: nom_utilisateur },
      select: { id: true },
    });

    const exists = !!utilisateur;

    console.log(
      `${exists ? "✅" : "ℹ️"} [Service Vérification] Nom d'utilisateur ${exists ? "trouvé" : "disponible"}`,
    );

    return {
      exists,
      message: exists
        ? "Nom d'utilisateur déjà utilisé."
        : "Nom d'utilisateur disponible.",
    };
  } catch (error) {
    console.error(
      `❌ [Service Vérification] Erreur vérification nom d'utilisateur:`,
      error,
    );
    throw error;
  }
}

/**
 * Vérifier l'existence d'un utilisateur par prénom
 */
export async function verifierPrenomUtilisateur(prenom: string): Promise<{
  exists: boolean;
  message: string;
}> {
  console.log(`👤 [Service Vérification] Vérification prénom: ${prenom}`);

  try {
    const utilisateur = await prisma.utilisateurs.findFirst({
      where: { first_name: prenom },
      select: { id: true },
    });

    const exists = !!utilisateur;

    console.log(
      `${exists ? "✅" : "ℹ️"} [Service Vérification] Prénom ${exists ? "trouvé" : "disponible"}`,
    );

    return {
      exists,
      message: exists ? "Prénom trouvé." : "Prénom non trouvé.",
    };
  } catch (error) {
    console.error(
      `❌ [Service Vérification] Erreur vérification prénom:`,
      error,
    );
    throw error;
  }
}

/**
 * Vérifier l'existence d'un utilisateur par nom
 */
export async function verifierNomUtilisateurComplet(nom: string): Promise<{
  exists: boolean;
  message: string;
}> {
  console.log(`👤 [Service Vérification] Vérification nom: ${nom}`);

  try {
    const utilisateur = await prisma.utilisateurs.findFirst({
      where: { last_name: nom },
      select: { id: true },
    });

    const exists = !!utilisateur;

    console.log(
      `${exists ? "✅" : "ℹ️"} [Service Vérification] Nom ${exists ? "trouvé" : "disponible"}`,
    );

    return {
      exists,
      message: exists ? "Nom trouvé." : "Nom non trouvé.",
    };
  } catch (error) {
    console.error(`❌ [Service Vérification] Erreur vérification nom:`, error);
    throw error;
  }
}

/**
 * Vérifier l'existence d'un utilisateur par prénom et nom
 */
export async function verifierPrenomNomUtilisateur(
  prenom: string,
  nom: string,
): Promise<{
  exists: boolean;
  message: string;
}> {
  console.log(
    `👤 [Service Vérification] Vérification prénom et nom: ${prenom} ${nom}`,
  );

  try {
    const utilisateur = await prisma.utilisateurs.findFirst({
      where: {
        first_name: prenom,
        last_name: nom,
      },
      select: { id: true },
    });

    const exists = !!utilisateur;

    console.log(
      `${exists ? "✅" : "ℹ️"} [Service Vérification] Prénom et nom ${exists ? "trouvés" : "non trouvés"}`,
    );

    return {
      exists,
      message: exists
        ? "Utilisateur avec ce prénom et nom trouvé."
        : "Aucun utilisateur avec ce prénom et nom.",
    };
  } catch (error) {
    console.error(
      `❌ [Service Vérification] Erreur vérification prénom et nom:`,
      error,
    );
    throw error;
  }
}

/**
 * Vérifier l'existence d'un utilisateur par email, prénom et nom
 */
export async function verifierEmailPrenomNomUtilisateur(
  email: string,
  prenom: string,
  nom: string,
): Promise<{
  exists: boolean;
  message: string;
}> {
  console.log(
    `👤 [Service Vérification] Vérification email, prénom et nom: ${email}, ${prenom} ${nom}`,
  );

  try {
    const utilisateur = await prisma.utilisateurs.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        first_name: prenom,
        last_name: nom,
      },
      select: { id: true },
    });

    const exists = !!utilisateur;

    console.log(
      `${exists ? "✅" : "ℹ️"} [Service Vérification] Email, prénom et nom ${exists ? "trouvés" : "non trouvés"}`,
    );

    return {
      exists,
      message: exists
        ? "Utilisateur avec ces informations trouvé."
        : "Aucun utilisateur avec ces informations.",
    };
  } catch (error) {
    console.error(
      `❌ [Service Vérification] Erreur vérification email, prénom et nom:`,
      error,
    );
    throw error;
  }
}

/**
 * Vérifier un cours dans le planning
 */
export async function verifierCoursPlanning(
  jour: string,
  heure_debut: string,
  heure_fin: string,
  type_cours: string,
): Promise<{
  exists: boolean;
  message: string;
}> {
  console.log(
    `📅 [Service Vérification] Vérification cours planning: ${jour} ${heure_debut}-${heure_fin} (${type_cours})`,
  );

  try {
    const cours = await prisma.cours_recurrent.findFirst({
      where: {
        jour_semaine: parseInt(jour), // Convertir le jour en nombre (1-7)
        type_cours: type_cours,
      },
      select: { id: true },
    });

    const exists = !!cours;

    console.log(
      `${exists ? "✅" : "ℹ️"} [Service Vérification] Cours ${exists ? "trouvé" : "créneau disponible"}`,
    );

    return {
      exists,
      message: exists
        ? "Un cours existe déjà à ce créneau."
        : "Créneau disponible dans le planning.",
    };
  } catch (error) {
    console.error(
      `❌ [Service Vérification] Erreur vérification cours planning:`,
      error,
    );
    throw error;
  }
}

/**
 * Vérifier un article du magasin par nom
 */
export async function verifierArticleParNom(nom: string): Promise<{
  exists: boolean;
  message: string;
}> {
  console.log(`🛒 [Service Vérification] Vérification article: ${nom}`);

  try {
    const article = await prisma.articles.findFirst({
      where: { nom: nom },
      select: { id: true },
    });

    const exists = !!article;

    console.log(
      `${exists ? "✅" : "ℹ️"} [Service Vérification] Article ${exists ? "trouvé" : "non trouvé"}`,
    );

    return {
      exists,
      message: exists
        ? "Article trouvé dans le magasin."
        : "Article non trouvé.",
    };
  } catch (error) {
    console.error(
      `❌ [Service Vérification] Erreur vérification article:`,
      error,
    );
    throw error;
  }
}

/**
 * Vérifier un article du magasin par nom et catégorie
 */
export async function verifierArticleParNomEtCategorie(
  nom: string,
  categorie_id: number,
): Promise<{
  exists: boolean;
  message: string;
}> {
  console.log(
    `🛒 [Service Vérification] Vérification article: ${nom} (catégorie ${categorie_id})`,
  );

  try {
    const article = await prisma.articles.findFirst({
      where: {
        nom: nom,
        categorie_id: categorie_id,
      },
      select: { id: true },
    });

    const exists = !!article;

    console.log(
      `${exists ? "✅" : "ℹ️"} [Service Vérification] Article ${exists ? "trouvé" : "non trouvé"} dans la catégorie`,
    );

    return {
      exists,
      message: exists
        ? "Article trouvé dans cette catégorie."
        : "Article non trouvé dans cette catégorie.",
    };
  } catch (error) {
    console.error(
      `❌ [Service Vérification] Erreur vérification article par catégorie:`,
      error,
    );
    throw error;
  }
}

/**
 * Vérifier si des utilisateurs sont professeurs
 */
export async function verifierUtilisateursSontProfesseurs(
  utilisateurs: Array<{ nom: string; prenom: string }>,
): Promise<{
  professeurs: Array<{ nom: string; prenom: string; isProf: boolean }>;
  message: string;
}> {
  console.log(
    `👨‍🏫 [Service Vérification] Vérification professeurs (${utilisateurs.length} utilisateurs)`,
  );

  try {
    const resultats = await Promise.all(
      utilisateurs.map(async (user) => {
        const professeur = await prisma.professeurs.findFirst({
          where: {
            prenom: user.prenom,
            nom: user.nom,
          },
          select: { id: true },
        });

        return {
          nom: user.nom,
          prenom: user.prenom,
          isProf: !!professeur,
        };
      }),
    );

    const nbProfesseurs = resultats.filter((r) => r.isProf).length;

    console.log(
      `✅ [Service Vérification] ${nbProfesseurs}/${utilisateurs.length} sont professeurs`,
    );

    return {
      professeurs: resultats,
      message: `${nbProfesseurs} professeur(s) trouvé(s) sur ${utilisateurs.length} utilisateur(s).`,
    };
  } catch (error) {
    console.error(
      `❌ [Service Vérification] Erreur vérification professeurs:`,
      error,
    );
    throw error;
  }
}

/**
 * Health check du service de vérification
 */
export async function verifierSanteService(): Promise<{
  status: "healthy" | "degraded" | "unhealthy";
  checks: {
    database: boolean;
    verification: boolean;
  };
  message: string;
}> {
  console.log(`🏥 [Service Vérification] Vérification de santé`);

  const checks = {
    database: false,
    verification: false,
  };

  try {
    // Test simple : compter les utilisateurs
    await prisma.utilisateurs.count();
    checks.database = true;
    checks.verification = true;

    console.log(`✅ [Service Vérification] Services opérationnels`);

    return {
      status: "healthy",
      checks,
      message: "Service de vérification opérationnel",
    };
  } catch (error) {
    console.error(
      `❌ [Service Vérification] Erreur vérification santé:`,
      error,
    );

    return {
      status: "unhealthy",
      checks,
      message: "Service de vérification non opérationnel",
    };
  }
}
