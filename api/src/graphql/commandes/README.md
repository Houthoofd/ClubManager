# GraphQL Commandes Module

Module GraphQL pour la gestion des commandes dans ClubManager. Fournit une API GraphQL complète pour créer, lire, mettre à jour et supprimer des commandes, ainsi que pour gérer les statistiques et le stock.

## 📋 Table des matières

- [Installation](#installation)
- [Types GraphQL](#types-graphql)
- [Queries](#queries)
- [Mutations](#mutations)
- [Exemples d'utilisation](#exemples-dutilisation)
- [Gestion des erreurs](#gestion-des-erreurs)
- [Intégration avec Apollo Client](#intégration-avec-apollo-client)
- [Tests](#tests)

## 🚀 Installation

### Intégration au serveur Apollo

Dans votre fichier `server.ts` ou `index.ts` :

```typescript
import { commandesTypeDefs, commandesResolvers } from './graphql/commandes';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';

const typeDefs = mergeTypeDefs([
  baseTypeDefs,
  commandesTypeDefs,
  // ... autres typeDefs
]);

const resolvers = mergeResolvers([
  baseResolvers,
  commandesResolvers,
  // ... autres resolvers
]);

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({
    user: req.user, // Votre logique d'auth
  }),
});
```

## 📊 Types GraphQL

### ArticleCommande

Représente un article dans une commande.

```graphql
type ArticleCommande {
  article_id: String!
  nom: String!
  quantite: Int!
  prix_unitaire: Float!
  prix_total: Float!
  image: String
  taille: String
  couleur: String
}
```

### Commande

Représente une commande complète.

```graphql
type Commande {
  commande_id: String!
  utilisateur_id: Int!
  statut: String!
  total: Float!
  articles: [ArticleCommande!]!
  date_commande: String!
  updated_at: String!
  payment_intent_id: String
  nom_utilisateur: String
  email: String
}
```

### StatutCommande

Énumération des statuts possibles.

```graphql
enum StatutCommande {
  EN_ATTENTE
  CONFIRMEE
  EN_PREPARATION
  EXPEDIE
  LIVREE
  ANNULEE
  REMBOURSEE
}
```

### CommandeStatistiques

Statistiques globales des commandes.

```graphql
type CommandeStatistiques {
  total_commandes: Int!
  commandes_en_attente: Int!
  commandes_confirmees: Int!
  commandes_en_preparation: Int!
  commandes_expedie: Int!
  commandes_livrees: Int!
  commandes_annulees: Int!
  commandes_remboursees: Int!
  chiffre_affaires_total: Float!
  chiffre_affaires_mois: Float!
  panier_moyen: Float!
}
```

## 🔍 Queries

### commandes

Récupère toutes les commandes.

```graphql
query {
  commandes {
    commande_id
    utilisateur_id
    statut
    total
    articles {
      article_id
      nom
      quantite
      prix_total
    }
    date_commande
    nom_utilisateur
    email
  }
}
```

### commande

Récupère une commande par son ID.

```graphql
query {
  commande(commandeId: "CMD-123") {
    commande_id
    statut
    total
    articles {
      nom
      quantite
      prix_total
    }
    nom_utilisateur
  }
}
```

### commandesByUserId

Récupère toutes les commandes d'un utilisateur.

```graphql
query {
  commandesByUserId(utilisateurId: 42) {
    commande_id
    statut
    total
    date_commande
  }
}
```

### commandesByStatut

Récupère les commandes par statut.

```graphql
query {
  commandesByStatut(statut: "confirmee") {
    commande_id
    utilisateur_id
    total
    date_commande
  }
}
```

### searchCommandes

Recherche des commandes avec filtres et pagination.

```graphql
query {
  searchCommandes(
    filters: {
      statut: "confirmee"
      date_debut: "2024-01-01"
      date_fin: "2024-12-31"
      montant_min: 50.0
      limit: 20
      offset: 0
    }
  ) {
    commandes {
      commande_id
      total
      date_commande
    }
    total
    page
    totalPages
  }
}
```

**Filtres disponibles** :
- `statut`: Filtrer par statut
- `utilisateur_id`: Filtrer par utilisateur
- `date_debut`: Date de début (YYYY-MM-DD)
- `date_fin`: Date de fin (YYYY-MM-DD)
- `search`: Recherche textuelle (ID commande, nom, email)
- `montant_min`: Montant minimum
- `montant_max`: Montant maximum
- `limit`: Nombre de résultats par page (défaut: 50, max: 1000)
- `offset`: Décalage pour la pagination

### commandesStatistiques

Obtient les statistiques globales.

```graphql
query {
  commandesStatistiques {
    total_commandes
    commandes_en_attente
    commandes_confirmees
    commandes_livrees
    commandes_annulees
    chiffre_affaires_total
    chiffre_affaires_mois
    panier_moyen
  }
}
```

### commandesCountByStatut

Compte les commandes par statut.

```graphql
query {
  commandesCountByStatut {
    statut
    count
  }
}
```

### commandesStatsByPeriod

Obtient les statistiques par période.

```graphql
query {
  commandesStatsByPeriod(period: DAY, duration: 30) {
    periode
    nombre_commandes
    chiffre_affaires
    panier_moyen
  }
}
```

**Périodes disponibles** :
- `DAY`: Statistiques par jour
- `WEEK`: Statistiques par semaine
- `MONTH`: Statistiques par mois

### topProduits

Obtient les produits les plus vendus.

```graphql
query {
  topProduits(limit: 10) {
    article_id
    nom
    quantite_vendue
    chiffre_affaires
    nombre_commandes
  }
}
```

### checkStockAvailability

Vérifie la disponibilité du stock.

```graphql
query {
  checkStockAvailability(
    articles: [
      {
        article_id: "ART-001"
        nom: "T-shirt"
        quantite: 5
        prix_unitaire: 24.99
        prix_total: 124.95
      }
    ]
  ) {
    available
    insufficientItems {
      article_id
      nom
      requested
      available
    }
  }
}
```

## ✏️ Mutations

### createCommande

Crée une nouvelle commande.

```graphql
mutation {
  createCommande(
    data: {
      commande_id: "CMD-12345"
      utilisateur_id: 1
      total: 99.99
      articles: [
        {
          article_id: "ART-001"
          nom: "T-shirt Club"
          quantite: 2
          prix_unitaire: 24.99
          prix_total: 49.98
          taille: "M"
          couleur: "Bleu"
        }
        {
          article_id: "ART-002"
          nom: "Casquette"
          quantite: 1
          prix_unitaire: 19.99
          prix_total: 19.99
        }
      ]
      statut: "en_attente"
      payment_intent_id: "pi_xyz123"
    }
  ) {
    commande_id
    statut
    total
    date_commande
  }
}
```

**Erreurs possibles** :
- `Données invalides`: Validation échouée
- `Utilisateur introuvable`: L'utilisateur n'existe pas
- `Cette commande existe déjà`: ID de commande en doublon

### updateCommande

Met à jour une commande.

```graphql
mutation {
  updateCommande(
    commandeId: "CMD-123"
    data: {
      statut: "en_preparation"
      total: 109.99
    }
  ) {
    commande_id
    statut
    total
    updated_at
  }
}
```

**Erreurs possibles** :
- `Commande introuvable`: L'ID n'existe pas
- `Cette commande ne peut pas être modifiée`: Statut final (livree, annulee, remboursee)
- `Transition de statut invalide`: Changement de statut non autorisé

### updateCommandeStatut

Met à jour uniquement le statut.

```graphql
mutation {
  updateCommandeStatut(
    commandeId: "CMD-123"
    nouveauStatut: "confirmee"
  ) {
    commande_id
    statut
    updated_at
  }
}
```

### cancelCommande

Annule une commande.

```graphql
mutation {
  cancelCommande(commandeId: "CMD-123") {
    commande_id
    statut
    updated_at
  }
}
```

**Erreurs possibles** :
- `Commande introuvable`
- `Cette commande ne peut pas être annulée`: Statut ne permet pas l'annulation

### deleteCommande

Supprime une commande.

```graphql
mutation {
  deleteCommande(commandeId: "CMD-123")
}
```

**Retourne** : `Boolean` (true si succès)

### reserveStock

Réserve du stock pour une commande.

```graphql
mutation {
  reserveStock(
    commandeId: "CMD-123"
    articles: [
      {
        article_id: "ART-001"
        nom: "T-shirt"
        quantite: 2
        prix_unitaire: 24.99
        prix_total: 49.98
      }
    ]
  )
}
```

### releaseStock

Libère le stock réservé.

```graphql
mutation {
  releaseStock(
    commandeId: "CMD-123"
    articles: [
      {
        article_id: "ART-001"
        nom: "T-shirt"
        quantite: 2
        prix_unitaire: 24.99
        prix_total: 49.98
      }
    ]
  )
}
```

## 💻 Exemples d'utilisation

### Exemple complet : Création de commande

```typescript
import { gql } from '@apollo/client';

const CREATE_COMMANDE = gql`
  mutation CreateCommande($data: CreateCommandeInput!) {
    createCommande(data: $data) {
      commande_id
      statut
      total
      date_commande
    }
  }
`;

// Dans votre composant
const [createCommande, { data, loading, error }] = useMutation(CREATE_COMMANDE);

const handleCreateCommande = async () => {
  try {
    const result = await createCommande({
      variables: {
        data: {
          commande_id: `CMD-${Date.now()}`,
          utilisateur_id: userId,
          total: cartTotal,
          articles: cartItems.map(item => ({
            article_id: item.id,
            nom: item.name,
            quantite: item.quantity,
            prix_unitaire: item.price,
            prix_total: item.quantity * item.price,
          })),
          statut: 'en_attente',
          payment_intent_id: paymentIntentId,
        },
      },
    });
    
    console.log('Commande créée:', result.data.createCommande);
  } catch (err) {
    console.error('Erreur:', err.message);
  }
};
```

### Exemple : Dashboard admin avec statistiques

```typescript
import { useQuery, gql } from '@apollo/client';

const GET_STATS = gql`
  query GetCommandesStats {
    commandesStatistiques {
      total_commandes
      chiffre_affaires_total
      chiffre_affaires_mois
      panier_moyen
    }
    
    commandesCountByStatut {
      statut
      count
    }
    
    topProduits(limit: 5) {
      nom
      quantite_vendue
      chiffre_affaires
    }
  }
`;

function AdminDashboard() {
  const { data, loading, error } = useQuery(GET_STATS);
  
  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  
  return (
    <div>
      <StatsCards stats={data.commandesStatistiques} />
      <StatusChart counts={data.commandesCountByStatut} />
      <TopProducts products={data.topProduits} />
    </div>
  );
}
```

### Exemple : Liste de commandes utilisateur

```typescript
const GET_USER_COMMANDES = gql`
  query GetUserCommandes($userId: Int!) {
    commandesByUserId(utilisateurId: $userId) {
      commande_id
      statut
      total
      date_commande
      articles {
        nom
        quantite
        prix_total
      }
    }
  }
`;

function UserCommandes({ userId }) {
  const { data, loading } = useQuery(GET_USER_COMMANDES, {
    variables: { userId },
  });
  
  return (
    <div>
      {data?.commandesByUserId.map(commande => (
        <CommandeCard key={commande.commande_id} commande={commande} />
      ))}
    </div>
  );
}
```

### Exemple : Recherche avec pagination

```typescript
const SEARCH_COMMANDES = gql`
  query SearchCommandes($filters: CommandeSearchFiltersInput!) {
    searchCommandes(filters: $filters) {
      commandes {
        commande_id
        statut
        total
        date_commande
        nom_utilisateur
      }
      total
      page
      totalPages
    }
  }
`;

function CommandesSearch() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    statut: '',
    search: '',
  });
  
  const { data } = useQuery(SEARCH_COMMANDES, {
    variables: {
      filters: {
        ...filters,
        limit: 20,
        offset: (page - 1) * 20,
      },
    },
  });
  
  return (
    <div>
      <SearchFilters filters={filters} onChange={setFilters} />
      <CommandesList commandes={data?.searchCommandes.commandes} />
      <Pagination
        page={page}
        totalPages={data?.searchCommandes.totalPages}
        onChange={setPage}
      />
    </div>
  );
}
```

## 🚨 Gestion des erreurs

Les resolvers GraphQL retournent des erreurs avec des messages clairs :

```typescript
try {
  const result = await createCommande({ variables: { data } });
} catch (error) {
  if (error.message.includes('Données invalides')) {
    // Afficher les erreurs de validation
  } else if (error.message.includes('Utilisateur introuvable')) {
    // Rediriger vers la page de connexion
  } else if (error.message.includes('Stock insuffisant')) {
    // Afficher un message de stock
  } else {
    // Erreur générique
  }
}
```

### Codes d'erreur courants

| Message | Description | Action recommandée |
|---------|-------------|-------------------|
| `Données invalides` | Validation échouée | Vérifier les champs du formulaire |
| `Commande introuvable` | ID inexistant | Vérifier l'ID |
| `Utilisateur introuvable` | User ID invalide | Vérifier l'authentification |
| `Cette commande existe déjà` | ID en doublon | Générer un nouvel ID |
| `Cette commande ne peut pas être modifiée` | Statut final | Désactiver les modifications |
| `Transition de statut invalide` | Changement non autorisé | Afficher les statuts valides |
| `Stock insuffisant` | Pas assez de stock | Réduire la quantité |

## 🧪 Tests

### Exemple de test avec Jest

```typescript
import { ApolloServer } from '@apollo/server';
import { commandesTypeDefs, commandesResolvers } from '../commandes';

describe('Commandes GraphQL', () => {
  let server: ApolloServer;
  
  beforeAll(() => {
    server = new ApolloServer({
      typeDefs: commandesTypeDefs,
      resolvers: commandesResolvers,
    });
  });
  
  it('should fetch all commandes', async () => {
    const query = `
      query {
        commandes {
          commande_id
          statut
        }
      }
    `;
    
    const result = await server.executeOperation({ query });
    expect(result.body.kind).toBe('single');
    expect(result.body.singleResult.data?.commandes).toBeDefined();
  });
  
  it('should create a commande', async () => {
    const mutation = `
      mutation($data: CreateCommandeInput!) {
        createCommande(data: $data) {
          commande_id
        }
      }
    `;
    
    const variables = {
      data: {
        commande_id: 'TEST-001',
        utilisateur_id: 1,
        total: 99.99,
        articles: [/* ... */],
      },
    };
    
    const result = await server.executeOperation({ query: mutation, variables });
    expect(result.body.singleResult.data?.createCommande.commande_id).toBe('TEST-001');
  });
});
```

## 🔐 Sécurité et authentification

### Exemple de middleware d'authentification

```typescript
export const commandesResolvers = {
  Query: {
    commandes: async (_: any, __: any, context: GraphQLContext) => {
      // Vérifier l'authentification
      if (!context.user) {
        throw new Error('Non authentifié');
      }
      
      // Vérifier les permissions (admin seulement)
      if (context.user.role !== 'admin') {
        throw new Error('Accès non autorisé');
      }
      
      // Continuer...
      const service = getCommandesService();
      return await service.getAllCommandes();
    },
    
    commandesByUserId: async (_: any, { utilisateurId }: any, context: GraphQLContext) => {
      // Un utilisateur ne peut voir que ses propres commandes
      if (!context.user) {
        throw new Error('Non authentifié');
      }
      
      if (context.user.role !== 'admin' && context.user.id !== utilisateurId) {
        throw new Error('Accès non autorisé');
      }
      
      // Continuer...
    },
  },
};
```

## 📚 Ressources

- [Documentation Apollo Server](https://www.apollographql.com/docs/apollo-server/)
- [Documentation Apollo Client](https://www.apollographql.com/docs/react/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [Module Commandes](../../db/clients/commandes/README.md)

## 🤝 Contribution

Pour ajouter de nouvelles queries ou mutations :

1. Ajouter les types dans `commandes.typeDefs.ts`
2. Implémenter les resolvers dans `commandes.resolvers.ts`
3. Ajouter des exemples dans ce README
4. Écrire des tests

---

**Version**: 1.0.0  
**Dernière mise à jour**: 2024