#!/bin/bash

# Pull la dernière version de l'image Docker depuis GitHub Packages
docker pull ghcr.io/USERNAME/REPOSITORY:latest

# Arrête le conteneur en cours
docker stop my-nginx-container

# Supprime l'ancien conteneur
docker rm my-nginx-container

# Démarre un nouveau conteneur avec la nouvelle image
docker run -d --name my-nginx-container -p 80:80 ghcr.io/USERNAME/REPOSITORY:latest
