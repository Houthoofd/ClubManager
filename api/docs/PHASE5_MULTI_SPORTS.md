# 🏆 PHASE 5 : SYSTÈME MULTI-SPORTS

## 📋 Vue d'ensemble

La Phase 5 transforme ClubManager en une **plateforme 100% flexible** pour clubs multi-disciplines. Le système n'est plus limité au karaté - vous pouvez maintenant gérer n'importe quel sport de combat ou art martial !

---

## ✨ Fonctionnalités ajoutées

### 1. **Gestion des Sports** 🥋🥊🤼
- Créez autant de sports/disciplines que vous voulez
- Chaque sport a ses propres paramètres (couleur, icône, âge min/max)
- Activation/désactivation dynamique des sports

### 2. **Grades/Ceintures par Sport** 🎖️
- Chaque sport peut avoir son propre système de grades
- Historique complet des passages de grades
- Support pour sports sans système de ceintures (boxe, etc.)

### 3. **Utilisateurs Multi-Sports** 👥
- Un membre peut pratiquer plusieurs disciplines
- Sport principal vs sports secondaires
- Historique détaillé par sport

### 4. **Cours par Sport** 📚
- Cours liés à un sport spécifique
- Types de cours personnalisables par sport
- Planning multi-disciplines

### 5. **Équipements par Sport** 🥋👕
- Liste des équipements requis/recommandés
- Équipements obligatoires vs optionnels
- Liens avec les catégories d'articles

### 6. **Règles de Compétition** 🏅
- Règles personnalisées par sport
- Types : scoring, temps, sécurité, équipement
- Configuration flexible

### 7. **Statistiques par Sport** 📊
- Nombre de pratiquants par sport
- Revenus générés par discipline
- Heures de pratique, compétitions, etc.

---

## 🗄️ Tables créées

### Tables principales
1. **`sports`** - Liste des sports/disciplines
2. **`sport_configurations`** - Paramètres personnalisés par sport
3. **`user_sports`** - Liaison utilisateurs ↔ sports (many-to-many)
4. **`user_grade_history`** - Historique des passages de grades
5. **`sport_equipment`** - Équipements requis par sport
6. **`sport_competition_rules`** - Règles de compétition
7. **`sport_statistics`** - Statistiques par sport et membre

### Colonnes ajoutées
- `sport_id` ajouté à :
  - `grades` (ceintures par sport)
  - `cours` (cours par sport)
  - `course_types` (types de cours par sport)
  - `categories` (catégories d'articles par sport)
  - `events` (si la table existe - événements par sport)

---

## 📊 Modèle de données

### Sport
```prisma
model Sport {
  id                 Int      @id @default(autoincrement())
  code               String   @unique // karate, judo, taekwondo, bjj, boxe
  name               String   // "Karaté", "Judo", etc.
  description        String?
  color              String   @default("#3B82F6") // Couleur hex
  icon               String?  // Nom de l'icône
  is_active          Boolean  @default(true)
  display_order      Int      @default(0)
  requires_belt      Boolean  @default(true) // Si le sport utilise des ceintures
  allow_competitions Boolean  @default(true)
  min_age            Int?
  max_age            Int?
  
  // Relations
  configurations     SportConfiguration[]
  user_sports        UserSport[]
  grades             grades[]
  courses            cours[]
  course_types       CourseType[]
  categories         categories[]
  equipment          SportEquipment[]
  competition_rules  SportCompetitionRule[]
  statistics         SportStatistic[]
}
```

### UserSport (Many-to-Many)
```prisma
model UserSport {
  id               Int       @id
  user_id          Int
  sport_id         Int
  current_grade_id Int?      // Grade actuel dans ce sport
  started_at       DateTime? // Date de début de pratique
  is_primary       Boolean   @default(false) // Sport principal
  is_active        Boolean   @default(true)
  notes            String?
  
  user          utilisateurs @relation(...)
  sport         Sport        @relation(...)
  current_grade grades?      @relation(...)
}
```

### Historique des Grades
```prisma
model UserGradeHistory {
  id                 Int      @id
  user_id            Int
  sport_id           Int
  grade_id           Int
  obtained_at        DateTime // Date d'obtention
  examiner_id        Int?     // Professeur/examinateur
  location           String?  // Lieu de l'examen
  certificate_number String?  // Numéro de diplôme
  notes              String?
}
```

---

## 🚀 Installation

### 1. **Dry Run (Recommandé)**
```bash
cd api
node scripts/migrate-phase5.js
```
Ceci vérifie que tout est prêt **sans modifier la DB**.

### 2. **Backup**
```bash
mysqldump -u root -p club_manager > backup_before_phase5.sql
```

### 3. **Exécution de la migration**
```bash
node scripts/migrate-phase5.js --execute
```

### 4. **Génération du client Prisma**
```bash
cd api
npx prisma generate
```

---

## 📝 Données initiales

La migration crée automatiquement le sport **"Karaté"** et :
- ✅ Lie tous les grades existants au karaté
- ✅ Lie tous les cours existants au karaté
- ✅ Crée des `user_sports` pour tous les utilisateurs actuels
- ✅ Configure les équipements par défaut (kimono, protections, etc.)
- ✅ Ajoute les règles de compétition WKF

---

## 🎨 Ajouter d'autres sports

### Via SQL
```sql
INSERT INTO sports (code, name, description, color, icon, min_age, requires_belt)
VALUES ('judo', 'Judo', 'Art martial japonais basé sur les projections', '#2563EB', 'users', 4, TRUE);
```

### Via le script
```bash
node scripts/migrate-phase5.js --add-samples
```
Ceci ajoute automatiquement :
- 🥋 Judo
- 🦵 Taekwondo
- 🥊 Boxe
- 🤼 Jujitsu Brésilien

### Via l'application (à implémenter)
```typescript
// api/src/services/sportService.js
async createSport(data) {
  return await prisma.sport.create({
    data: {
      code: 'muay-thai',
      name: 'Muay Thai',
      description: 'Art martial thaïlandais - Boxe thaï',
      color: '#DC2626',
      icon: 'zap',
      min_age: 10,
      requires_belt: false,
      allow_competitions: true
    }
  });
}
```

---

## 🔍 Requêtes utiles

### Lister tous les sports actifs
```sql
SELECT * FROM v_sports_summary;
```
Cette vue retourne :
- Nom du sport
- Nombre de pratiquants
- Nombre de cours
- Nombre de grades/ceintures

### Sports pratiqués par un utilisateur
```sql
SELECT * FROM v_user_sports_details WHERE user_id = 123;
```

### Membres pratiquant plusieurs sports
```sql
SELECT 
  u.nom, 
  u.prenom,
  COUNT(us.sport_id) as nb_sports,
  GROUP_CONCAT(s.name) as sports
FROM utilisateurs u
JOIN user_sports us ON u.id = us.user_id
JOIN sports s ON us.sport_id = s.id
WHERE us.is_active = TRUE
GROUP BY u.id
HAVING COUNT(us.sport_id) > 1;
```

### Historique des grades d'un membre
```sql
SELECT 
  ugh.obtained_at,
  s.name as sport,
  g.nom as grade,
  CONCAT(e.prenom, ' ', e.nom) as examiner
FROM user_grade_history ugh
JOIN sports s ON ugh.sport_id = s.id
JOIN grades g ON ugh.grade_id = g.id
LEFT JOIN utilisateurs e ON ugh.examiner_id = e.id
WHERE ugh.user_id = 123
ORDER BY ugh.obtained_at DESC;
```

---

## 🎯 Exemples d'utilisation

### 1. Inscrire un membre à un nouveau sport
```typescript
// L'utilisateur veut aussi pratiquer le Judo
const judoId = await prisma.sport.findUnique({
  where: { code: 'judo' }
});

await prisma.userSport.create({
  data: {
    user_id: userId,
    sport_id: judoId.id,
    is_primary: false, // Sport secondaire
    is_active: true,
    started_at: new Date()
  }
});
```

### 2. Enregistrer un passage de grade
```typescript
await prisma.userGradeHistory.create({
  data: {
    user_id: userId,
    sport_id: karateId,
    grade_id: ceintureBleueId,
    obtained_at: new Date('2024-03-15'),
    examiner_id: professeurId,
    location: 'Dojo principal',
    certificate_number: 'FFK-2024-12345'
  }
});

// Mettre à jour le grade actuel
await prisma.userSport.update({
  where: { 
    user_id_sport_id: { 
      user_id: userId, 
      sport_id: karateId 
    }
  },
  data: { current_grade_id: ceintureBleueId }
});
```

### 3. Créer un cours multi-sports
```typescript
// Cours de karaté le lundi
await prisma.cours.create({
  data: {
    sport_id: karateId,
    date_cours: '2024-03-18',
    type_cours: 'kata',
    heure_debut: '18:00',
    heure_fin: '19:30',
    cours_recurrent_id: recurrentId
  }
});

// Cours de judo le mercredi
await prisma.cours.create({
  data: {
    sport_id: judoId,
    date_cours: '2024-03-20',
    type_cours: 'technique',
    heure_debut: '18:00',
    heure_fin: '19:30',
    cours_recurrent_id: recurrentId
  }
});
```

### 4. Statistiques par sport
```typescript
const stats = await prisma.sportStatistic.findMany({
  where: {
    stat_date: {
      gte: new Date('2024-01-01'),
      lte: new Date('2024-12-31')
    }
  },
  include: { sport: true }
});

// Agrégation par sport
const sportRevenue = stats.reduce((acc, stat) => {
  acc[stat.sport.name] = (acc[stat.sport.name] || 0) + Number(stat.total_revenue);
  return acc;
}, {});
```

---

## 🔧 Configuration par sport

### Exemples de configurations
```typescript
// Pour le Karaté
await prisma.sportConfiguration.createMany({
  data: [
    {
      sport_id: karateId,
      config_key: 'federation',
      config_value: 'FFK',
      data_type: 'string',
      is_public: true
    },
    {
      sport_id: karateId,
      config_key: 'competition_categories',
      config_value: JSON.stringify(['kumite', 'kata']),
      data_type: 'json',
      is_public: true
    },
    {
      sport_id: karateId,
      config_key: 'session_duration',
      config_value: '60',
      data_type: 'number',
      is_public: false
    }
  ]
});

// Pour la Boxe (pas de ceintures)
await prisma.sportConfiguration.create({
  data: {
    sport_id: boxeId,
    config_key: 'weight_categories',
    config_value: JSON.stringify([
      'poids mouche (-52kg)',
      'poids coq (-56kg)',
      'poids léger (-60kg)',
      // etc.
    ]),
    data_type: 'json',
    is_public: true
  }
});
```

---

## 🎨 Interface utilisateur

### Affichage des sports
```typescript
// Récupérer tous les sports actifs avec leurs stats
const sports = await prisma.sport.findMany({
  where: { is_active: true },
  include: {
    _count: {
      select: {
        user_sports: { where: { is_active: true } },
        courses: true,
        grades: true
      }
    }
  },
  orderBy: { display_order: 'asc' }
});

// Affichage avec badges colorés
sports.forEach(sport => {
  console.log(`
    🎨 ${sport.name} (${sport.code})
    Couleur: ${sport.color}
    👥 ${sport._count.user_sports} pratiquants
    📚 ${sport._count.courses} cours
    🥋 ${sport._count.grades} grades
  `);
});
```

### Sélecteur de sport pour un utilisateur
```typescript
// Sports disponibles pour inscription
const availableSports = await prisma.sport.findMany({
  where: {
    is_active: true,
    NOT: {
      user_sports: {
        some: {
          user_id: currentUserId,
          is_active: true
        }
      }
    }
  }
});
```

---

## 📈 Vues et rapports

### Vue des sports (déjà créée)
```sql
CREATE OR REPLACE VIEW v_sports_summary AS
SELECT
  s.id,
  s.code,
  s.name,
  s.color,
  COUNT(DISTINCT us.user_id) as total_members,
  COUNT(DISTINCT c.id) as total_courses,
  COUNT(DISTINCT g.id) as total_grades
FROM sports s
LEFT JOIN user_sports us ON s.id = us.sport_id AND us.is_active = TRUE
LEFT JOIN cours c ON s.id = c.sport_id
LEFT JOIN grades g ON s.id = g.sport_id
GROUP BY s.id;
```

### Dashboard multi-sports
```typescript
const dashboard = await prisma.$queryRaw`
  SELECT 
    s.name,
    s.color,
    COUNT(DISTINCT us.user_id) as members,
    COUNT(DISTINCT c.id) as courses_this_month,
    COALESCE(SUM(ss.total_revenue), 0) as revenue_this_month
  FROM sports s
  LEFT JOIN user_sports us ON s.id = us.sport_id AND us.is_active = TRUE
  LEFT JOIN cours c ON s.id = c.sport_id 
    AND MONTH(c.date_cours) = MONTH(CURRENT_DATE)
    AND YEAR(c.date_cours) = YEAR(CURRENT_DATE)
  LEFT JOIN sport_statistics ss ON s.id = ss.sport_id
    AND MONTH(ss.stat_date) = MONTH(CURRENT_DATE)
    AND YEAR(ss.stat_date) = YEAR(CURRENT_DATE)
  WHERE s.is_active = TRUE
  GROUP BY s.id, s.name, s.color
  ORDER BY members DESC
`;
```

---

## 🔒 Permissions et sécurité

### Rôles par sport
```typescript
// Un utilisateur peut avoir des rôles différents selon le sport
// Exemple : professeur de karaté mais élève de judo

// Table à créer (optionnel) :
// user_sport_roles (user_id, sport_id, role_id)

// Pour l'instant, utilisez user_sports.notes ou créez une config
await prisma.userSport.update({
  where: { 
    user_id_sport_id: { user_id: userId, sport_id: karateId }
  },
  data: {
    notes: JSON.stringify({
      role: 'instructor',
      certified_since: '2020-01-15',
      specializations: ['kata', 'kumite']
    })
  }
});
```

---

## 🧪 Tests

### Test de création de sport
```javascript
describe('Sport Management', () => {
  it('should create a new sport', async () => {
    const sport = await prisma.sport.create({
      data: {
        code: 'test-sport',
        name: 'Test Sport',
        color: '#FF0000',
        is_active: true
      }
    });
    
    expect(sport.code).toBe('test-sport');
    expect(sport.name).toBe('Test Sport');
  });

  it('should link user to sport', async () => {
    const userSport = await prisma.userSport.create({
      data: {
        user_id: testUserId,
        sport_id: testSportId,
        is_primary: false,
        is_active: true
      }
    });
    
    expect(userSport.user_id).toBe(testUserId);
  });

  it('should record grade history', async () => {
    const history = await prisma.userGradeHistory.create({
      data: {
        user_id: testUserId,
        sport_id: testSportId,
        grade_id: testGradeId,
        obtained_at: new Date()
      }
    });
    
    expect(history).toBeDefined();
  });
});
```

---

## 🐛 Troubleshooting

### Problème : sport_id NULL dans les tables existantes
```sql
-- Vérifier les données non liées
SELECT COUNT(*) FROM grades WHERE sport_id IS NULL;
SELECT COUNT(*) FROM cours WHERE sport_id IS NULL;

-- Si nécessaire, lier au sport par défaut (karaté)
UPDATE grades SET sport_id = (SELECT id FROM sports WHERE code = 'karate')
WHERE sport_id IS NULL;
```

### Problème : Prisma ne trouve pas les nouveaux modèles
```bash
cd api
npx prisma generate --force
```

### Problème : Contraintes de foreign key
```sql
-- Vérifier l'intégrité
SELECT g.id, g.grade_id, g.sport_id
FROM grades g
LEFT JOIN sports s ON g.sport_id = s.id
WHERE g.sport_id IS NOT NULL AND s.id IS NULL;
```

---

## 📋 Checklist de migration

- [ ] Backup de la base de données
- [ ] Dry run de la migration (sans --execute)
- [ ] Vérification des pré-requis (tables existantes)
- [ ] Exécution de la migration réelle
- [ ] Vérification des données migrées (sport karaté créé)
- [ ] Vérification des liens (user_sports, grades, cours)
- [ ] Génération du client Prisma
- [ ] Tests des nouvelles fonctionnalités
- [ ] Mise à jour du code applicatif

---

## 🎯 Prochaines étapes

1. **Créer un service `SportService`**
   ```typescript
   // api/src/services/sportService.js
   class SportService {
     async getAllSports() { ... }
     async createSport(data) { ... }
     async updateSport(id, data) { ... }
     async deleteSport(id) { ... }
     async getSportStatistics(sportId) { ... }
   }
   ```

2. **Créer un service `UserSportService`**
   ```typescript
   // api/src/services/userSportService.js
   class UserSportService {
     async enrollUserInSport(userId, sportId) { ... }
     async getUserSports(userId) { ... }
     async recordGradeChange(userId, sportId, gradeId) { ... }
   }
   ```

3. **Mettre à jour les routes API**
   ```typescript
   // GET /api/sports - Liste des sports
   // POST /api/sports - Créer un sport
   // GET /api/sports/:id - Détails d'un sport
   // PUT /api/sports/:id - Modifier un sport
   // GET /api/sports/:id/members - Membres pratiquant ce sport
   // GET /api/sports/:id/statistics - Stats du sport
   
   // POST /api/users/:id/sports - Inscrire à un sport
   // GET /api/users/:id/sports - Sports de l'utilisateur
   // DELETE /api/users/:id/sports/:sportId - Désinscrire
   ```

4. **Créer l'interface admin**
   - Page de gestion des sports
   - Configuration par sport
   - Statistiques multi-sports
   - Tableau de bord comparatif

5. **Mettre à jour les formulaires**
   - Sélecteur de sport sur inscription cours
   - Sélecteur de sport sur profil utilisateur
   - Filtres par sport dans les listes

---

## 📚 Ressources

- SQL de migration : `api/prisma/migrations/20250220_phase5_multi_sports.sql`
- Script de migration : `api/scripts/migrate-phase5.js`
- Schema Prisma : `api/prisma/schema.prisma` (modèles Sport, UserSport, etc.)

---

## ✅ Résumé

**Avant Phase 5** : 
- ❌ Système mono-sport (karaté hardcodé)
- ❌ Grades non liés à un sport
- ❌ Impossible de gérer plusieurs disciplines

**Après Phase 5** :
- ✅ Système multi-sports complètement flexible
- ✅ Chaque sport a ses propres grades/ceintures
- ✅ Membres peuvent pratiquer plusieurs disciplines
- ✅ Statistiques et reporting par sport
- ✅ Configuration personnalisée par sport
- ✅ Équipements et règles spécifiques

**Votre club peut maintenant gérer n'importe quelle combinaison de sports !** 🎉