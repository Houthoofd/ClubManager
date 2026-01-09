# GraphQL Alertes API - Guide Complet

Guide d'utilisation de l'API GraphQL pour la gestion des alertes utilisateurs dans ClubManager.

## 📚 Table des Matières

- [Introduction](#introduction)
- [Types GraphQL](#types-graphql)
- [Queries](#queries)
- [Mutations](#mutations)
- [Exemples d'utilisation](#exemples-dutilisation)
- [Cas d'usage](#cas-dusage)
- [Gestion des erreurs](#gestion-des-erreurs)
- [Permissions](#permissions)

## 🚀 Introduction

L'API GraphQL Alertes permet de :
- ✅ Visualiser les alertes actives
- ✅ Détecter automatiquement les problèmes
- ✅ Résoudre ou ignorer les alertes
- ✅ Suivre les statistiques
- ✅ Gérer les alertes critiques en priorité

**Endpoint GraphQL** : `http://localhost:5000/graphql`

## 📊 Types GraphQL

### Enums

#### StatutAlerte
```graphql
enum StatutAlerte {
  ACTIVE      # Alerte en attente de traitement
  RESOLUE     # Alerte résolue
  IGNOREE     # Alerte ignorée (non pertinente)
}
```

#### PrioriteAlerte
```graphql
enum PrioriteAlerte {
  BASSE       # Priorité basse (info)
  NORMALE     # Priorité normale
  HAUTE       # Priorité haute (attention requise)
  CRITIQUE    # Priorité critique (action immédiate)
}
```

### Types Principaux

#### AlerteActive
Alerte utilisateur active avec détails complets.

```graphql
type AlerteActive {
  id: Int!
  utilisateurId: Int!
  typeAlerte: String!
  code: String!
  description: String!
  priorite: PrioriteAlerte!
  donneesContexte: JSON
  dateDetection: DateTime!
  nomUtilisateur: String!
  email: String!
  statusId: Int!
}
```

#### DashboardAlerte
Vue d'ensemble des alertes par type.

```graphql
type DashboardAlerte {
  typeAlerte: String!
  code: String!
  priorite: PrioriteAlerte!
  nombreAlertes: Int!
  utilisateursAffectes: Int!
}
```

#### StatistiquesAlertes
Statistiques globales du système d'alertes.

```graphql
type StatistiquesAlertes {
  totalAlertes: Int!
  alertesActives: Int!
  alertesResolues: Int!
  alertesCritiques: Int!
  tauxResolution: Float
  tempsMoyenResolution: Float
}
```

## 🔍 Queries

### alertesDashboard

Récupère le dashboard des alertes avec vue d'ensemble par type.

**Permissions** : Admin ou Manager

```graphql
query GetDashboard {
  alertesDashboard {
    typeAlerte
    code
    priorite
    nombreAlertes
    utilisateursAffectes
  }
}
```

**Réponse** :
```json
{
  "data": {
    "alertesDashboard": [
      {
        "typeAlerte": "Paiement en retard",
        "code": "PAIEMENT_RETARD",
        "priorite": "HAUTE",
        "nombreAlertes": 15,
        "utilisateursAffectes": 12
      },
      {
        "typeAlerte": "Absence répétée",
        "code": "ABSENCE_REPETEE",
        "priorite": "NORMALE",
        "nombreAlertes": 8,
        "utilisateursAffectes": 8
      }
    ]
  }
}
```

### alertesActives

Récupère les alertes actives avec pagination et filtres.

**Permissions** : Admin ou Manager

```graphql
query GetAlertesActives(
  $filter: AlertesActivesFilter
  $pagination: PaginationInput
) {
  alertesActives(filter: $filter, pagination: $pagination) {
    alertes {
      id
      utilisateurId
      typeAlerte
      code
      priorite
      dateDetection
      nomUtilisateur
      email
    }
    total
    page
    totalPages
  }
}
```

**Variables** :
```json
{
  "filter": {
    "priorite": "CRITIQUE",
    "search": "dupont"
  },
  "pagination": {
    "page": 1,
    "limit": 10
  }
}
```

**Filtres disponibles** :
- `priorite` : Filtrer par niveau de priorité
- `typeCode` : Filtrer par code de type d'alerte
- `utilisateurId` : Filtrer par utilisateur
- `search` : Recherche textuelle (nom, email, type)

### alertesUtilisateur

Récupère toutes les alertes d'un utilisateur spécifique.

**Permissions** : Authentifié

```graphql
query GetUserAlertes($userId: Int!) {
  alertesUtilisateur(userId: $userId) {
    id
    statut
    dateDetection
    dateResolution
    notes
  }
}
```

### statistiquesAlertes

Récupère les statistiques globales des alertes.

**Permissions** : Admin ou Manager

```graphql
query GetStats {
  statistiquesAlertes {
    totalAlertes
    alertesActives
    alertesResolues
    alertesCritiques
    tauxResolution
    tempsMoyenResolution
  }
}
```

**Réponse** :
```json
{
  "data": {
    "statistiquesAlertes": {
      "totalAlertes": 150,
      "alertesActives": 35,
      "alertesResolues": 115,
      "alertesCritiques": 5,
      "tauxResolution": 77,
      "tempsMoyenResolution": 2.5
    }
  }
}
```

### alertesCritiques

Récupère uniquement les alertes critiques urgentes.

**Permissions** : Authentifié

```graphql
query GetCritiques {
  alertesCritiques {
    id
    utilisateurId
    typeAlerte
    description
    priorite
    dateDetection
    nomUtilisateur
    email
  }
}
```

**Utilisation** : Pour afficher un widget "Alertes urgentes" dans le dashboard.

### nombreAlertesParUtilisateur

Compte les alertes actives d'un utilisateur.

**Permissions** : Authentifié

```graphql
query CountUserAlertes($userId: Int!) {
  nombreAlertesParUtilisateur(userId: $userId)
}
```

**Utilisation** : Badge d'alerte sur le profil utilisateur.

## ✏️ Mutations

### detecterAlertes

Déclenche la détection automatique des alertes pour tous les utilisateurs.

**Permissions** : Admin

```graphql
mutation TriggerDetection {
  detecterAlertes {
    success
    message
    nombreAlertesDetectees
  }
}
```

**Utilisation** : À exécuter via un CRON job quotidien ou manuel depuis l'interface admin.

**Réponse** :
```json
{
  "data": {
    "detecterAlertes": {
      "success": true,
      "message": "Détection des alertes effectuée avec succès",
      "nombreAlertesDetectees": 12
    }
  }
}
```

### resoudreAlerte

Résout une alerte spécifique avec notes et tracking.

**Permissions** : Authentifié

```graphql
mutation ResolveAlerte($input: ResoudreAlerteInput!) {
  resoudreAlerte(input: $input) {
    success
    message
    alerte {
      id
      statut
      dateResolution
    }
  }
}
```

**Variables** :
```json
{
  "input": {
    "alerteId": 123,
    "notes": "Utilisateur a effectué le paiement en retard",
    "effectuePar": 456
  }
}
```

### ignorerAlerte

Ignore une alerte (la marque comme non pertinente).

**Permissions** : Authentifié

```graphql
mutation IgnoreAlerte($input: IgnorerAlerteInput!) {
  ignorerAlerte(input: $input) {
    success
    message
  }
}
```

**Variables** :
```json
{
  "input": {
    "alerteId": 123,
    "notes": "Fausse alerte - l'utilisateur était en vacances"
  }
}
```

### reactiverAlerte

Réactive une alerte précédemment résolue ou ignorée.

**Permissions** : Admin

```graphql
mutation ReactivateAlerte($alerteId: Int!) {
  reactiverAlerte(alerteId: $alerteId) {
    success
    message
  }
}
```

### resoudreAlertesEnMasse

Résout toutes les alertes d'un type spécifique en une seule opération.

**Permissions** : Admin

```graphql
mutation BulkResolve(
  $typeCode: String!
  $notes: String!
  $effectuePar: Int!
) {
  resoudreAlertesEnMasse(
    typeCode: $typeCode
    notes: $notes
    effectuePar: $effectuePar
  ) {
    success
    message
    nombreAlertesDetectees
  }
}
```

**Variables** :
```json
{
  "typeCode": "ABSENCE_REPETEE",
  "notes": "Résolution en masse après vérification manuelle",
  "effectuePar": 1
}
```

## 💻 Exemples d'Utilisation

### React + Apollo Client

#### Dashboard des Alertes

```typescript
import { gql, useQuery } from '@apollo/client';

const DASHBOARD_QUERY = gql`
  query GetAlertsDashboard {
    alertesDashboard {
      typeAlerte
      code
      priorite
      nombreAlertes
      utilisateursAffectes
    }
    statistiquesAlertes {
      totalAlertes
      alertesActives
      alertesCritiques
      tauxResolution
    }
  }
`;

function AlertesDashboard() {
  const { loading, error, data } = useQuery(DASHBOARD_QUERY, {
    pollInterval: 60000 // Rafraîchir toutes les minutes
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  const { alertesDashboard, statistiquesAlertes } = data;

  return (
    <div className="dashboard">
      <StatsCards stats={statistiquesAlertes} />
      
      <AlertesTable data={alertesDashboard} />
    </div>
  );
}
```

#### Liste des Alertes Actives avec Filtres

```typescript
import { gql, useQuery } from '@apollo/client';
import { useState } from 'react';

const ALERTES_ACTIVES = gql`
  query GetAlertesActives(
    $filter: AlertesActivesFilter
    $pagination: PaginationInput
  ) {
    alertesActives(filter: $filter, pagination: $pagination) {
      alertes {
        id
        typeAlerte
        priorite
        nomUtilisateur
        email
        dateDetection
      }
      total
      page
      totalPages
    }
  }
`;

function AlertesList() {
  const [priorite, setPriorite] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { loading, data } = useQuery(ALERTES_ACTIVES, {
    variables: {
      filter: {
        priorite,
        search: search || undefined
      },
      pagination: {
        page,
        limit: 20
      }
    }
  });

  return (
    <div>
      <Filters
        priorite={priorite}
        setPriorite={setPriorite}
        search={search}
        setSearch={setSearch}
      />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <AlertesTable alertes={data.alertesActives.alertes} />
          
          <Pagination
            current={page}
            total={data.alertesActives.totalPages}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}
```

#### Résoudre une Alerte

```typescript
import { gql, useMutation } from '@apollo/client';

const RESOUDRE_ALERTE = gql`
  mutation ResolveAlerte($input: ResoudreAlerteInput!) {
    resoudreAlerte(input: $input) {
      success
      message
    }
  }
`;

function AlerteActions({ alerte, currentUserId }) {
  const [resoudre, { loading }] = useMutation(RESOUDRE_ALERTE, {
    refetchQueries: ['GetAlertesActives']
  });

  const handleResolve = async () => {
    const notes = prompt('Notes de résolution :');
    if (!notes) return;

    try {
      const { data } = await resoudre({
        variables: {
          input: {
            alerteId: alerte.id,
            notes,
            effectuePar: currentUserId
          }
        }
      });

      if (data.resoudreAlerte.success) {
        toast.success('Alerte résolue avec succès');
      }
    } catch (error) {
      toast.error('Erreur lors de la résolution');
      console.error(error);
    }
  };

  return (
    <button
      onClick={handleResolve}
      disabled={loading}
      className="btn-resolve"
    >
      {loading ? 'En cours...' : 'Résoudre'}
    </button>
  );
}
```

#### Badge d'Alerte sur Profil Utilisateur

```typescript
import { gql, useQuery } from '@apollo/client';

const COUNT_USER_ALERTES = gql`
  query CountUserAlertes($userId: Int!) {
    nombreAlertesParUtilisateur(userId: $userId)
  }
`;

function UserAlertBadge({ userId }) {
  const { data } = useQuery(COUNT_USER_ALERTES, {
    variables: { userId },
    pollInterval: 30000 // Rafraîchir toutes les 30 secondes
  });

  const count = data?.nombreAlertesParUtilisateur || 0;

  if (count === 0) return null;

  return (
    <span className={`badge ${count >= 3 ? 'badge-danger' : 'badge-warning'}`}>
      {count} alerte{count > 1 ? 's' : ''}
    </span>
  );
}
```

#### Widget Alertes Critiques

```typescript
import { gql, useQuery } from '@apollo/client';

const ALERTES_CRITIQUES = gql`
  query GetCritiques {
    alertesCritiques {
      id
      typeAlerte
      nomUtilisateur
      email
      dateDetection
    }
  }
`;

function CriticalAlertsWidget() {
  const { data, loading } = useQuery(ALERTES_CRITIQUES, {
    pollInterval: 30000 // Rafraîchir souvent pour les alertes critiques
  });

  if (loading) return <WidgetSkeleton />;

  const alertes = data?.alertesCritiques || [];

  return (
    <div className="widget critical-alerts">
      <h3>
        🚨 Alertes Critiques
        {alertes.length > 0 && (
          <span className="count">{alertes.length}</span>
        )}
      </h3>

      {alertes.length === 0 ? (
        <p className="empty">Aucune alerte critique</p>
      ) : (
        <ul className="alert-list">
          {alertes.map(alerte => (
            <li key={alerte.id} className="alert-item">
              <strong>{alerte.typeAlerte}</strong>
              <span>{alerte.nomUtilisateur}</span>
              <time>{formatDate(alerte.dateDetection)}</time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## 🎯 Cas d'Usage

### 1. Dashboard Administrateur

**Besoin** : Vue d'ensemble des alertes pour l'administrateur.

**Solution** :
```graphql
query AdminDashboard {
  statistiquesAlertes {
    totalAlertes
    alertesActives
    alertesCritiques
    tauxResolution
  }
  
  alertesCritiques {
    id
    typeAlerte
    nomUtilisateur
    priorite
  }
  
  alertesDashboard {
    typeAlerte
    nombreAlertes
    utilisateursAffectes
  }
}
```

### 2. Notification en Temps Réel

**Besoin** : Afficher un badge avec le nombre d'alertes non lues.

**Solution** :
```typescript
// Polling toutes les 30 secondes
const { data } = useQuery(COUNT_ALERTES, {
  pollInterval: 30000
});

// Badge notification
<NotificationBadge count={data?.alertesActives?.total} />
```

### 3. Traitement en Masse

**Besoin** : Résoudre toutes les alertes d'un type après vérification manuelle.

**Solution** :
```graphql
mutation {
  resoudreAlertesEnMasse(
    typeCode: "ABSENCE_REPETEE"
    notes: "Vérification effectuée - tous justifiés"
    effectuePar: 1
  ) {
    success
    nombreAlertesDetectees
  }
}
```

### 4. Détection Automatique (CRON)

**Besoin** : Détecter automatiquement les alertes chaque nuit.

**Solution** :
```typescript
// CRON job Node.js
import cron from 'node-cron';
import { apolloClient } from './apollo';

// Tous les jours à 2h du matin
cron.schedule('0 2 * * *', async () => {
  try {
    const { data } = await apolloClient.mutate({
      mutation: DETECTER_ALERTES
    });
    
    console.log('✅ Détection effectuée:', data.detecterAlertes.message);
  } catch (error) {
    console.error('❌ Erreur détection:', error);
  }
});
```

## ⚠️ Gestion des Erreurs

### Codes d'Erreur

| Code | Description | Action |
|------|-------------|--------|
| `UNAUTHENTICATED` | Non authentifié | Rediriger vers login |
| `FORBIDDEN` | Permissions insuffisantes | Afficher message accès refusé |
| `NOT_FOUND` | Alerte non trouvée | Rafraîchir la liste |
| `INTERNAL_SERVER_ERROR` | Erreur serveur | Réessayer ou contacter support |

### Exemple de Gestion

```typescript
try {
  const { data } = await resoudreAlerte({ variables: { input } });
  // Succès
} catch (error) {
  if (error.graphQLErrors) {
    error.graphQLErrors.forEach(({ extensions, message }) => {
      switch (extensions.code) {
        case 'FORBIDDEN':
          toast.error('Vous n\'avez pas les droits pour cette action');
          break;
        case 'NOT_FOUND':
          toast.error('Cette alerte n\'existe plus');
          refetchAlertes();
          break;
        default:
          toast.error(message);
      }
    });
  }
}
```

## 🔒 Permissions

### Niveau d'Accès

| Action | Authentifié | Manager | Admin |
|--------|-------------|---------|-------|
| `alertesUtilisateur` | ✅ | ✅ | ✅ |
| `alertesCritiques` | ✅ | ✅ | ✅ |
| `nombreAlertesParUtilisateur` | ✅ | ✅ | ✅ |
| `alertesDashboard` | ❌ | ✅ | ✅ |
| `alertesActives` | ❌ | ✅ | ✅ |
| `statistiquesAlertes` | ❌ | ✅ | ✅ |
| `resoudreAlerte` | ✅ | ✅ | ✅ |
| `ignorerAlerte` | ✅ | ✅ | ✅ |
| `detecterAlertes` | ❌ | ❌ | ✅ |
| `reactiverAlerte` | ❌ | ❌ | ✅ |
| `resoudreAlertesEnMasse` | ❌ | ❌ | ✅ |

## 📈 Optimisations

### 1. Polling Intelligent

```typescript
// Polling différencié selon la priorité
const pollInterval = alertesPriority === 'CRITIQUE' ? 10000 : 60000;

useQuery(ALERTES_QUERY, { pollInterval });
```

### 2. Cache Strategy

```typescript
// Utiliser le cache pour les statistiques
const { data } = useQuery(STATS_QUERY, {
  fetchPolicy: 'cache-and-network'
});
```

### 3. Pagination

Toujours utiliser la pagination pour les grandes listes :

```graphql
query {
  alertesActives(
    pagination: { page: 1, limit: 20 }
  ) {
    alertes { id }
    total
    totalPages
  }
}
```

## 🚀 Prochaines Fonctionnalités

### Subscriptions (WebSocket)

```graphql
subscription OnNouvelleAlerte {
  nouvelleAlerte {
    id
    typeAlerte
    priorite
    nomUtilisateur
  }
}
```

**Utilisation** : Notifications en temps réel sans polling.

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2024  
**Auteurs** : ClubManager Team