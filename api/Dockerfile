# Étape de construction (backend)
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY api/package*.json ./

# Installer les dépendances
RUN npm install --only=production

# Copier le reste des fichiers de l'API
COPY api/ .

# Exposer le port de l'API
EXPOSE 5000

# Lancer l'application Node.js
CMD ["npm", "run", "start"]
