import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';
import bcrypt from 'bcrypt';
import { generateToken } from '../middleware/auth.js';

const prisma = new PrismaClient();

// ==========================================
// HELPERS
// ==========================================

const requireAuth = (context: any) => {
  if (!context.user) {
    throw new GraphQLError('Non authentifié', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
  return context.user;
};

const requireRole = (context: any, allowedRoles: string[]) => {
  const user = requireAuth(context);
  if (!allowedRoles.includes(user.role)) {
    throw new GraphQLError('Permissions insuffisantes', {
      extensions: { code: 'FORBIDDEN' }
    });
  }
  return user;
};

// ==========================================
// RESOLVERS
// ==========================================

export const resolvers = {
  // ==========================================
  // QUERIES
  // ==========================================
  Query: {
    // ========== Utilisateurs ==========
    users: async (_: any, { filter, pagination }: any, context: any) => {
      requireAuth(context);

      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (filter?.statusId) where.statusId = filter.statusId;
      if (filter?.gradeId) where.gradeId = filter.gradeId;
      if (filter?.abonnementId) where.abonnementId = filter.abonnementId;
      if (filter?.actif !== undefined) where.actif = filter.actif;
      if (filter?.search) {
        where.OR = [
          { firstName: { contains: filter.search, mode: 'insensitive' } },
          { lastName: { contains: filter.search, mode: 'insensitive' } },
          { email: { contains: filter.search, mode: 'insensitive' } }
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          include: {
            genre: true,
            status: true,
            grade: true,
            abonnement: true
          }
        }),
        prisma.user.count({ where })
      ]);

      return {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    },

    user: async (_: any, { id }: any, context: any) => {
      requireAuth(context);
      return prisma.user.findUnique({
        where: { id },
        include: {
          genre: true,
          status: true,
          grade: true,
          abonnement: true,
          inscriptions: { include: { cours: true } },
          paiements: { orderBy: { datePaiement: 'desc' }, take: 10 }
        }
      });
    },

    userByEmail: async (_: any, { email }: any, context: any) => {
      requireAuth(context);
      return prisma.user.findUnique({
        where: { email },
        include: {
          genre: true,
          status: true,
          grade: true,
          abonnement: true
        }
      });
    },

    me: async (_: any, __: any, context: any) => {
      const user = requireAuth(context);
      return prisma.user.findUnique({
        where: { id: user.id },
        include: {
          genre: true,
          status: true,
          grade: true,
          abonnement: true,
          inscriptions: { include: { cours: true } },
          notifications: { where: { lu: false }, take: 10 }
        }
      });
    },

    // ========== Cours ==========
    cours: async (_: any, { filter, pagination }: any, context: any) => {
      requireAuth(context);

      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (filter?.typeCours) where.typeCours = filter.typeCours;
      if (filter?.actif !== undefined) where.actif = filter.actif;
      if (filter?.dateDebut || filter?.dateFin) {
        where.dateCours = {};
        if (filter?.dateDebut) where.dateCours.gte = new Date(filter.dateDebut);
        if (filter?.dateFin) where.dateCours.lte = new Date(filter.dateFin);
      }

      const [cours, total] = await Promise.all([
        prisma.cours.findMany({
          where,
          skip,
          take: limit,
          include: {
            inscriptions: { include: { utilisateur: true } }
          },
          orderBy: { dateCours: 'asc' }
        }),
        prisma.cours.count({ where })
      ]);

      return {
        cours,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    },

    coursById: async (_: any, { id }: any, context: any) => {
      requireAuth(context);
      return prisma.cours.findUnique({
        where: { id },
        include: {
          inscriptions: { include: { utilisateur: true } },
          reservations: { include: { utilisateur: true } }
        }
      });
    },

    prochainsCours: async (_: any, { limit = 10 }: any, context: any) => {
      requireAuth(context);
      return prisma.cours.findMany({
        where: {
          dateCours: { gte: new Date() },
          actif: true
        },
        take: limit,
        orderBy: { dateCours: 'asc' },
        include: {
          inscriptions: true
        }
      });
    },

    coursParType: async (_: any, { typeCours }: any, context: any) => {
      requireAuth(context);
      return prisma.cours.findMany({
        where: { typeCours, actif: true },
        orderBy: { dateCours: 'asc' },
        include: { inscriptions: true }
      });
    },

    // ========== Inscriptions ==========
    inscriptions: async (_: any, { utilisateurId, coursId }: any, context: any) => {
      requireAuth(context);
      const where: any = {};
      if (utilisateurId) where.utilisateurId = utilisateurId;
      if (coursId) where.coursId = coursId;

      return prisma.inscription.findMany({
        where,
        include: {
          utilisateur: true,
          cours: true
        },
        orderBy: { dateInscription: 'desc' }
      });
    },

    inscriptionsByUser: async (_: any, { utilisateurId }: any, context: any) => {
      requireAuth(context);
      return prisma.inscription.findMany({
        where: { utilisateurId },
        include: { cours: true },
        orderBy: { dateInscription: 'desc' }
      });
    },

    inscriptionsByCours: async (_: any, { coursId }: any, context: any) => {
      requireAuth(context);
      return prisma.inscription.findMany({
        where: { coursId },
        include: { utilisateur: true },
        orderBy: { dateInscription: 'desc' }
      });
    },

    // ========== Paiements ==========
    paiements: async (_: any, { filter, pagination }: any, context: any) => {
      requireAuth(context);

      const where: any = {};
      if (filter?.utilisateurId) where.utilisateurId = filter.utilisateurId;
      if (filter?.statut) where.statut = filter.statut;
      if (filter?.dateDebut || filter?.dateFin) {
        where.datePaiement = {};
        if (filter?.dateDebut) where.datePaiement.gte = new Date(filter.dateDebut);
        if (filter?.dateFin) where.datePaiement.lte = new Date(filter.dateFin);
      }

      return prisma.paiement.findMany({
        where,
        include: {
          utilisateur: true,
          abonnement: true
        },
        orderBy: { datePaiement: 'desc' }
      });
    },

    paiementsByUser: async (_: any, { utilisateurId }: any, context: any) => {
      requireAuth(context);
      return prisma.paiement.findMany({
        where: { utilisateurId },
        include: { abonnement: true },
        orderBy: { datePaiement: 'desc' }
      });
    },

    echeancesPaiements: async (_: any, { utilisateurId }: any, context: any) => {
      requireAuth(context);
      const where: any = {};
      if (utilisateurId) where.utilisateurId = utilisateurId;

      return prisma.echeancePaiement.findMany({
        where,
        orderBy: { dateEcheance: 'asc' }
      });
    },

    // ========== Boutique ==========
    articles: async (_: any, { actif }: any, context: any) => {
      requireAuth(context);
      const where: any = {};
      if (actif !== undefined) where.actif = actif;

      return prisma.article.findMany({
        where,
        include: {
          taille: true,
          stock: true
        },
        orderBy: { nom: 'asc' }
      });
    },

    article: async (_: any, { id }: any, context: any) => {
      requireAuth(context);
      return prisma.article.findUnique({
        where: { id },
        include: {
          taille: true,
          stock: true
        }
      });
    },

    commandes: async (_: any, { utilisateurId }: any, context: any) => {
      requireAuth(context);
      const where: any = {};
      if (utilisateurId) where.utilisateurId = utilisateurId;

      return prisma.commande.findMany({
        where,
        include: {
          utilisateur: true,
          articles: { include: { article: true } }
        },
        orderBy: { dateCommande: 'desc' }
      });
    },

    commande: async (_: any, { id }: any, context: any) => {
      requireAuth(context);
      return prisma.commande.findUnique({
        where: { id },
        include: {
          utilisateur: true,
          articles: { include: { article: true } }
        }
      });
    },

    // ========== Messages ==========
    messages: async (_: any, { utilisateurId }: any, context: any) => {
      requireAuth(context);
      return prisma.message.findMany({
        where: {
          OR: [
            { expediteurId: utilisateurId },
            { destinataireId: utilisateurId }
          ]
        },
        include: {
          expediteur: true,
          destinataire: true
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    messagesNonLus: async (_: any, { utilisateurId }: any, context: any) => {
      requireAuth(context);
      return prisma.message.findMany({
        where: {
          destinataireId: utilisateurId,
          lu: false
        },
        include: {
          expediteur: true
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    // ========== Notifications ==========
    notifications: async (_: any, { utilisateurId }: any, context: any) => {
      requireAuth(context);
      return prisma.notification.findMany({
        where: { utilisateurId },
        orderBy: { createdAt: 'desc' }
      });
    },

    notificationsNonLues: async (_: any, { utilisateurId }: any, context: any) => {
      requireAuth(context);
      return prisma.notification.findMany({
        where: {
          utilisateurId,
          lu: false
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    // ========== Groupes ==========
    groupes: async (_: any, __: any, context: any) => {
      requireAuth(context);
      return prisma.groupe.findMany({
        where: { actif: true },
        include: {
          membres: { include: { utilisateur: true } }
        }
      });
    },

    groupe: async (_: any, { id }: any, context: any) => {
      requireAuth(context);
      return prisma.groupe.findUnique({
        where: { id },
        include: {
          membres: { include: { utilisateur: true } }
        }
      });
    },

    groupesByUser: async (_: any, { utilisateurId }: any, context: any) => {
      requireAuth(context);
      const groupesUtilisateur = await prisma.groupeUtilisateur.findMany({
        where: { utilisateurId },
        include: { groupe: true }
      });
      return groupesUtilisateur.map(gu => gu.groupe);
    },

    // ========== Alertes ==========
    alertes: async (_: any, { utilisateurId, statut }: any, context: any) => {
      requireAuth(context);
      const where: any = {};
      if (utilisateurId) where.utilisateurId = utilisateurId;
      if (statut) where.statut = statut;

      return prisma.alerteUtilisateur.findMany({
        where,
        include: {
          utilisateur: true,
          alerteType: true,
          actions: true
        },
        orderBy: { dateDetection: 'desc' }
      });
    },

    alerteTypes: async (_: any, __: any, context: any) => {
      requireAuth(context);
      return prisma.alerteType.findMany({
        where: { actif: true }
      });
    },

    // ========== Statistiques ==========
    statistiquesDashboard: async (_: any, __: any, context: any) => {
      requireRole(context, ['administrateur', 'super-administrateur']);

      const [
        totalUtilisateurs,
        utilisateursActifs,
        totalCours,
        coursAVenir,
        paiements,
        paiementsEnAttente
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { actif: true } }),
        prisma.cours.count(),
        prisma.cours.count({
          where: {
            dateCours: { gte: new Date() },
            actif: true
          }
        }),
        prisma.paiement.findMany({
          where: { statut: 'validé' }
        }),
        prisma.paiement.count({ where: { statut: 'en attente' } })
      ]);

      const totalPaiements = paiements.reduce((sum, p) => sum + Number(p.montant), 0);

      // Calcul du taux de présence
      const inscriptions = await prisma.inscription.findMany();
      const tauxPresence = inscriptions.length > 0
        ? (inscriptions.filter(i => i.present).length / inscriptions.length) * 100
        : 0;

      // Revenu mensuel (30 derniers jours)
      const dateDebut = new Date();
      dateDebut.setDate(dateDebut.getDate() - 30);
      const paiementsMensuels = await prisma.paiement.findMany({
        where: {
          datePaiement: { gte: dateDebut },
          statut: 'validé'
        }
      });
      const revenuMensuel = paiementsMensuels.reduce((sum, p) => sum + Number(p.montant), 0);

      return {
        totalUtilisateurs,
        utilisateursActifs,
        totalCours,
        coursAVenir,
        totalPaiements,
        paiementsEnAttente,
        tauxPresence,
        revenuMensuel
      };
    },

    statistiquesUtilisateur: async (_: any, { utilisateurId }: any, context: any) => {
      requireAuth(context);

      const inscriptions = await prisma.inscription.findMany({
        where: { utilisateurId },
        include: { cours: true }
      });

      const nombreCoursAssistes = inscriptions.filter(i => i.present).length;
      const tauxPresence = inscriptions.length > 0
        ? (nombreCoursAssistes / inscriptions.length) * 100
        : 0;

      const coursAvecDates = inscriptions.map(i => i.cours).sort((a, b) =>
        b.dateCours.getTime() - a.dateCours.getTime()
      );
      const dernierCours = coursAvecDates[0]?.dateCours;

      const paiements = await prisma.paiement.findMany({
        where: {
          utilisateurId,
          statut: 'validé'
        }
      });
      const montantTotalPaye = paiements.reduce((sum, p) => sum + Number(p.montant), 0);

      const prochainPaiement = await prisma.echeancePaiement.findFirst({
        where: {
          utilisateurId,
          statut: 'en attente',
          dateEcheance: { gte: new Date() }
        },
        orderBy: { dateEcheance: 'asc' }
      });

      return {
        utilisateurId,
        nombreCoursAssistes,
        tauxPresence,
        dernierCours,
        prochainPaiement: prochainPaiement?.dateEcheance,
        montantTotalPaye
      };
    },

    // ========== Références ==========
    genres: () => prisma.genre.findMany(),
    statuses: () => prisma.status.findMany(),
    grades: () => prisma.grade.findMany({ orderBy: { ordre: 'asc' } }),
    plansTarifaires: () => prisma.planTarifaire.findMany({ where: { actif: true } })
  },

  // ==========================================
  // MUTATIONS
  // ==========================================
  Mutation: {
    // ========== Authentication ==========
    login: async (_: any, { email, password }: any) => {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { status: true }
      });

      if (!user || !user.password) {
        throw new GraphQLError('Identifiants invalides', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        throw new GraphQLError('Identifiants invalides', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        status_id: user.statusId,
        role: user.status.nomRole
      });

      return { token, user };
    },

    register: async (_: any, { input }: any) => {
      // Vérifier si l'email existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email }
      });

      if (existingUser) {
        throw new GraphQLError('Un compte avec cet email existe déjà', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      // Hash du mot de passe
      const hashedPassword = await bcrypt.hash(input.password, 10);

      const user = await prisma.user.create({
        data: {
          ...input,
          password: hashedPassword,
          statusId: input.statusId || 1
        },
        include: { status: true }
      });

      const token = generateToken({
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        status_id: user.statusId,
        role: user.status.nomRole
      });

      return { token, user };
    },

    // ========== Utilisateurs ==========
    createUser: async (_: any, { input }: any, context: any) => {
      requireRole(context, ['administrateur', 'super-administrateur']);

      const hashedPassword = input.password
        ? await bcrypt.hash(input.password, 10)
        : undefined;

      return prisma.user.create({
        data: {
          ...input,
          password: hashedPassword
        },
        include: {
          genre: true,
          status: true,
          grade: true,
          abonnement: true
        }
      });
    },

    updateUser: async (_: any, { id, input }: any, context: any) => {
      requireAuth(context);

      const data: any = { ...input };
      if (input.password) {
        data.password = await bcrypt.hash(input.password, 10);
      }

      return prisma.user.update({
        where: { id },
        data,
        include: {
          genre: true,
          status: true,
          grade: true,
          abonnement: true
        }
      });
    },

    deleteUser: async (_: any, { id }: any, context: any) => {
      requireRole(context, ['super-administrateur']);
      await prisma.user.delete({ where: { id } });
      return { success: true, message: 'Utilisateur supprimé avec succès' };
    },

    activateUser: async (_: any, { id }: any, context: any) => {
      requireRole(context, ['administrateur', 'super-administrateur']);
      const user = await prisma.user.update({
        where: { id },
        data: { actif: true }
      });
      return user;
    },

    deactivateUser: async (_: any, { id }: any, context: any) => {
      requireRole(context, ['administrateur', 'super-administrateur']);
      const user = await prisma.user.update({
        where: { id },
        data: { actif: false }
      });
      return user;
    },

    // ========== Cours ==========
    createCours: async (_: any, { input }: any, context: any) => {
      requireRole(context, ['administrateur', 'super-administrateur']);
      return prisma.cours.create({
        data: input,
        include: { inscriptions: true }
      });
    },

    updateCours: async (_: any, { id, input }: any, context: any) => {
      requireRole(context, ['administrateur', 'super-administrateur']);
      return prisma.cours.update({
        where: { id },
        data: input,
        include: { inscriptions: true }
      });
    },

    deleteCours: async (_: any, { id }: any, context: any) => {
      requireRole(context, ['super-administrateur']);
      await prisma.cours.delete({ where: { id } });
      return { success: true, message: 'Cours supprimé avec succès' };
    },

    // ========== Inscriptions ==========
    inscrireUtilisateur: async (_: any, { input }: any, context: any) => {
      requireAuth(context);

      // Vérifier si l'inscription existe déjà
      const existing = await prisma.inscription.findUnique({
        where: {
          utilisateurId_coursId: {
            utilisateurId: input.utilisateurId,
            coursId: input.coursId
          }
        }
      });

      if (existing) {
        throw new GraphQLError('Utilisateur déjà inscrit à ce cours', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      return prisma.inscription.create({
        data: input,
        include: {
          utilisateur: true,
          cours: true
        }
      });
    },

    desinscrireUtilisateur: async (_: any, { id }: any, context: any) => {
      requireAuth(context);
      await prisma.inscription.delete({ where: { id } });
      return { success: true, message: 'Désinscription réussie' };
    },

    marquerPresence: async (_: any, { id, present }: any, context: any) => {
      requireRole(context, ['administrateur', 'super-administrateur']);
      return prisma.inscription.update({
        where: { id },
        data: { present },
        include: {
          utilisateur: true,
          cours: true
        }
      });
    },

    // ========== Paiements ==========
    createPaiement: async (_: any, { input }: any, context: any) => {
      requireAuth(context);
      return prisma.paiement.create({
        data: {
          ...input,
          datePaiement: new Date()
        },
        include: {
          utilisateur: true,
          abonnement: true
        }
      });
    },

    validerPaiement: async (_: any, { id }: any, context: any) => {
      requireRole(context, ['administrateur', 'super-administrateur']);
      return prisma.paiement.update({
        where: { id },
        data: { statut: 'validé' },
        include: {
          utilisateur: true,
          abonnement: true
        }
      });
    },

    annulerPaiement: async (_: any, { id }: any, context: any) => {
      requireRole(context, ['administrateur', 'super-administrateur']);
      return prisma.paiement.update({
        where: { id },
        data: { statut: 'échec' },
        include: {
          utilisateur: true,
          abonnement: true
        }
      });
    },

    // ========== Boutique ==========
    createArticle: async (_: any, { input }: any, context: any) => {
      requireRole(context, ['administrateur', 'super-administrateur']);
      return prisma.article.create({
        data: input,
        include: { taille: true, stock: true }
      });
    },

    updateArticle: async (_: any, { id, input }: any, context: any) => {
      requireRole(context, ['administrateur', 'super-administrateur']);
      return prisma.article.update({
        where: { id },
        data: input,
        include: { taille: true, stock: true }
      });
    },

    deleteArticle: async (_: any, { id }: any, context: any) => {
      requireRole(context, ['super-administrateur']);
      await prisma.article.delete({ where: { id } });
      return { success: true, message: 'Article supprimé avec succès' };
    },

    updateStock: async (_: any, { articleId, quantite }: any, context: any) => {
      requireRole(context, ['administrateur', 'super-administrateur']);

      const stock = await prisma.stock.findUnique({
        where: { articleId }
      });

      if (stock) {
        return prisma.stock.update({
          where: { articleId },
          data: { quantite },
          include: { article: true }
        });
      } else {
        return prisma.stock.create({
          data: { articleId, quantite },
          include: { article: true }
        });
      }
    },

    createCommande: async (_: any, { input }: any, context: any) => {
      requireAuth(context);

      // Calculer le montant total
      let montantTotal = 0;
      for (const item of input.articles) {
        const article = await prisma.article.findUnique({
          where: { id: item.articleId }
        });
        if (article) {
          montantTotal += Number(article.prix) * item.quantite;
        }
      }

      // Créer la commande
      const commande = await prisma.commande.create({
        data: {
          utilisateurId: input.utilisateurId,
          montantTotal,
          adresseLivraison: input.adresseLivraison,
          notes: input.notes,
          articles: {
            create: await Promise.all(
              input.articles.map(async (item: any) => {
                const article = await prisma.article.findUnique({
                  where: { id: item.articleId }
                });
                return {
                  articleId: item.articleId,
                  quantite: item.quantite,
                  prixUnitaire: article?.prix || 0
                };
              })
            )
          }
        },
        include: {
          utilisateur: true,
          articles: { include: { article: true } }
        }
      });

      return commande;
    },

    updateStatutCommande: async (_: any, { id, statut }: any, context: any) => {
      requireRole(context, ['administrateur', 'super-administrateur']);
      return prisma.commande.update({
        where: { id },
        data: { statut },
        include: {
          utilisateur: true,
          articles: { include: { article: true } }
        }
      });
    },

    // ========== Messages ==========
    sendMessage: async (_: any, { input }: any, context: any) => {
      requireAuth(context);
      return prisma.message.create({
        data: input,
        include: {
          expediteur: true,
          destinataire: true
        }
      });
    },

    markMessageAsRead: async (_: any, { id }: any, context: any) => {
      requireAuth(context);
      return prisma.message.update({
        where: { id },
        data: { lu: true },
        include: {
          expediteur: true,
          destinataire: true
        }
      });
    },

    deleteMessage: async (_: any, { id }: any, context: any) => {
      requireAuth(context);
      await prisma.message.delete({ where: { id } });
      return { success: true, message: 'Message supprimé' };
    },

    // ========== Notifications ==========
    createNotification: async (_: any, { input }: any, context: any) => {
      requireRole(context, ['administrateur', 'super-administrateur']);
      return prisma.notification.create({
        data: input,
        include: { utilisateur: true }
      });
    },

    markNotificationAsRead: async (_: any, { id }: any, context: any) => {
      requireAuth(context);
      return prisma.notification.update({
        where: { id },
        data: { lu: true },
        include: { utilisateur: true }
      });
    },

    markAllNotificationsAsRead: async (_: any, { utilisateurId }: any, context: any) => {
      requireAuth(context);
      await prisma.notification.updateMany({
        where: { utilisateurId, lu: false },
        data: { lu: true }
      });
      return { success: true, message: 'Toutes les notifications marquées comme lues' };
    },

    // ========== Groupes ==========
    createGroupe: async (_: any, { nom, description }: any, context: any) => {
      requireRole(context, ['administrateur', 'super-administrateur']);
      return prisma.groupe.create({
        data: { nom, description },
        include: { membres: true }
      });
    },

    addUserToGroupe: async (_: any, { groupeId, utilisateurId, role }: any, context: any) => {
      requireRole(context, ['administrateur', 'super-administrateur']);
      return prisma.groupeUtilisateur.create({
        data: { groupeId, utilisateurId, role },
        include: {
          groupe: true,
          utilisateur: true
        }
      });
    },

    removeUserFromGroupe: async (_: any, { id }: any, context: any) => {
      requireRole(context, ['administrateur', 'super-administrateur']);
      await prisma.groupeUtilisateur.delete({ where: { id } });
      return { success: true, message: 'Utilisateur retiré du groupe' };
    },

    // ========== Alertes ==========
    resoudreAlerte: async (_: any, { id, notes }: any, context: any) => {
      requireRole(context, ['administrateur', 'super-administrateur']);
      return prisma.alerteUtilisateur.update({
        where: { id },
        data: {
          statut: 'resolue',
          dateResolution: new Date(),
          notes
        },
        include: {
          utilisateur: true,
          alerteType: true,
          actions: true
        }
      });
    },

    ignorerAlerte: async (_: any, { id }: any, context: any) => {
      requireRole(context, ['administrateur', 'super-administrateur']);
      return prisma.alerteUtilisateur.update({
        where: { id },
        data: { statut: 'ignoree' },
        include: {
          utilisateur: true,
          alerteType: true,
          actions: true
        }
      });
    }
  },

  // ==========================================
  // FIELD RESOLVERS
  // ==========================================
  User: {
    fullName: (parent: any) => `${parent.firstName} ${parent.lastName}`,
    nombreInscriptions: async (parent: any) => {
      return prisma.inscription.count({
        where: { utilisateurId: parent.id }
      });
    },
    dernierPaiement: async (parent: any) => {
      return prisma.paiement.findFirst({
        where: { utilisateurId: parent.id },
        orderBy: { datePaiement: 'desc' }
      });
    },
    prochainCours: async (parent: any) => {
      const inscription = await prisma.inscription.findFirst({
        where: {
          utilisateurId: parent.id,
          cours: {
            dateCours: { gte: new Date() }
          }
        },
        include: { cours: true },
        orderBy: { cours: { dateCours: 'asc' } }
      });
      return inscription?.cours;
    }
  },

  Cours: {
    nombreInscrits: async (parent: any) => {
      return prisma.inscription.count({
        where: { coursId: parent.id }
      });
    },
    placesDisponibles: async (parent: any) => {
      if (!parent.capaciteMax) return null;
      const inscrits = await prisma.inscription.count({
        where: { coursId: parent.id }
      });
      return parent.capaciteMax - inscrits;
    },
    estComplet: async (parent: any) => {
      if (!parent.capaciteMax) return false;
      const inscrits = await prisma.inscription.count({
        where: { coursId: parent.id }
      });
      return inscrits >= parent.capaciteMax;
    }
  },

  Article: {
    stockDisponible: async (parent: any) => {
      const stock = await prisma.stock.findUnique({
        where: { articleId: parent.id }
      });
      return stock?.quantite || 0;
    },
    enRupture: async (parent: any) => {
      const stock = await prisma.stock.findUnique({
        where: { articleId: parent.id }
      });
      return !stock || stock.quantite <= 0;
    }
  },

  Commande: {
    nombreArticles: async (parent: any) => {
      return prisma.commandeArticle.count({
        where: { commandeId: parent.id }
      });
    }
  },

  CommandeArticle: {
    sousTotal: (parent: any) => {
      return Number(parent.prixUnitaire) * parent.quantite;
    }
  },

  Groupe: {
    nombreMembres: async (parent: any) => {
      return prisma.groupeUtilisateur.count({
        where: { groupeId: parent.id }
      });
    }
  }
};
