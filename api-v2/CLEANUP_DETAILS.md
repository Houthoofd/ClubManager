# 🧹 Nettoyage Détaillé api-v2

## ❌ Ancienne Architecture (Supprimée)

### Routes (ancien système)
- `src/routes/` → Remplacé par `src/presentation/http/routes/`

### Services (ancien système)  
- `src/services/` → Remplacé par `src/core/use-cases/` + `src/infrastructure/`

### Validators (ancien système)
- `src/validators/` → Intégré dans `src/core/domain/`

### Scripts (anciens)
- `src/scripts/` → Scripts obsolètes

## ✅ Nouvelle Architecture Clean (Conservée)

```
src/
├── core/                      # Domain + Use Cases
│   ├── domain/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   └── interfaces/
│   └── use-cases/
├── infrastructure/            # Implémentations externes
│   ├── database/
│   └── ...
├── presentation/              # HTTP/API Layer
│   └── http/
│       ├── controllers/
│       └── routes/
├── clients/                   # Email, S3, etc.
├── middleware/                # Express middleware
├── shared/                    # Code partagé
├── templates/                 # Templates email
├── types/                     # Types TypeScript
└── utils/                     # Utilitaires
```

## 📊 Espace Libéré

- Prisma: ~5 MB
- GraphQL: ~1 MB  
- Public/uploads: ~50 MB
- Public/images: ~10 MB
- Scripts: ~2 MB
- Anciennes routes/services: ~15 MB
- Docs temporaires: ~1 MB

**Total: ~84 MB libérés** ✅
