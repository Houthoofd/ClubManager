# Étape de production (Nginx)
FROM nginx:alpine

# Copier les fichiers de build depuis l'étape frontend (depuis l'étape de build frontend)
COPY --from=clubmanager-frontend /app/dist/ /usr/share/nginx/html/

#COPY --from=clubmanager-frontend /app/app/index.html /usr/share/nginx/html/


# Copier le fichier de configuration Nginx personnalisé
COPY nginx.conf /etc/nginx/nginx.conf

# Exposer le port pour Nginx
EXPOSE 80
