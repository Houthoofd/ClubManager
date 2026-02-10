# 🔍 Configuration Sentry - Club Manager API

## Vue d'ensemble

Sentry est intégré dans l'application pour fournir un monitoring en temps réel des erreurs et des performances. Le système est configuré pour capturer automatiquement les erreurs dans tous les resolvers GraphQL migrés.

## 📊 Couverture Actuelle

**131 resolvers** sont équipés du middleware `withSentry` répartis sur **11 modules** :

| Module | Resolvers | Couverture |
|--------|-----------|------------|
| Alertes | 9 | 100% ✅ |
| Messages | 20 | 100% ✅ |
| Commandes | 14 | 100% ✅ |
| Compte | 18 | 100% ✅ |
| Confirmation | 3 | 100% ✅ |
| Cours | 15 | 100% ✅ |
| Écheances | 9 | 100% ✅ |
| Informations | 13 | 100% ✅ |
| Inscription | 5 | 100% ✅ |
| Magasin | 18 | 100% ✅ |
| Paiements | 7 | 100% ✅ |

## 🔧 Configuration Requise

### Variables d'Environnement

Ajouter dans `.env.development` ou `.env.production` :

```env
# ============================================
# SENTRY CONFIGURATION
# ============================================

# Activer/désactiver Sentry
SENTRY_ENABLED=true

# DSN Sentry (obligatoire si SENTRY_ENABLED=true)
# Obtenir sur : https://sentry.io/settings/[organization]/projects/[project]/keys/
SENTRY_DSN=https://your-public-key@o[org-id].ingest.sentry.io/[project-id]

# Environnement (development, staging, production)
SENTRY_ENVIRONMENT=development

# Taux d'échantillonnage des erreurs (0.0 à 1.0)
# 1.0 = capture 100% des erreurs
SENTRY_SAMPLE_RATE=1.0

# Taux d'échantillonnage des traces de performance (0.0 à 1.0)
# 0.1 = capture 10% des transactions pour analyse de performance
SENTRY_TRACES_SAMPLE_RATE=0.1

# Taux d'échantillonnage du profiling (0.0 à 1.0)
SENTRY_PROFILES_SAMPLE_RATE=0.1

# Mode debug Sentry (true/false)
# Active les logs détaillés pour le debugging
SENTRY_DEBUG=false
```

### Recommandations par Environnement

#### Development
```env
SENTRY_ENABLED=false  # Optionnel en dev
SENTRY_ENVIRONMENT=development
SENTRY_SAMPLE_RATE=1.0
SENTRY_TRACES_SAMPLE_RATE=1.0
SENTRY_DEBUG=true
```

#### Staging
```env
SENTRY_ENABLED=true
SENTRY_ENVIRONMENT=staging
SENTRY_SAMPLE_RATE=1.0
SENTRY_TRACES_SAMPLE_RATE=0.5
SENTRY_DEBUG=false
```

#### Production
```env
SENTRY_ENABLED=true
SENTRY_ENVIRONMENT=production
SENTRY_SAMPLE_RATE=1.0
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
SENTRY_DEBUG=false
```

## 📝 Fonctionnalités Implémentées

### 1. Capture Automatique des Erreurs
Toutes les erreurs non gérées dans les resolvers sont automatiquement capturées et envoyées à Sentry.

### 2. Context Utilisateur
Les informations utilisateur (ID, email, rôle) sont automatiquement attachées aux événements :
```typescript
{
  id: user.id,
  email: user.email,
  role: user.role
}
```

### 3. Breadcrumbs
Chaque opération GraphQL génère un breadcrumb pour tracer le parcours de l'utilisateur :
```typescript
{
  category: "graphql",
  message: "Query: obtenirTousLesArticles",
  level: "info",
  data: { args, userId }
}
```

### 4. Transactions & Performance
Chaque resolver crée une transaction Sentry pour mesurer les performances :
- Nom : `graphql.query.nomDuResolver` ou `graphql.mutation.nomDeLaMutation`
- Opération : `graphql.query` ou `graphql.mutation`
- Durée d'exécution
- Résultat (success/error)

### 5. Sanitization des Données Sensibles
Les données sensibles sont automatiquement nettoyées avant envoi :
- Mots de passe
- Tokens
- Secrets
- Clés API
- Informations de carte bancaire

### 6. Tags Personnalisés
Tags ajoutés automatiquement :
- `operation_type`: "query" ou "mutation"
- `resolver_name`: nom du resolver
- `has_user`: true/false
- `user_role`: rôle de l'utilisateur

## 🚀 Utilisation dans les Resolvers

Le middleware `withSentry` est appliqué via `combineMiddlewares` :

```typescript
import { withSentry } from "../../../../shared/middleware/sentry.middleware.js";
import { requireAuth, combineMiddlewares } from "...";

export const myResolvers = {
  Query: {
    myQuery: combineMiddlewares(
      requireAuth,
      withSentry,  // 🔍 Sentry monitoring
    )(async (parent, args, context) => {
      // Votre logique ici
      // Les erreurs sont automatiquement capturées
    }),
  },
};
```

## 🔍 Monitoring dans Sentry Dashboard

### Visualiser les Erreurs
1. Accéder à https://sentry.io
2. Sélectionner votre projet
3. Onglet "Issues" pour voir les erreurs

### Analyser les Performances
1. Onglet "Performance"
2. Filtrer par `graphql.query` ou `graphql.mutation`
3. Identifier les resolvers lents

### Parcours Utilisateur
1. Cliquer sur une erreur
2. Section "Breadcrumbs" montre le parcours complet
3. Section "User" montre les infos utilisateur

## 📊 Métriques Disponibles

- **Error Rate** : Taux d'erreur par resolver
- **Response Time** : Temps de réponse moyen
- **Throughput** : Nombre de requêtes/seconde
- **Apdex Score** : Score de satisfaction utilisateur
- **User Impact** : Nombre d'utilisateurs affectés

## 🔧 Configuration Avancée

### Ignorer certaines erreurs
Modifier `api/src/shared/config/sentry.config.ts` :

```typescript
beforeSend(event, hint) {
  // Ignorer les erreurs 404
  if (event.message?.includes('NotFoundError')) {
    return null;
  }
  return event;
}
```

### Ajouter des tags personnalisés
Dans un resolver :

```typescript
import * as Sentry from '@sentry/node';

// Dans le resolver
Sentry.setTag('custom_tag', 'value');
```

### Capturer manuellement une erreur
```typescript
import * as Sentry from '@sentry/node';

try {
  // Code risqué
} catch (error) {
  Sentry.captureException(error, {
    tags: { custom: 'value' },
    level: 'warning'
  });
}
```

## 🧪 Tester l'Installation

### 1. Vérifier les logs au démarrage
```
✅ [Sentry] Monitoring initialisé avec succès
   - Environment: development
   - DSN configuré: Oui
   - Sample Rate: 1.0
   - Traces Sample Rate: 0.1
```

### 2. Déclencher une erreur de test
Créer un resolver de test qui lance une erreur :

```typescript
testSentry: combineMiddlewares(
  requireAuth,
  withSentry,
)(async () => {
  throw new Error('Test Sentry - Please ignore');
}),
```

### 3. Vérifier dans Sentry Dashboard
L'erreur devrait apparaître dans les 30 secondes.

## 🛠️ Troubleshooting

### Sentry ne capture rien
- ✅ Vérifier `SENTRY_ENABLED=true`
- ✅ Vérifier que `SENTRY_DSN` est correctement configuré
- ✅ Vérifier les logs de démarrage
- ✅ Tester avec `SENTRY_DEBUG=true`

### Performances dégradées
- Réduire `SENTRY_TRACES_SAMPLE_RATE` (ex: 0.01 = 1%)
- Désactiver le profiling (`SENTRY_PROFILES_SAMPLE_RATE=0`)

### Trop d'événements
- Réduire `SENTRY_SAMPLE_RATE`
- Configurer `beforeSend` pour filtrer

## 📚 Ressources

- [Documentation Sentry Node.js](https://docs.sentry.io/platforms/node/)
- [Best Practices](https://docs.sentry.io/platforms/node/best-practices/)
- [Performance Monitoring](https://docs.sentry.io/platforms/node/performance/)
- [Configuration Sentry](https://docs.sentry.io/platforms/node/configuration/)

## 🎯 Prochaines Étapes

1. ✅ Sentry initialisé globalement
2. ✅ 131 resolvers équipés du middleware
3. ⏳ Configurer les alertes Sentry
4. ⏳ Créer un dashboard personnalisé
5. ⏳ Intégrer avec Slack/Email pour notifications
6. ⏳ Configurer des releases pour tracking de déploiements

---

**Dernière mise à jour** : 2024
**Modules couverts** : 11/X
**Resolvers monitorés** : 131