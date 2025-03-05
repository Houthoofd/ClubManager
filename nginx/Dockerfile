# Étape de construction de Nginx
FROM nginx:alpine

# Copier les fichiers de build frontend depuis l'étape précédente
COPY --from=clubmanager-frontend /app/dist/ /usr/share/nginx/html/


COPY --from=clubmanager-frontend /app/app/index.html /usr/share/nginx/html/


# Copier le fichier de configuration Nginx personnalisé
COPY nginx.conf /etc/nginx/nginx.conf

# Exposer le port 80 pour Nginx
EXPOSE 80

# Démarrer Nginx en mode détaché
CMD ["nginx", "-g", "daemon off;"]
