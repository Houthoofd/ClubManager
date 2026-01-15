# 🏗️ Template d'Architecture Modulaire - ClubManager

## 📋 Structure Standard pour tous les modules

```
module-name/
├── docs/                          # Documentation
│   ├── ARCHITECTURE.md           # Architecture du module
│   ├── CHANGELOG.md             # Historique des changements
│   ├── MIGRATION_GUIDE.md       # Guide de migration
│   └── API_REFERENCE.md         # Référence API
│
├── queries/                      # Requêtes SQL par responsabilité
│   ├── read.queries.ts          # SELECT uniquement
│   ├── write.queries.ts         # INSERT, UPDATE, DELETE
│   ├── relations.queries.ts     # JOINs complexes
│   ├── search.queries.ts        # Recherches avec filtres
│   ├── validation.queries.ts    # Vérifications d'existence
│   └── index.ts                # Exports centralisés
│
├── repositories/                # Couche d'accès aux données
│   ├── read.repository.ts       # Repository lecture
│   ├── write.repository.ts      # Repository écriture
│   ├── relations.repository.ts  # Repository relations
│   ├── search.repository.ts     # Repository recherche
│   └── validation.repository.ts # Repository validation
│
├── utils/                       # Utilitaires spécifiques
│   ├── parsing.utils.ts         # Parsing des données DB
│   ├── validation.utils.ts      # Validations métier
│   └── index.ts                # Exports utils
│
├── services/                    # Services métier (optionnel)
│   └── module-name.service.ts   # Facade pour opérations complexes
│
├── __tests__/                   # Tests unitaires
│   ├── repositories/           # Tests repositories
│   ├── queries/                # Tests queries
│   └── utils/                  # Tests utilitaires
│
├── types.ts                     # Types TypeScript du module
├── index.ts                     # Point d'entrée principal
└── module-name.repository.ts    # Repository principal (legacy)
```

## 🎯 Principes d'Architecture

### 1. **Séparation des Responsabilités**
- **Queries** : SQL pur, organisé par type d'opération
- **Repositories** : Accès données + mapping objets
- **Utils** : Fonctions utilitaires réutilisables
- **Services** : Logique métier complexe

### 2. **Convention de Nommage**
```typescript
// Fichiers
module-name.repository.ts
read.queries.ts
parsing.utils.ts

// Classes
export class ModuleNameRepository
export class ModuleNameReadRepository
export class ModuleNameService

// Fonctions
export const SELECT_ITEM_BY_ID = `...`
export function parseItemRow(row: ItemRow): Item
```

### 3. **Types et Interfaces**
```typescript
// types.ts
export interface Item {
  id: string;
  name: string;
  // ...propriétés métier
}

export interface ItemRow {
  id: string | number;
  name: string;
  // ...propriétés DB brutes
}

export interface ItemWithRelations extends Item {
  relations: RelatedItem[];
}
```

### 4. **Structure des Queries**
```typescript
// read.queries.ts
export const SELECT_ITEM_BY_ID = `
  SELECT * FROM items 
  WHERE id = ?
`;

export const SELECT_ITEMS_ACTIVE = `
  SELECT * FROM items 
  WHERE status = 'active'
  ORDER BY created_at DESC
`;

// write.queries.ts
export const INSERT_ITEM = `
  INSERT INTO items (name, description, status)
  VALUES (?, ?, ?)
`;

export const UPDATE_ITEM = `
  UPDATE items 
  SET name = ?, description = ?, updated_at = NOW()
  WHERE id = ?
`;
```

### 5. **Structure des Repositories**
```typescript
// read.repository.ts
export class ModuleNameReadRepository {
  private mysql = MysqlConnector.getInstance();

  async findById(id: string): Promise<Item | null> {
    const rows = await this.mysql.query(queries.SELECT_ITEM_BY_ID, [id]);
    return rows.length > 0 ? parseItemRow(rows[0]) : null;
  }
}
```

## 🚀 Checklist de Refactorisation

### Phase 1 : Préparation
- [ ] Créer la structure de dossiers
- [ ] Définir les types TypeScript
- [ ] Identifier les responsabilités

### Phase 2 : Migration des Queries
- [ ] Extraire les SELECT vers read.queries.ts
- [ ] Extraire les INSERT/UPDATE vers write.queries.ts
- [ ] Extraire les JOIN vers relations.queries.ts
- [ ] Créer search.queries.ts si nécessaire

### Phase 3 : Repositories
- [ ] Créer ReadRepository
- [ ] Créer WriteRepository
- [ ] Migrer la logique existante
- [ ] Créer les utils de parsing

### Phase 4 : Tests & Documentation
- [ ] Écrire tests unitaires
- [ ] Documenter l'API
- [ ] Créer guide de migration
- [ ] Valider avec le repository legacy

### Phase 5 : Intégration
- [ ] Mettre à jour les importations
- [ ] Valider avec les tests d'intégration
- [ ] Mettre à jour la documentation

## 📝 Exemple Complet

Voir le module `compte/` comme référence d'implémentation complète.