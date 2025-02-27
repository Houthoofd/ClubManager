# Étape de construction du frontend
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY web/package*.json ./

# Installer les dépendances
RUN npm install --legacy-peer-deps

# Copier les fichiers du frontend
COPY web/ .

# Construire l'application pour la production
RUN npm run build