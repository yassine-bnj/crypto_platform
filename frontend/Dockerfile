# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

# Copier les fichiers du projet
COPY package.json pnpm-lock.yaml* ./
COPY . .

# Installer pnpm
RUN npm install -g pnpm

# Installer les dépendances
RUN pnpm install --no-frozen-lockfile

# Builder l'application
RUN pnpm run build

# Exposer le port
EXPOSE 3000

# Variables d'environnement pour le build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Démarrer l'application
CMD ["pnpm", "start"]
