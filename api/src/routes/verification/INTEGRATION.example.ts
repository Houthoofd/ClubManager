/**
 * EXEMPLE D'INTÉGRATION - Module Vérification GraphQL
 *
 * Ce fichier montre comment intégrer les resolvers et typeDefs de vérification
 * dans votre schéma GraphQL principal.
 *
 * ⚠️ Ce fichier est un EXEMPLE - ne pas l'importer directement
 */

import { createSchema } from "graphql-yoga";
import { prisma } from "../../infrastructure/database/prisma-client.js";

// Importer les resolvers et typeDefs du module vérification
import {
  verificationResolvers,
  verificationTypeDefs
} from "./index.js";

// Importer vos autres resolvers
// import { utilisateursResolvers } from "../services/utilisateurs/utilisateurs.resolvers.js";
// import { alertesResolvers } from "../services/alertes/index.js";
// etc...

/**
 * MÉTHODE 1 : Intégration dans le schéma principal
 * Recommandé pour la plupart des cas
 */
export const schemaExample1 = createSchema({
  typeDefs: [
    // Types de base
    /* GraphQL */ `
      scalar DateTime
      scalar Decimal

      type Query {
        # Health check global
        health: String!
      }

      type Mutation {
        _empty: String
      }
    `,

    // Ajouter les typeDefs de vérification
    verificationTypeDefs,

    // Autres typeDefs...
    // utilisateursTypeDefs,
    // alertesTypeDefs,
  ],

  resolvers: {
    Query: {
      // Health check global
      health: () => "API ClubManager OK",

      // Fusionner les resolvers de vérification
      ...verificationResolvers(prisma).Query,

      // Fusionner vos autres resolvers
      // ...utilisateursResolvers(prisma).Query,
      // ...alertesResolvers(prisma).Query,
    },

    Mutation: {
      // Fusionner les mutations de vérification
      ...verificationResolvers(prisma).Mutation,

      // Fusionner vos autres mutations
      // ...utilisateursResolvers(prisma).Mutation,
      // ...alertesResolvers(prisma).Mutation,
    },
  },
});

/**
 * MÉTHODE 2 : Utilisation des services directement dans vos propres resolvers
 * Utile si vous voulez personnaliser la logique
 */
import {
  verifierEmailUtilisateur,
  verifierPrenomNomUtilisateur,
  verifierUtilisateursSontProfesseurs,
} from "./index.js";

export const customResolversExample = {
  Query: {
    // Exemple : Créer un resolver personnalisé qui utilise le service
    verifierInscription: async (
      _: any,
      { email, prenom, nom }: { email: string; prenom: string; nom: string }
    ) => {
      // Vérifier l'email
      const emailCheck = await verifierEmailUtilisateur(email);

      // Vérifier le prénom et nom
      const prenomNomCheck = await verifierPrenomNomUtilisateur(prenom, nom);

      return {
        emailDisponible: !emailCheck.exists,
        utilisateurExiste: prenomNomCheck.exists,
        peutInscrire: !emailCheck.exists && !prenomNomCheck.exists,
      };
    },
  },
};

/**
 * MÉTHODE 3 : Utilisation dans un contexte middleware
 */
export const createContextExample = async ({ request }: any) => {
  return {
    prisma,

    // Ajouter les services de vérification au contexte
    verification: {
      verifierEmail: verifierEmailUtilisateur,
      verifierPrenomNom: verifierPrenomNomUtilisateur,
      verifierProfesseurs: verifierUtilisateursSontProfesseurs,
      // etc...
    },
  };
};

// Ensuite dans vos resolvers, vous pouvez utiliser :
export const contextResolverExample = {
  Mutation: {
    inscrireUtilisateur: async (_: any, { input }: any, context: any) => {
      // Utiliser le service depuis le contexte
      const emailCheck = await context.verification.verifierEmail(input.email);

      if (emailCheck.exists) {
        throw new Error("Cet email est déjà utilisé");
      }

      // Continuer l'inscription...
      return { success: true };
    },
  },
};

/**
 * EXEMPLE DE QUERIES GRAPHQL
 *
 * Voici des exemples de queries que vous pouvez faire :
 */

/*

# 1. Vérifier un email
query VerifierEmail {
  verifierEmail(email: "test@example.com") {
    exists
    message
  }
}

# 2. Vérifier prénom et nom
query VerifierPrenomNom {
  verifierPrenomNom(input: {
    prenom: "Jean"
    nom: "Dupont"
  }) {
    exists
    message
  }
}

# 3. Vérifier des professeurs
query VerifierProfesseurs {
  verifierProfesseurs(input: {
    utilisateurs: [
      { nom: "Martin", prenom: "Pierre" }
      { nom: "Durand", prenom: "Sophie" }
    ]
  }) {
    professeurs {
      nom
      prenom
      isProf
    }
    message
  }
}

# 4. Health check du service
query VerificationHealth {
  verificationHealth {
    status
    message
    checks {
      database
      verification
    }
  }
}

# 5. Vérifier un cours dans le planning
query VerifierPlanning {
  verifierPlanning(input: {
    jour: "1"
    heure_debut: "10:00"
    heure_fin: "11:00"
    type_cours: "Karaté"
  }) {
    exists
    message
  }
}

# 6. Vérifier un article magasin
query VerifierArticle {
  verifierArticle(nom: "Kimono") {
    exists
    message
  }
}

# 7. Vérifier un article dans une catégorie
query VerifierArticleCategorie {
  verifierArticleCategorie(input: {
    nom: "Kimono"
    categorie_id: 1
  }) {
    exists
    message
  }
}

*/

/**
 * NOTES IMPORTANTES :
 *
 * 1. ✅ Les resolvers sont déjà créés et prêts à l'emploi
 * 2. ✅ Les typeDefs sont compatibles avec extend type Query/Mutation
 * 3. ✅ Tous les resolvers utilisent Prisma pour la base de données
 * 4. ✅ Les services sont exposés si vous voulez les utiliser directement
 * 5. ✅ Les types TypeScript sont exportés pour l'autocomplétion
 *
 * UTILISATION RECOMMANDÉE :
 * - Utilisez verificationResolvers(prisma) dans votre schéma principal
 * - Ajoutez verificationTypeDefs à votre liste de typeDefs
 * - C'est tout ! Les resolvers gèrent automatiquement la logique et les erreurs
 */
