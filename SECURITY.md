# 🔒 Guide de Sécurité - ClubManager

## ⚠️ Fichiers Sensibles

Les fichiers suivants contiennent des informations sensibles et **NE DOIVENT JAMAIS** être commités :

### API Backend
- `api/.env`
- `api/.env.development`
- `api/.env.production`

### Frontend
- `front-end/.env`
- `front-end/.env.local`

## 🛠️ Configuration pour les développeurs

1. **Copiez les fichiers examples :**
   ```bash
   cp api/.env.example api/.env.development
   cp front-end/.env.example front-end/.env
   ```

2. **Demandez les vraies clés API à l'administrateur**

3. **Vérifiez le .gitignore :**
   ```bash
   git status
   # Les fichiers .env ne doivent PAS apparaître
   ```

## 🔑 Variables Sensibles

- **SENDGRID_API_KEY** : Clé API SendGrid
- **STRIPE_SECRET_KEY** : Clé secrète Stripe  
- **JWT_SECRET** : Secret pour JWT
- **DB_PASSWORD** : Mot de passe base de données

## 🚨 En cas de fuite

Si des secrets sont accidentellement commités :

1. **Révoquz immédiatement les clés**
2. **Générez de nouvelles clés**  
3. **Nettoyez l'historique Git**
4. **Mettez à jour les variables d'environnement**

## 📞 Contact

En cas de problème de sécurité : clubmanagement043@gmail.com
