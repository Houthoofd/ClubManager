# Module GraphQL Statistiques

Module de gestion des statistiques et tableaux de bord pour le ClubManager.

## 📊 Vue d'ensemble

Ce module fournit une API GraphQL complète pour accéder à toutes les statistiques du club :
- Statistiques générales (membres, cours, inscriptions, professeurs)
- Statistiques de présence et fréquentation
- Statistiques de paiements
- Statistiques de membres (grades, genres, plans)
- Tableaux de bord consolidés

## 📁 Structure

```
statistiques/
├── statistiques.typeDefs.ts   # Schéma GraphQL (446 lignes)
├── statistiques.resolvers.ts  # Resolvers (541 lignes)
├── index.ts                   # Point d'entrée
└── README.md                  # Cette documentation
```

## 🎯 Fonctionnalités

### Statistiques Générales
- Nombre total d'utilisateurs actifs
- Cours à venir
- Total des inscriptions
- Nombre de professeurs

### Statistiques de Cours
- Statistiques par type de cours
- Taux de présence
- Évolution des inscriptions
- Planning de la semaine

### Statistiques de Présence
- Présences par mois (par utilisateur)
- Présences non validées
- Top des membres les plus assidus
- Progression des utilisateurs

### Statistiques de Paiements
- Total des paiements du mois
- Paiements récents (7 derniers jours)
- Paiements en attente
- Paiements échus (en retard)
- Taux de renouvellement
- Historique par mois (12 derniers mois)

### Statistiques de Membres
- Nombre total de membres
- Nouveaux membres (30 derniers jours)
- Répartition par grade
- Répartition par genre
- Répartition par plan tarifaire
- Prochains anniversaires

### Statistiques Magasin
- Articles les plus vendus
- Revenus par article

### Dashboards Consolidés
- Dashboard global (toutes métriques principales)
- Statistiques paiements consolidées
- Statistiques membres consolidées
- Statistiques cours consolidées

## 📝 Types GraphQL

### Types Principaux

```graphql
type StatistiquesGenerales {
  total_utilisateurs: Int!
  cours_a_venir: Int!
  total_inscriptions: Int!
  total_professeurs: Int!
}

type StatistiquesParCours {
  type_cours: String!
  nombre_inscriptions: Int!
  taux_presence: Float!
}

type StatistiquesPresence {
  date_cours: String!
  type_cours: String!
  total_inscrits: Int!
  presents: Int!
  taux_presence_pct: Float!
}

type DashboardGlobal {
  nombreMembres: Int!
  totalPaiementsMois: Float!
  paiementsRecents: Int!
  paiementsEnAttente: Int!
  plansActifs: Int!
  tauxRenouvellement: Float!
  statistiquesGenerales: StatistiquesGenerales!
}
```

## 🔍 Queries Disponibles

### Queries Simples (Métriques)

```graphql
# Nombre de membres
nombreMembres: Int!

# Total des paiements du mois
totalPaiementsMois: Float!

# Paiements récents (7 derniers jours)
paiementsRecents: Int!

# Paiements en attente
paiementsEnAttente: Int!

# Plans tarifaires actifs
plansActifs: Int!

# Taux de renouvellement
tauxRenouvellement: Float!
```

### Queries Complexes (Listes et Détails)

```graphql
# Statistiques générales du club
statistiquesGenerales: StatistiquesGenerales!

# Statistiques par type de cours
statistiquesParCours: [StatistiquesParCours!]!

# Statistiques de présence (30 derniers jours)
statistiquesPresence: [StatistiquesPresence!]!

# Fréquentation d'un utilisateur
statistiquesFrequentation(utilisateur_id: Int!): [StatistiquesFrequentation!]!

# Progression d'un utilisateur
progressionUtilisateur(utilisateur_id: Int!): ProgressionUtilisateur!

# Présences par mois (utilisateur)
presenceParMois(utilisateur_id: Int!): [PresenceParMois!]!

# Paiements par mois (12 derniers)
paiementsParMois: [PaiementsParMois!]!

# Membres par plan tarifaire
membresParPlan: [MembresParPlan!]!

# Derniers paiements
derniersPaiements(limite: Int = 10): [DernierPaiement!]!

# Paiements échus
paiementsEchus: [PaiementEchu!]!

# Nouveaux membres (30 derniers jours)
nouveauxMembres: [NouveauMembre!]!

# Top membres assidus
topMembresAssidus(limite: Int = 10): [MembreAssidu!]!

# Membres par grade
membresParGrade: [MembresParGrade!]!

# Membres par genre
membresParGenre: [MembresParGenre!]!

# Prochains anniversaires (30 jours)
prochainsAnniversaires: [ProchainsAnniversaires!]!

# Articles les plus vendus
articlesPlusVendus(limite: Int = 10): [ArticlePlusVendu!]!

# Cours de la semaine
coursSemaine: [CoursSemaine!]!

# Évolution des inscriptions
evolutionInscriptions: [EvolutionInscriptions!]!
```

### Queries Consolidées (Dashboards)

```graphql
# Dashboard global
dashboardGlobal: DashboardGlobal!

# Statistiques paiements consolidées
statistiquesPaiementsConsolidees: StatistiquesPaiementsConsolidees!

# Statistiques membres consolidées
statistiquesMembresConsolidees: StatistiquesMembresConsolidees!

# Statistiques cours consolidées
statistiquesCoursConsolidees: StatistiquesCoursConsolidees!
```

## 💡 Exemples d'Utilisation

### Exemple 1: Dashboard Global

```graphql
query {
  dashboardGlobal {
    nombreMembres
    totalPaiementsMois
    paiementsRecents
    paiementsEnAttente
    plansActifs
    tauxRenouvellement
    statistiquesGenerales {
      total_utilisateurs
      cours_a_venir
      total_inscriptions
      total_professeurs
    }
  }
}
```

**Réponse:**
```json
{
  "data": {
    "dashboardGlobal": {
      "nombreMembres": 150,
      "totalPaiementsMois": 4500.00,
      "paiementsRecents": 12,
      "paiementsEnAttente": 5,
      "plansActifs": 4,
      "tauxRenouvellement": 85.5,
      "statistiquesGenerales": {
        "total_utilisateurs": 150,
        "cours_a_venir": 24,
        "total_inscriptions": 320,
        "total_professeurs": 8
      }
    }
  }
}
```

### Exemple 2: Statistiques de Présence

```graphql
query {
  statistiquesPresence {
    date_cours
    type_cours
    total_inscrits
    presents
    taux_presence_pct
  }
}
```

**Réponse:**
```json
{
  "data": {
    "statistiquesPresence": [
      {
        "date_cours": "2024-01-15",
        "type_cours": "Karaté Avancé",
        "total_inscrits": 20,
        "presents": 18,
        "taux_presence_pct": 90.0
      },
      {
        "date_cours": "2024-01-14",
        "type_cours": "Karaté Débutant",
        "total_inscrits": 15,
        "presents": 12,
        "taux_presence_pct": 80.0
      }
    ]
  }
}
```

### Exemple 3: Progression d'un Utilisateur

```graphql
query {
  progressionUtilisateur(utilisateur_id: 1) {
    utilisateur_id
    niveauActuel
    coursSuivis {
      cours_id
      type_cours
      date_cours
      status
    }
    progressionParCours {
      type_cours
      nombre_cours
      presents
      absents
      taux_presence
    }
  }
}
```

### Exemple 4: Top Membres Assidus

```graphql
query {
  topMembresAssidus(limite: 5) {
    utilisateur_id
    nom
    prenom
    nombre_presences
    taux_presence
  }
}
```

### Exemple 5: Statistiques Paiements Consolidées

```graphql
query {
  statistiquesPaiementsConsolidees {
    totalPaiementsMois
    paiementsRecents
    paiementsEnAttente
    tauxRenouvellement
    paiementsParMois {
      mois
      annee
      total
      nombre_paiements
    }
    derniersPaiements {
      id
      montant
      date_paiement
      statut
      nom_utilisateur
      prenom_utilisateur
    }
    paiementsEchus {
      utilisateur_id
      nom
      prenom
      montant
      date_echeance
      jours_retard
    }
  }
}
```

### Exemple 6: Statistiques par Type de Cours

```graphql
query {
  statistiquesParCours {
    type_cours
    nombre_inscriptions
    taux_presence
  }
}
```

### Exemple 7: Nouveaux Membres

```graphql
query {
  nouveauxMembres {
    id
    nom
    prenom
    email
    date_inscription
    jours_depuis_inscription
  }
}
```

### Exemple 8: Articles Plus Vendus

```graphql
query {
  articlesPlusVendus(limite: 5) {
    article_id
    nom_article
    nombre_ventes
    total_quantite
    total_revenus
  }
}
```

## 🎨 Use Cases

### Dashboard Admin Principal
Utiliser `dashboardGlobal` pour afficher toutes les métriques clés en une seule requête.

### Page de Statistiques de Paiements
Utiliser `statistiquesPaiementsConsolidees` pour obtenir toutes les données de paiements.

### Page de Profil Utilisateur
Utiliser `progressionUtilisateur` et `statistiquesFrequentation` pour afficher la progression.

### Page de Gestion des Cours
Utiliser `statistiquesParCours` et `statistiquesPresence` pour le suivi des cours.

### Page des Membres
Utiliser `statistiquesMembresConsolidees` pour la vue d'ensemble des membres.

### Alertes et Notifications
Utiliser `paiementsEchus` et `paiementsEnAttente` pour envoyer des rappels.

## 🔧 Intégration

### Import

```typescript
import { statistiquesTypeDefs } from './statistiques/index.js';
import { statistiquesResolvers } from './statistiques/index.js';
```

### Ajout au serveur GraphQL

```typescript
// Dans typeDefs.ts
export const typeDefs = [
  baseTypeDefs,
  statistiquesTypeDefs,
  // ... autres modules
];

// Dans resolvers.ts
export const resolvers = mergeResolvers([
  baseResolvers,
  statistiquesResolvers,
  // ... autres modules
]);
```

## 📊 Performance

### Optimisations

- Les queries consolidées (dashboards) utilisent `Promise.all()` pour paralléliser les requêtes
- Les calculs (taux de présence, pourcentages) sont effectués côté serveur
- Les limites par défaut sont définies pour éviter les requêtes trop volumineuses

### Recommandations

- Utiliser les queries consolidées pour réduire le nombre de requêtes
- Ajouter du caching pour les statistiques peu changeantes (membres par grade, etc.)
- Implémenter DataLoader si nécessaire pour éviter N+1

## 🔒 Sécurité

### À implémenter (recommandé)

```typescript
// Exemple de guard pour admin seulement
const requireAdmin = (resolver) => {
  return (parent, args, context, info) => {
    if (!context.user || context.user.role !== 'admin') {
      throw new Error('Accès refusé - Admin requis');
    }
    return resolver(parent, args, context, info);
  };
};

// Utilisation
dashboardGlobal: requireAdmin(async (...) => { ... })
```

### Données sensibles

- Certaines queries retournent des emails et noms d'utilisateurs
- Implémenter l'autorisation appropriée selon les besoins
- Audit logging pour les accès aux statistiques

## 🧪 Tests

### Exemple de test

```typescript
describe('Statistiques Resolvers', () => {
  it('devrait retourner le dashboard global', async () => {
    const result = await statistiquesResolvers.Query.dashboardGlobal(
      null,
      {},
      { user: { id: 1, role: 'admin' } }
    );
    
    expect(result).toHaveProperty('nombreMembres');
    expect(result).toHaveProperty('totalPaiementsMois');
    expect(result.statistiquesGenerales).toHaveProperty('total_utilisateurs');
  });
  
  it('devrait retourner les stats de fréquentation d\'un utilisateur', async () => {
    const result = await statistiquesResolvers.Query.statistiquesFrequentation(
      null,
      { utilisateur_id: 1 },
      { user: { id: 1, role: 'user' } }
    );
    
    expect(Array.isArray(result)).toBe(true);
  });
});
```

## 📚 Client DB

Ce module utilise le client DB legacy `Statistiques` :
- Localisation: `api/src/db/clients/statistiques/statistiques.ts`
- Type: Classe legacy (pas de repository moderne)
- Méthodes: 30+ méthodes disponibles

## 🚀 Évolutions Futures

- [ ] Ajouter des filtres par date personnalisables
- [ ] Implémenter le caching des statistiques
- [ ] Ajouter des exports PDF/Excel
- [ ] Créer des graphiques côté serveur
- [ ] Ajouter des statistiques de messagerie
- [ ] Statistiques en temps réel (subscriptions)
- [ ] Moderniser le client DB en repository

## 📝 Notes

- Toutes les dates sont au format ISO 8601
- Les montants sont en Float (précision décimale)
- Les taux sont en pourcentages (0-100)
- Les queries consolidées optimisent les performances

## 🆘 Support

- Voir la documentation principale: `api/src/graphql/README_NEW_MODULES.md`
- Client DB: `api/src/db/clients/statistiques/statistiques.ts`
- Tests: À créer dans `api/tests/graphql/statistiques.test.ts`

---

**Version:** 1.0.0  
**Status:** ✅ Complété  
**Dernière mise à jour:** 2024