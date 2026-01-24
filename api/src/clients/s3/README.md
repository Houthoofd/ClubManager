# Client S3 - Gestion des fichiers AWS S3

Module de gestion des fichiers sur AWS S3 avec traitement d'images.

## 📦 Installation

Les dépendances sont déjà installées :
- `@aws-sdk/client-s3` - Client AWS S3
- `@aws-sdk/s3-request-presigner` - Génération d'URLs signées
- `sharp` - Traitement d'images

## 🔧 Configuration

### Variables d'environnement

```env
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=clubmanager-files
```

### Initialisation

```typescript
import { s3Client, imageProcessor } from './clients/s3';

// Utiliser l'instance par défaut (singleton)
const result = await s3Client.upload({...});

// Ou créer une instance personnalisée
import { S3ClientManager } from './clients/s3';
const customClient = new S3ClientManager({
  region: 'us-east-1',
  accessKeyId: '...',
  secretAccessKey: '...',
  defaultBucket: 'my-bucket',
});
```

## 📚 Utilisation

### Upload de fichiers

```typescript
// Upload simple
const result = await s3Client.upload({
  bucket: 'clubmanager-files',
  key: 'profile-pictures/user-123.jpg',
  body: fileBuffer,
  contentType: 'image/jpeg',
  metadata: {
    userId: '123',
    uploadedBy: 'admin',
  },
  acl: 'private', // ou 'public-read'
  tags: {
    type: 'profile-picture',
    environment: 'production',
  },
});

if (result.success) {
  console.log('File uploaded:', result.location);
  console.log('ETag:', result.etag);
}
```

### Upload avec traitement d'image

```typescript
import { s3Client, imageProcessor } from './clients/s3';

// Traiter l'image avant upload
const processed = await imageProcessor.processImage(originalBuffer, {
  width: 800,
  height: 600,
  fit: 'cover',
  format: 'webp',
  quality: 85,
});

if (processed.success) {
  await s3Client.upload({
    bucket: s3Client.getDefaultBucket(),
    key: s3Client.generateKey('article-image', 456, 'product.webp'),
    body: processed.buffer!,
    contentType: 'image/webp',
  });
}
```

### Générer plusieurs variantes

```typescript
// Générer original + medium + thumbnail
const variants = await imageProcessor.generateVariants(imageBuffer);

// Upload de chaque variante
const baseKey = s3Client.generateKey('gallery', 789, 'event.jpg');

await Promise.all([
  s3Client.upload({
    bucket: s3Client.getDefaultBucket(),
    key: `${baseKey}-original.jpg`,
    body: variants.original.buffer!,
  }),
  s3Client.upload({
    bucket: s3Client.getDefaultBucket(),
    key: `${baseKey}-medium.jpg`,
    body: variants.medium.buffer!,
  }),
  s3Client.upload({
    bucket: s3Client.getDefaultBucket(),
    key: `${baseKey}-thumb.jpg`,
    body: variants.thumbnail.buffer!,
  }),
]);
```

### Récupérer des URLs

```typescript
// URL publique (fichiers avec ACL public-read)
const publicUrl = s3Client.getPublicUrl('clubmanager-files', 'public/logo.png');
// https://clubmanager-files.s3.eu-west-1.amazonaws.com/public/logo.png

// URL signée (fichiers privés)
const signedUrl = await s3Client.getSignedUrl({
  bucket: 'clubmanager-files',
  key: 'private/certificate-123.pdf',
  expiresIn: 3600, // 1 heure
});
// https://clubmanager-files.s3.eu-west-1.amazonaws.com/private/certificate-123.pdf?X-Amz-Algorithm=...
```

### Suppression de fichiers

```typescript
const deleteResult = await s3Client.delete({
  bucket: 'clubmanager-files',
  key: 'old-file.jpg',
});

if (deleteResult.success) {
  console.log('File deleted successfully');
}
```

### Lister des fichiers

```typescript
const files = await s3Client.listFiles({
  bucket: 'clubmanager-files',
  prefix: 'profile-pictures/',
  maxKeys: 100,
});

files.forEach(file => {
  console.log(`${file.key} - ${file.size} bytes - ${file.lastModified}`);
});
```

### Vérifier l'existence d'un fichier

```typescript
const exists = await s3Client.fileExists('clubmanager-files', 'path/to/file.jpg');
if (exists) {
  console.log('File exists!');
}
```

## 🖼️ Traitement d'images

### Options disponibles

```typescript
interface ImageProcessOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  quality?: number; // 1-100
  grayscale?: boolean;
  blur?: number;
}
```

### Exemples

```typescript
// Créer une vignette
const thumb = await imageProcessor.createThumbnail(buffer, 200, 200);

// Optimiser pour le web
const optimized = await imageProcessor.optimizeForWeb(buffer, 1920, 1080);

// Conversion de format
const webp = await imageProcessor.processImage(buffer, {
  format: 'webp',
  quality: 85,
});

// Appliquer des effets
const grayscale = await imageProcessor.processImage(buffer, {
  grayscale: true,
  blur: 5,
});
```

## 📁 Structure des dossiers S3

Organisation recommandée :

```
clubmanager-files/
├── profile-pictures/
│   ├── user-123/
│   │   ├── 1706102400000-abc123-avatar.jpg
│   │   └── 1706102400000-abc123-avatar-thumb.jpg
├── article-images/
│   ├── article-456/
│   │   ├── 1706102400000-def456-product-original.webp
│   │   ├── 1706102400000-def456-product-medium.webp
│   │   └── 1706102400000-def456-product-thumb.webp
├── certificates/
│   └── user-789/
│       └── 1706102400000-ghi789-medical-cert.pdf
├── documents/
└── gallery/
    └── event-2026/
```

## 🔑 Génération de clés

```typescript
// Génération automatique avec timestamp + random
const key1 = s3Client.generateKey('profile-picture', 123, 'avatar.jpg');
// profile-picture/user-123/1706102400000-abc123-avatar.jpg

const key2 = s3Client.generateKey('document', 456, 'My File (copy).pdf');
// document/user-456/1706102400000-def456-My_File__copy_.pdf

// Sans userId
const key3 = s3Client.generateKey('gallery');
// gallery/1706102400000-ghi789-file
```

## 🧪 Tests

```bash
# Tests unitaires
npm run test:windows -- --testPathPattern=s3-client
npm run test:windows -- --testPathPattern=image-processor

# Tests d'intégration (nécessite credentials AWS)
# Décommenter les tests dans __tests__/s3-client.test.ts
npm run test:windows -- --testPathPattern=s3-client
```

## 📊 Résultats des tests

- **s3-client.test.ts**: 10 tests passent, 5 tests d'intégration skippés
- **image-processor.test.ts**: 14 tests passent
- **Total**: 24 tests unitaires ✅

## 💡 Cas d'usage ClubManager

### 1. Photo de profil

```typescript
async function uploadProfilePicture(userId: number, imageBuffer: Buffer) {
  // Créer thumbnail et optimiser
  const [optimized, thumbnail] = await Promise.all([
    imageProcessor.optimizeForWeb(imageBuffer, 800, 800),
    imageProcessor.createThumbnail(imageBuffer, 150, 150),
  ]);

  const bucket = s3Client.getDefaultBucket();
  
  // Upload les deux versions
  const [mainResult, thumbResult] = await Promise.all([
    s3Client.upload({
      bucket,
      key: s3Client.generateKey('profile-picture', userId, 'profile.webp'),
      body: optimized.buffer!,
      contentType: 'image/webp',
      acl: 'public-read',
    }),
    s3Client.upload({
      bucket,
      key: s3Client.generateKey('profile-picture', userId, 'profile-thumb.webp'),
      body: thumbnail.buffer!,
      contentType: 'image/webp',
      acl: 'public-read',
    }),
  ]);

  return {
    mainUrl: mainResult.location,
    thumbUrl: thumbResult.location,
  };
}
```

### 2. Photos d'articles (magasin)

```typescript
async function uploadArticleImages(articleId: number, images: Buffer[]) {
  const uploadPromises = images.map(async (img, index) => {
    const variants = await imageProcessor.generateVariants(img);
    const baseKey = s3Client.generateKey('article-image', undefined, `article-${articleId}-${index}`);
    
    return Promise.all([
      s3Client.upload({
        bucket: s3Client.getDefaultBucket(),
        key: `${baseKey}-original.jpg`,
        body: variants.original.buffer!,
        contentType: 'image/jpeg',
        acl: 'public-read',
        tags: { articleId: String(articleId), variant: 'original' },
      }),
      s3Client.upload({
        bucket: s3Client.getDefaultBucket(),
        key: `${baseKey}-medium.jpg`,
        body: variants.medium.buffer!,
        contentType: 'image/jpeg',
        acl: 'public-read',
        tags: { articleId: String(articleId), variant: 'medium' },
      }),
    ]);
  });

  return Promise.all(uploadPromises);
}
```

### 3. Certificats médicaux

```typescript
async function uploadMedicalCertificate(userId: number, pdfBuffer: Buffer) {
  const key = s3Client.generateKey('certificate', userId, 'medical-cert.pdf');
  
  const result = await s3Client.upload({
    bucket: s3Client.getDefaultBucket(),
    key,
    body: pdfBuffer,
    contentType: 'application/pdf',
    acl: 'private',
    metadata: {
      userId: String(userId),
      type: 'medical-certificate',
      uploadDate: new Date().toISOString(),
    },
  });

  // Générer URL signée valide 24h
  const url = await s3Client.getSignedUrl({
    bucket: result.bucket!,
    key: result.key!,
    expiresIn: 86400, // 24 heures
  });

  return { location: result.location, accessUrl: url };
}
```

## 🚀 Prochaines étapes

1. ✅ Client S3 créé
2. ✅ Image processor créé
3. ✅ Tests unitaires (24 tests)
4. 🎯 Intégrer dans les routes API
5. 🎯 Créer middleware upload multipart
6. 🎯 Ajouter dans GraphQL mutations
7. 🎯 Configuration bucket S3 AWS

## 📝 Notes

- Les clés sont générées avec timestamp + random pour éviter les collisions
- Les noms de fichiers sont sanitizés (caractères spéciaux remplacés par `_`)
- Sharp optimise automatiquement les images (compression, format)
- Les URLs signées expirent après le délai configuré (défaut: 1h)
- Les tests d'intégration nécessitent des credentials AWS valides
