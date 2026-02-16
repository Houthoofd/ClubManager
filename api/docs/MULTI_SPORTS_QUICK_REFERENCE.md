# 🏆 MULTI-SPORTS SYSTEM - Référence rapide développeur

## 🎯 Modèles principaux

### Sport
```typescript
{
  id: number
  code: string              // 'karate', 'judo', 'bjj', etc.
  name: string              // 'Karaté', 'Judo', etc.
  description: string
  color: string             // Hex color '#DC2626'
  icon: string              // Lucide icon name
  is_active: boolean
  display_order: number
  requires_belt: boolean    // Si le sport utilise des ceintures
  allow_competitions: boolean
  min_age: number
  max_age: number
  created_at: DateTime
  updated_at: DateTime
}
```

### UserSport (Many-to-Many)
```typescript
{
  id: number
  user_id: number
  sport_id: number
  current_grade_id: number  // Grade actuel dans ce sport
  started_at: Date
  is_primary: boolean       // Sport principal de l'utilisateur
  is_active: boolean
  notes: string
  created_at: DateTime
  updated_at: DateTime
}
```

---

## 📝 Requêtes courantes

### Lister tous les sports actifs
```typescript
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
```

### Sports d'un utilisateur
```typescript
const userSports = await prisma.userSport.findMany({
  where: {
    user_id: userId,
    is_active: true
  },
  include: {
    sport: true,
    current_grade: true
  }
});
```

### Membres d'un sport
```typescript
const members = await prisma.userSport.findMany({
  where: {
    sport_id: sportId,
    is_active: true
  },
  include: {
    user: {
      include: {
        user_profiles: true
      }
    },
    current_grade: true
  }
});
```

### Créer un nouveau sport
```typescript
const sport = await prisma.sport.create({
  data: {
    code: 'judo',
    name: 'Judo',
    description: 'Art martial japonais basé sur les projections',
    color: '#2563EB',
    icon: 'users',
    min_age: 4,
    requires_belt: true,
    allow_competitions: true,
    is_active: true,
    display_order: 2
  }
});
```

### Inscrire un utilisateur à un sport
```typescript
const userSport = await prisma.userSport.create({
  data: {
    user_id: userId,
    sport_id: sportId,
    is_primary: false,
    is_active: true,
    started_at: new Date()
  }
});
```

### Enregistrer un passage de grade
```typescript
// 1. Créer l'historique
const history = await prisma.userGradeHistory.create({
  data: {
    user_id: userId,
    sport_id: sportId,
    grade_id: newGradeId,
    obtained_at: new Date(),
    examiner_id: professorId,
    location: 'Dojo principal',
    certificate_number: 'FFK-2024-12345'
  }
});

// 2. Mettre à jour le grade actuel
await prisma.userSport.update({
  where: {
    user_id_sport_id: { user_id: userId, sport_id: sportId }
  },
  data: { current_grade_id: newGradeId }
});
```

### Cours par sport
```typescript
const courses = await prisma.cours.findMany({
  where: {
    sport_id: sportId,
    date_cours: {
      gte: new Date('2024-01-01'),
      lte: new Date('2024-12-31')
    }
  },
  include: {
    sport: true,
    cours_recurrent: true
  }
});
```

### Équipements d'un sport
```typescript
const equipment = await prisma.sportEquipment.findMany({
  where: { sport_id: sportId },
  orderBy: { display_order: 'asc' }
});
```

### Règles de compétition
```typescript
const rules = await prisma.sportCompetitionRule.findMany({
  where: {
    sport_id: sportId,
    is_active: true
  },
  orderBy: { display_order: 'asc' }
});
```

### Configurations d'un sport
```typescript
const configs = await prisma.sportConfiguration.findMany({
  where: {
    sport_id: sportId,
    is_public: true
  }
});

// Récupérer une config spécifique
const config = await prisma.sportConfiguration.findUnique({
  where: {
    sport_id_config_key: {
      sport_id: sportId,
      config_key: 'federation'
    }
  }
});
```

---

## 🔧 Services à créer

### SportService
```typescript
class SportService {
  async getAllSports(activeOnly = true) {
    return await prisma.sport.findMany({
      where: activeOnly ? { is_active: true } : undefined,
      orderBy: { display_order: 'asc' }
    });
  }

  async getSportById(id) {
    return await prisma.sport.findUnique({
      where: { id },
      include: {
        configurations: true,
        equipment: true,
        competition_rules: { where: { is_active: true } },
        _count: {
          select: {
            user_sports: { where: { is_active: true } },
            courses: true,
            grades: true
          }
        }
      }
    });
  }

  async createSport(data) {
    return await prisma.sport.create({ data });
  }

  async updateSport(id, data) {
    return await prisma.sport.update({
      where: { id },
      data
    });
  }

  async deleteSport(id) {
    // Soft delete ou hard delete selon les besoins
    return await prisma.sport.update({
      where: { id },
      data: { is_active: false }
    });
  }

  async getSportStatistics(sportId, startDate, endDate) {
    return await prisma.sportStatistic.findMany({
      where: {
        sport_id: sportId,
        stat_date: {
          gte: startDate,
          lte: endDate
        }
      }
    });
  }
}
```

### UserSportService
```typescript
class UserSportService {
  async enrollUserInSport(userId, sportId, isPrimary = false) {
    return await prisma.userSport.create({
      data: {
        user_id: userId,
        sport_id: sportId,
        is_primary: isPrimary,
        is_active: true,
        started_at: new Date()
      }
    });
  }

  async getUserSports(userId) {
    return await prisma.userSport.findMany({
      where: {
        user_id: userId,
        is_active: true
      },
      include: {
        sport: true,
        current_grade: true
      }
    });
  }

  async setPrimarySport(userId, sportId) {
    // Désactiver l'ancien sport principal
    await prisma.userSport.updateMany({
      where: {
        user_id: userId,
        is_primary: true
      },
      data: { is_primary: false }
    });

    // Activer le nouveau sport principal
    return await prisma.userSport.update({
      where: {
        user_id_sport_id: { user_id: userId, sport_id: sportId }
      },
      data: { is_primary: true }
    });
  }

  async recordGradeChange(userId, sportId, gradeId, examinerData = {}) {
    // Créer l'historique
    await prisma.userGradeHistory.create({
      data: {
        user_id: userId,
        sport_id: sportId,
        grade_id: gradeId,
        obtained_at: examinerData.obtained_at || new Date(),
        examiner_id: examinerData.examiner_id,
        location: examinerData.location,
        certificate_number: examinerData.certificate_number,
        notes: examinerData.notes
      }
    });

    // Mettre à jour le grade actuel
    return await prisma.userSport.update({
      where: {
        user_id_sport_id: { user_id: userId, sport_id: sportId }
      },
      data: { current_grade_id: gradeId }
    });
  }

  async getGradeHistory(userId, sportId) {
    return await prisma.userGradeHistory.findMany({
      where: {
        user_id: userId,
        sport_id: sportId
      },
      include: {
        grade: true,
        examiner: true
      },
      orderBy: { obtained_at: 'desc' }
    });
  }

  async unenrollFromSport(userId, sportId) {
    return await prisma.userSport.update({
      where: {
        user_id_sport_id: { user_id: userId, sport_id: sportId }
      },
      data: { is_active: false }
    });
  }
}
```

---

## 🛣️ Routes API suggérées

### Sports
```typescript
// GET /api/sports
// Lister tous les sports actifs
router.get('/sports', sportController.getAll);

// GET /api/sports/:id
// Détails d'un sport
router.get('/sports/:id', sportController.getById);

// POST /api/sports
// Créer un sport (admin)
router.post('/sports', authMiddleware, adminOnly, sportController.create);

// PUT /api/sports/:id
// Modifier un sport (admin)
router.put('/sports/:id', authMiddleware, adminOnly, sportController.update);

// DELETE /api/sports/:id
// Supprimer un sport (admin)
router.delete('/sports/:id', authMiddleware, adminOnly, sportController.delete);

// GET /api/sports/:id/members
// Membres pratiquant ce sport
router.get('/sports/:id/members', sportController.getMembers);

// GET /api/sports/:id/courses
// Cours de ce sport
router.get('/sports/:id/courses', sportController.getCourses);

// GET /api/sports/:id/statistics
// Statistiques du sport
router.get('/sports/:id/statistics', sportController.getStatistics);

// GET /api/sports/:id/equipment
// Équipements requis
router.get('/sports/:id/equipment', sportController.getEquipment);

// GET /api/sports/:id/rules
// Règles de compétition
router.get('/sports/:id/rules', sportController.getRules);
```

### User Sports
```typescript
// GET /api/users/:userId/sports
// Sports pratiqués par l'utilisateur
router.get('/users/:userId/sports', userSportController.getUserSports);

// POST /api/users/:userId/sports
// Inscrire l'utilisateur à un sport
router.post('/users/:userId/sports', authMiddleware, userSportController.enroll);

// PUT /api/users/:userId/sports/:sportId/primary
// Définir comme sport principal
router.put('/users/:userId/sports/:sportId/primary', authMiddleware, userSportController.setPrimary);

// DELETE /api/users/:userId/sports/:sportId
// Désinscrire du sport
router.delete('/users/:userId/sports/:sportId', authMiddleware, userSportController.unenroll);

// GET /api/users/:userId/sports/:sportId/grades
// Historique des grades
router.get('/users/:userId/sports/:sportId/grades', userSportController.getGradeHistory);

// POST /api/users/:userId/sports/:sportId/grades
// Enregistrer un passage de grade
router.post('/users/:userId/sports/:sportId/grades', authMiddleware, instructorOnly, userSportController.recordGrade);
```

---

## 📊 Vues SQL utiles

### Vue sports avec stats
```sql
CREATE OR REPLACE VIEW v_sports_summary AS
SELECT
  s.id,
  s.code,
  s.name,
  s.color,
  s.icon,
  s.is_active,
  COUNT(DISTINCT us.user_id) as total_members,
  COUNT(DISTINCT c.id) as total_courses,
  COUNT(DISTINCT g.id) as total_grades,
  SUM(ss.total_revenue) as total_revenue
FROM sports s
LEFT JOIN user_sports us ON s.id = us.sport_id AND us.is_active = TRUE
LEFT JOIN cours c ON s.id = c.sport_id
LEFT JOIN grades g ON s.id = g.sport_id
LEFT JOIN sport_statistics ss ON s.id = ss.sport_id
GROUP BY s.id
ORDER BY s.display_order;
```

### Vue utilisateurs avec sports
```sql
CREATE OR REPLACE VIEW v_user_sports_details AS
SELECT
  u.id as user_id,
  u.nom,
  u.prenom,
  u.email,
  s.id as sport_id,
  s.code as sport_code,
  s.name as sport_name,
  s.color as sport_color,
  us.is_primary,
  us.is_active as practices_sport,
  g.nom as current_grade,
  us.started_at,
  us.notes
FROM utilisateurs u
INNER JOIN user_sports us ON u.id = us.user_id
INNER JOIN sports s ON us.sport_id = s.id
LEFT JOIN grades g ON us.current_grade_id = g.id
ORDER BY u.nom, u.prenom, us.is_primary DESC;
```

---

## 🎨 Composants Frontend (exemple React)

### SportSelector
```jsx
function SportSelector({ userId, onSportChange }) {
  const [sports, setSports] = useState([]);
  const [userSports, setUserSports] = useState([]);

  useEffect(() => {
    // Charger les sports disponibles
    fetchSports();
    // Charger les sports de l'utilisateur
    fetchUserSports(userId);
  }, [userId]);

  const handleEnroll = async (sportId) => {
    await api.post(`/api/users/${userId}/sports`, { sport_id: sportId });
    fetchUserSports(userId);
    onSportChange();
  };

  return (
    <div className="sport-selector">
      {sports.map(sport => (
        <SportCard
          key={sport.id}
          sport={sport}
          enrolled={userSports.some(us => us.sport_id === sport.id)}
          onEnroll={() => handleEnroll(sport.id)}
        />
      ))}
    </div>
  );
}
```

### SportBadge
```jsx
function SportBadge({ sport, showMembers = false }) {
  return (
    <div 
      className="sport-badge" 
      style={{ backgroundColor: sport.color }}
    >
      <Icon name={sport.icon} />
      <span>{sport.name}</span>
      {showMembers && <span className="badge">{sport.total_members}</span>}
    </div>
  );
}
```

### GradeHistory
```jsx
function GradeHistory({ userId, sportId }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch(`/api/users/${userId}/sports/${sportId}/grades`)
      .then(res => res.json())
      .then(setHistory);
  }, [userId, sportId]);

  return (
    <div className="grade-history">
      <h3>Historique des grades</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Grade</th>
            <th>Examinateur</th>
            <th>Lieu</th>
            <th>Certificat</th>
          </tr>
        </thead>
        <tbody>
          {history.map(record => (
            <tr key={record.id}>
              <td>{formatDate(record.obtained_at)}</td>
              <td>{record.grade.nom}</td>
              <td>{record.examiner?.nom}</td>
              <td>{record.location}</td>
              <td>{record.certificate_number}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 🧪 Tests

### Test création sport
```javascript
describe('Sport Management', () => {
  it('should create a new sport', async () => {
    const sport = await sportService.createSport({
      code: 'judo',
      name: 'Judo',
      color: '#2563EB',
      min_age: 4
    });

    expect(sport.code).toBe('judo');
    expect(sport.is_active).toBe(true);
  });

  it('should list active sports only', async () => {
    const sports = await sportService.getAllSports(true);
    
    sports.forEach(sport => {
      expect(sport.is_active).toBe(true);
    });
  });
});
```

### Test inscription utilisateur
```javascript
describe('User Sport Enrollment', () => {
  it('should enroll user in a sport', async () => {
    const enrollment = await userSportService.enrollUserInSport(
      testUserId,
      testSportId
    );

    expect(enrollment.user_id).toBe(testUserId);
    expect(enrollment.sport_id).toBe(testSportId);
    expect(enrollment.is_active).toBe(true);
  });

  it('should prevent duplicate enrollment', async () => {
    await expect(
      userSportService.enrollUserInSport(testUserId, testSportId)
    ).rejects.toThrow();
  });
});
```

---

## 🔍 Requêtes analytics

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
  LEFT JOIN sport_statistics ss ON s.id = ss.sport_id
    AND MONTH(ss.stat_date) = MONTH(CURRENT_DATE)
  WHERE s.is_active = TRUE
  GROUP BY s.id, s.name, s.color
  ORDER BY members DESC
`;
```

### Sport le plus populaire
```sql
SELECT 
  s.name,
  COUNT(us.user_id) as members
FROM sports s
JOIN user_sports us ON s.id = us.sport_id
WHERE us.is_active = TRUE
GROUP BY s.id
ORDER BY members DESC
LIMIT 1;
```

### Taux de rétention par sport
```sql
SELECT 
  s.name,
  COUNT(*) as total_enrollments,
  SUM(CASE WHEN us.is_active = TRUE THEN 1 ELSE 0 END) as active,
  ROUND(SUM(CASE WHEN us.is_active = TRUE THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as retention_rate
FROM sports s
JOIN user_sports us ON s.id = us.sport_id
GROUP BY s.id
ORDER BY retention_rate DESC;
```

---

## 📦 Types TypeScript

```typescript
// types/sport.ts
export interface Sport {
  id: number;
  code: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  is_active: boolean;
  display_order: number;
  requires_belt: boolean;
  allow_competitions: boolean;
  min_age?: number;
  max_age?: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserSport {
  id: number;
  user_id: number;
  sport_id: number;
  current_grade_id?: number;
  started_at?: Date;
  is_primary: boolean;
  is_active: boolean;
  notes?: string;
  sport?: Sport;
  current_grade?: Grade;
}

export interface SportConfiguration {
  id: number;
  sport_id: number;
  config_key: string;
  config_value?: string;
  data_type: 'string' | 'number' | 'boolean' | 'json' | 'text';
  description?: string;
  is_public: boolean;
}

export interface SportEquipment {
  id: number;
  sport_id: number;
  name: string;
  description?: string;
  is_mandatory: boolean;
  for_level: 'beginner' | 'intermediate' | 'advanced' | 'competition' | 'all';
  display_order: number;
}

export interface UserGradeHistory {
  id: number;
  user_id: number;
  sport_id: number;
  grade_id: number;
  obtained_at: Date;
  examiner_id?: number;
  location?: string;
  certificate_number?: string;
  notes?: string;
  grade?: Grade;
  examiner?: User;
}
```

---

## 🎯 Bonnes pratiques

### 1. Toujours vérifier is_active
```typescript
// ✅ BON
const sports = await prisma.sport.findMany({
  where: { is_active: true }
});

// ❌ MAUVAIS (affiche les sports désactivés)
const sports = await prisma.sport.findMany();
```

### 2. Utiliser les transactions pour les grades
```typescript
// ✅ BON
await prisma.$transaction(async (tx) => {
  await tx.userGradeHistory.create({ data: historyData });
  await tx.userSport.update({ where, data: { current_grade_id } });
});
```

### 3. Inclure les relations nécessaires
```typescript
// ✅ BON
const userSports = await prisma.userSport.findMany({
  include: { sport: true, current_grade: true }
});

// ❌ MAUVAIS (nécessite des requêtes supplémentaires)
const userSports = await prisma.userSport.findMany();
```

### 4. Valider les données avant insertion
```typescript
// ✅ BON
if (sportData.min_age && sportData.max_age) {
  if (sportData.min_age >= sportData.max_age) {
    throw new Error('min_age must be less than max_age');
  }
}
```

### 5. Gérer les sports multiples
```typescript
// Permettre à un user d'avoir plusieurs sports
// mais un seul sport principal (is_primary = true)
```

---

## 🔗 Ressources

- 📖 Documentation complète : `api/docs/PHASE5_MULTI_SPORTS.md`
- 🚀 Guide démarrage rapide : `PHASE5_MULTI_SPORTS_README.md`
- 📊 Vue d'ensemble : `DATABASE_EVOLUTION_OVERVIEW.md`
- 🗄️ Schema Prisma : `api/prisma/schema.prisma`
- 📁 Catalogue sports : `api/data/sports-catalog.json`

---

**Version** : 1.0  
**Dernière mise à jour** : 2024-02-20