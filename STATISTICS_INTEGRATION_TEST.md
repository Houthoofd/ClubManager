# 🧪 Statistics Integration Testing Guide

## Overview

Ce guide vous permet de tester l'intégration complète des statistics GraphQL entre le frontend et le backend.

---

## ✅ Checklist Pré-Test

Avant de commencer les tests, assurez-vous que :

- [ ] Le backend est démarré (`npm run dev` dans `api/`)
- [ ] Le frontend est démarré (`npm run dev` dans `front-end/`)
- [ ] La base de données contient des données de test
- [ ] Le serveur GraphQL est accessible à `http://localhost:4000/graphql`

---

## 🔧 Tests Backend (GraphQL Playground)

### 1. Accéder au Playground GraphQL

Ouvrez votre navigateur : `http://localhost:4000/graphql`

---

### 2. Test des Queries Attendance

#### Query: attendanceStats
```graphql
query TestAttendanceStats {
  attendanceStats(userId: 1) {
    user_id
    total_presences
    current_month
    monthly_average
    last_session
  }
}
```

**Résultat attendu :**
```json
{
  "data": {
    "attendanceStats": {
      "user_id": 1,
      "total_presences": 45,
      "current_month": 8,
      "monthly_average": 12,
      "last_session": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### Query: topMembers
```graphql
query TestTopMembers {
  topMembers(limit: 5) {
    user_id
    first_name
    last_name
    total_presences
    attendance_rate
  }
}
```

---

### 3. Test des Queries Members

#### Query: membersCount
```graphql
query TestMembersCount {
  membersCount {
    count
  }
}
```

#### Query: membersByGrade
```graphql
query TestMembersByGrade {
  membersByGrade {
    grade_name
    count
  }
}
```

#### Query: membersByGender
```graphql
query TestMembersByGender {
  membersByGender {
    gender_name
    count
  }
}
```

#### Query: birthdays
```graphql
query TestBirthdays {
  birthdays {
    user_id
    first_name
    last_name
    birth_date
    age
  }
}
```

#### Query: newMembers
```graphql
query TestNewMembers {
  newMembers(limit: 10) {
    id
    first_name
    last_name
    email
    phone
    birth_date
    created_at
  }
}
```

---

### 4. Test des Queries Products

#### Query: topProducts
```graphql
query TestTopProducts {
  topProducts(limit: 5) {
    product_id
    name
    quantity_sold
    total_revenue
  }
}
```

---

### 5. Test des Queries Sessions

#### Query: weeklySessions
```graphql
query TestWeeklySessions {
  weeklySessions {
    total
    by_day
  }
}
```

**Résultat attendu :**
```json
{
  "data": {
    "weeklySessions": {
      "total": 15,
      "by_day": [2, 3, 2, 3, 2, 2, 1]
    }
  }
}
```

---

### 6. Test des Queries Payments

#### Query: monthlyPayments
```graphql
query TestMonthlyPayments {
  monthlyPayments {
    total
    count
  }
}
```

#### Query: recentPayments
```graphql
query TestRecentPayments {
  recentPayments(limit: 10) {
    id
    user_id
    amount
    payment_date
    status
    user_first_name
    user_last_name
  }
}
```

#### Query: pendingPayments
```graphql
query TestPendingPayments {
  pendingPayments {
    id
    user_id
    amount
    payment_date
    status
    user_first_name
    user_last_name
  }
}
```

#### Query: overduePayments
```graphql
query TestOverduePayments {
  overduePayments {
    id
    user_id
    amount
    payment_date
    status
    user_first_name
    user_last_name
  }
}
```

#### Query: lastPayments
```graphql
query TestLastPayments {
  lastPayments(limit: 10) {
    id
    user_id
    amount
    payment_date
    status
    user_first_name
    user_last_name
  }
}
```

#### Query: paymentsByMonth
```graphql
query TestPaymentsByMonth {
  paymentsByMonth {
    month
    total
    count
  }
}
```

---

### 7. Test des Queries Plans

#### Query: activePlans
```graphql
query TestActivePlans {
  activePlans {
    plan_name
    count
  }
}
```

#### Query: renewalRate
```graphql
query TestRenewalRate {
  renewalRate {
    rate
  }
}
```

#### Query: membersByPlan
```graphql
query TestMembersByPlan {
  membersByPlan {
    plan_name
    count
  }
}
```

---

### 8. Test Combiné (Toutes les Stats)

```graphql
query TestAllDashboardStats {
  # Members
  membersCount { count }
  membersByGrade { grade_name count }
  membersByGender { gender_name count }
  newMembers(limit: 5) { id first_name last_name email created_at }
  
  # Payments
  monthlyPayments { total count }
  recentPayments(limit: 5) { id amount payment_date status user_first_name user_last_name }
  pendingPayments { id amount payment_date status }
  overduePayments { id amount payment_date status }
  paymentsByMonth { month total count }
  
  # Plans
  activePlans { plan_name count }
  renewalRate { rate }
  membersByPlan { plan_name count }
  
  # Sessions
  weeklySessions { total by_day }
  
  # Products
  topProducts(limit: 5) { product_id name quantity_sold total_revenue }
}
```

---

## 🎨 Tests Frontend (Dashboard)

### 1. Accéder au Dashboard

Ouvrez : `http://localhost:5173/dashboard` (ou votre port Vite)

---

### 2. Vérifications Visuelles

#### Métriques (Cards en haut)
- [ ] **Membres inscrits** : Affiche le nombre total
- [ ] **Total encaissé ce mois** : Affiche le montant en €
- [ ] **Paiements récents (7j)** : Affiche le nombre
- [ ] **Paiements en attente** : Affiche le nombre
- [ ] **Plans actifs** : Affiche le nombre
- [ ] **Taux de renouvellement** : Affiche le pourcentage

#### Graphiques
- [ ] **Évolution des paiements** : Graphique en ligne sur 12 mois
- [ ] **Répartition par plan** : Graphique circulaire avec les plans

#### Sections Expandables
- [ ] **Derniers paiements** : Table avec utilisateur, montant, date, statut
- [ ] **Paiements échus** : Table avec paiements en retard
- [ ] **Nouveaux membres** : Table avec nom, email, date inscription

---

### 3. Tests Console (DevTools)

Ouvrez la console du navigateur (F12) et vérifiez :

```
🏠 DashboardPage mounted
📊 Dashboard Data Summary:
- Membres Count: <nombre> Loading: false Error: null
- Paiements Mois: <montant> Loading: false Error: null
- Paiements Récents: <nombre> Loading: false Error: null
...
```

**✅ Pas d'erreurs GraphQL**
**✅ Loading: false pour tous les hooks**
**✅ Error: null ou undefined**

---

### 4. Test Network (Onglet Network)

Filtrez par `graphql` et vérifiez :

- [ ] Requête `POST http://localhost:4000/graphql`
- [ ] Status `200 OK`
- [ ] Response contient `{ "data": { ... } }`
- [ ] Pas de `"errors": [...]`

---

### 5. Test Apollo DevTools (Extension Chrome/Firefox)

Si installé, ouvrez l'onglet Apollo :

- [ ] **Queries** : Voir toutes les queries actives
- [ ] **Cache** : Vérifier que les données sont bien cachées
- [ ] **Explorer** : Tester les queries manuellement

---

## 🐛 Troubleshooting

### Problème : "Cannot query field X on type Query"

**Cause :** Le backend GraphQL schema n'est pas à jour.

**Solution :**
```bash
cd api
npm run dev
# Vérifier que le schema inclut bien les queries statistics
```

---

### Problème : Données `null` ou `undefined`

**Cause :** Pas de données dans la DB ou mauvais mapping.

**Solution :**
1. Vérifier la DB : `SELECT * FROM users LIMIT 10;`
2. Vérifier les logs backend pour erreurs Prisma
3. Tester la query directement dans Playground

---

### Problème : "Network error" ou "Failed to fetch"

**Cause :** Backend non démarré ou mauvaise URL.

**Solution :**
1. Vérifier backend : `curl http://localhost:4000/graphql`
2. Vérifier `apollo-client.ts` : bon endpoint
3. Vérifier CORS si nécessaire

---

### Problème : Loading infini

**Cause :** Query qui ne se termine pas.

**Solution :**
1. Ouvrir Apollo DevTools → Queries
2. Identifier la query bloquée
3. Vérifier les logs backend pour slow queries
4. Ajouter timeout dans le hook

---

### Problème : Erreur TypeScript "Property does not exist"

**Cause :** Types GraphQL pas à jour.

**Solution :**
```bash
cd front-end
npm run codegen
```

---

## 📊 Critères de Succès

### Backend ✅

- [ ] Les 18 queries retournent des données valides
- [ ] Pas d'erreurs GraphQL
- [ ] Temps de réponse < 500ms par query
- [ ] Logs backend sans erreurs Prisma

### Frontend ✅

- [ ] Dashboard s'affiche sans erreurs
- [ ] Toutes les métriques affichent des valeurs
- [ ] Graphiques se rendent correctement
- [ ] Tables affichent les données
- [ ] Aucune erreur dans la console
- [ ] Apollo cache fonctionne (refetch rapide)

---

## 🎯 Tests de Performance

### Test de Charge Backend

```bash
# Installer Apache Bench
sudo apt-get install apache2-utils  # Linux
brew install ab  # macOS

# Tester 100 requêtes simultanées
ab -n 100 -c 10 -p query.json -T 'application/json' http://localhost:4000/graphql
```

Fichier `query.json` :
```json
{
  "query": "{ membersCount { count } }"
}
```

**Résultat attendu :**
- Requests per second: > 50
- Time per request: < 200ms
- Failed requests: 0

---

### Test de Cache Frontend

1. Charger le dashboard
2. Ouvrir DevTools → Network
3. Rafraîchir la page (F5)
4. Vérifier : **Pas de nouvelles requêtes GraphQL** (cache utilisé)

---

## 📝 Rapport de Test

### Template

```
Date: ___________
Testeur: ___________

Backend Tests:
- attendanceStats: ✅ / ❌
- topMembers: ✅ / ❌
- membersCount: ✅ / ❌
- membersByGrade: ✅ / ❌
- membersByGender: ✅ / ❌
- birthdays: ✅ / ❌
- newMembers: ✅ / ❌
- topProducts: ✅ / ❌
- weeklySessions: ✅ / ❌
- monthlyPayments: ✅ / ❌
- recentPayments: ✅ / ❌
- pendingPayments: ✅ / ❌
- overduePayments: ✅ / ❌
- lastPayments: ✅ / ❌
- paymentsByMonth: ✅ / ❌
- activePlans: ✅ / ❌
- renewalRate: ✅ / ❌
- membersByPlan: ✅ / ❌

Frontend Tests:
- Dashboard affichage: ✅ / ❌
- Métriques correctes: ✅ / ❌
- Graphiques rendus: ✅ / ❌
- Tables remplies: ✅ / ❌
- Pas d'erreurs console: ✅ / ❌
- Apollo cache OK: ✅ / ❌

Performance:
- Backend response time: _____ms
- Frontend load time: _____ms
- Requests per second: _____

Notes / Bugs:
___________________________________________
___________________________________________
```

---

## 🎊 Conclusion

Si tous les tests passent : **✅ L'intégration GraphQL Statistics est complète et fonctionnelle !**

Le frontend et le backend sont maintenant **100% alignés** pour les statistiques du dashboard.

---

**Dernière mise à jour :** 2024
**Version :** 1.0.0