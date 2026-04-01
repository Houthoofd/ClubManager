# 🚀 Guide de Démarrage Rapide - Service Email

## ⚡ Démarrage en 3 étapes

### Étape 1 : Choisissez votre mode

**Mode Développement (par défaut)** ✅
```bash
# Aucune configuration requise !
# Les emails s'affichent dans la console
npm run dev
```

**Mode Production** 🚀
```bash
# Choisissez un des exemples ci-dessous
```

### Étape 2 : Ajoutez les variables dans `.env`

Copiez l'exemple qui vous convient dans votre fichier `.env` :

#### 📮 Option A : SendGrid (Recommandé Production)

```env
SENDGRID_API_KEY=SG.votre_cle_api_ici
FROM_EMAIL=noreply@clubmanager.com
FRONTEND_URL=http://localhost:3000
```

**Installation :**
```bash
npm install @sendgrid/mail
```

**Obtenir une clé API :**
1. Inscrivez-vous sur [SendGrid](https://sendgrid.com/)
2. Créez une clé API dans Settings > API Keys
3. Copiez la clé et collez-la dans `.env`

---

#### 📧 Option B : Gmail (Facile pour tester)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre.email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
FROM_EMAIL=votre.email@gmail.com
FRONTEND_URL=http://localhost:3000
```

**Installation :**
```bash
npm install nodemailer
```

**Obtenir le mot de passe d'application Gmail :**
1. Allez sur [Google Account Security](https://myaccount.google.com/security)
2. Activez la validation en deux étapes
3. Recherchez "Mots de passe des applications"
4. Générez un mot de passe pour "Autre (nom personnalisé)"
5. Utilisez ce mot de passe de 16 caractères dans `.env`

---

#### 📨 Option C : Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre.email@outlook.com
SMTP_PASSWORD=votre_mot_de_passe
FROM_EMAIL=votre.email@outlook.com
FRONTEND_URL=http://localhost:3000
```

**Installation :**
```bash
npm install nodemailer
```

---

### Étape 3 : Testez !

**Démarrez le serveur :**
```bash
npm run dev
```

**Vérifiez le log au démarrage :**
```
📧 [EmailService] Initialisé avec provider: console
# ou sendgrid, ou nodemailer selon votre config
```

**Créez un utilisateur pour tester :**
```bash
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com",
    "motDePasse": "Password123!",
    "role": "participant"
  }'
```

**Résultat attendu :**
- **Mode console** : Email affiché dans les logs
- **Mode production** : Email reçu dans la boîte mail

---

## 🎯 Exemples de Configuration Complets

### Configuration Locale (Développement)

**Fichier : `.env`**
```env
# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/clubmanager

# JWT
JWT_SECRET=votre_secret_jwt_tres_long_et_secure

# Frontend
FRONTEND_URL=http://localhost:3000

# Email : Mode console (aucune autre variable requise)
```

### Configuration Production avec SendGrid

**Fichier : `.env.production`**
```env
# Base de données
DATABASE_URL=postgresql://user:password@prod-server:5432/clubmanager

# JWT
JWT_SECRET=votre_secret_jwt_production_ultra_secure

# Frontend
FRONTEND_URL=https://clubmanager.com

# Email : SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@clubmanager.com
```

### Configuration Production avec SMTP

**Fichier : `.env.production`**
```env
# Base de données
DATABASE_URL=postgresql://user:password@prod-server:5432/clubmanager

# JWT
JWT_SECRET=votre_secret_jwt_production_ultra_secure

# Frontend
FRONTEND_URL=https://clubmanager.com

# Email : SMTP
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=admin@votredomaine.com
SMTP_PASSWORD=votre_mot_de_passe_secure
FROM_EMAIL=noreply@votredomaine.com
```

---

## 🧪 Tests Rapides

### Test 1 : Vérifier le provider détecté

**Démarrez l'application et cherchez dans les logs :**
```bash
npm run dev | grep EmailService
```

**Output attendu :**
```
📧 [EmailService] Initialisé avec provider: console
```

### Test 2 : Créer un utilisateur

**Via l'API :**
```bash
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test",
    "prenom": "User",
    "email": "test@example.com",
    "motDePasse": "SecurePass123!",
    "role": "participant"
  }'
```

**Logs attendus (mode console) :**
```
📧 [EmailService] Email envoyé à test@example.com
   Sujet: Bienvenue sur ClubManager !
   🔗 Lien de vérification: http://localhost:3000/verify-email?token=xxx
```

### Test 3 : Vérifier la réception (mode production)

1. Créez un utilisateur avec votre vraie adresse email
2. Vérifiez votre boîte de réception
3. Cliquez sur le lien de vérification

---

## ❌ Dépannage Express

### ❌ "Provider détecté : console" mais je veux SendGrid

**Problème :** Les variables d'environnement ne sont pas chargées

**Solution :**
```bash
# Vérifiez que .env existe
ls -la .env

# Vérifiez le contenu
cat .env | grep SENDGRID

# Redémarrez le serveur
npm run dev
```

### ❌ "Error: Invalid login" (SMTP)

**Problème :** Identifiants incorrects

**Solutions :**
1. Gmail : Utilisez un mot de passe d'application (pas votre mot de passe normal)
2. Outlook : Vérifiez que le compte n'a pas d'authentification à deux facteurs
3. Vérifiez qu'il n'y a pas d'espaces dans le `.env`

### ❌ "Error: Unauthorized" (SendGrid)

**Problème :** Clé API invalide ou sans permissions

**Solutions :**
1. Vérifiez que la clé API est correcte
2. Créez une nouvelle clé avec les permissions "Mail Send"
3. Vérifiez que votre compte SendGrid est actif

### ❌ Email non reçu (mode production)

**Checklist :**
- [ ] Vérifier les spams
- [ ] Vérifier les logs pour des erreurs
- [ ] Tester avec une autre adresse email
- [ ] Vérifier les quotas de votre provider (SendGrid gratuit = 100 emails/jour)

### ❌ "Connection timeout" (SMTP)

**Problème :** Impossible de se connecter au serveur SMTP

**Solutions :**
1. Vérifiez le `SMTP_HOST` (pas de `http://` ou `https://`)
2. Vérifiez le `SMTP_PORT` (587 ou 465)
3. Vérifiez votre firewall/antivirus
4. Essayez avec `SMTP_SECURE=true` et `SMTP_PORT=465`

---

## 📋 Checklist de Mise en Production

Avant de déployer :

- [ ] **Variables d'environnement configurées**
  - `SENDGRID_API_KEY` ou configuration SMTP
  - `FROM_EMAIL` avec un vrai domaine
  - `FRONTEND_URL` avec l'URL de production

- [ ] **Tests effectués**
  - Créer un utilisateur
  - Recevoir l'email de bienvenue
  - Cliquer sur le lien de vérification

- [ ] **Sécurité**
  - `.env` dans `.gitignore`
  - Pas de credentials dans le code
  - Clés API avec permissions minimales

- [ ] **Configuration DNS** (si domaine custom)
  - SPF record configuré
  - DKIM configuré (SendGrid le fait automatiquement)

- [ ] **Monitoring**
  - Logs activés
  - Alertes configurées pour les erreurs d'envoi

---

## 🆘 Besoin d'aide ?

### Documentation complète
Voir `EMAIL_SERVICE.md` pour la documentation détaillée

### Support par provider
- **SendGrid** : [Documentation](https://docs.sendgrid.com/)
- **Gmail** : [Mots de passe d'application](https://support.google.com/accounts/answer/185833)
- **NodeMailer** : [Documentation](https://nodemailer.com/)

### Logs de debug
Ajoutez ces lignes dans `container.ts` pour déboguer :
```typescript
console.log('ENV CHECK:', {
  sendgrid: !!process.env.SENDGRID_API_KEY,
  smtp: !!process.env.SMTP_HOST,
  custom: !!process.env.CUSTOM_EMAIL_SERVICE,
});
```

---

## 💡 Conseils Pro

### Pour le développement
```env
# Gardez le mode console, c'est plus rapide
# Pas de config email requise
```

### Pour la staging
```env
# Utilisez SendGrid avec un domaine de test
SENDGRID_API_KEY=...
FROM_EMAIL=staging@test.clubmanager.com
```

### Pour la production
```env
# SendGrid avec votre vrai domaine
SENDGRID_API_KEY=...
FROM_EMAIL=noreply@clubmanager.com
# + Configuration DNS (SPF, DKIM)
```

---

**Prêt à envoyer des emails ! 🎉**