# 🚀 Crypto Trading Platform

Plateforme complète de trading de cryptomonnaies avec suivi en temps réel, alertes personnalisées, portefeuille virtuel et monitoring avancé.

## 📋 Table des Matières

- [Aperçu](#aperçu)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Technologies](#technologies)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Monitoring](#monitoring)
- [Tests](#tests)
- [Structure du Projet](#structure-du-projet)
- [API Documentation](#api-documentation)

## 🎯 Aperçu

Cette plateforme permet aux utilisateurs de suivre les prix des cryptomonnaies en temps réel, configurer des alertes personnalisées, gérer un portefeuille virtuel et analyser les tendances du marché avec des indicateurs techniques avancés.

### Points Forts

- **Temps Réel** : Actualisation automatique des prix toutes les 5 minutes via Celery
- **Alertes Intelligentes** : Notifications email pour les seuils de prix personnalisés
- **Portefeuille Virtuel** : Simulation de trading sans risque financier
- **Analytics Avancé** : Indicateurs techniques (RSI, MACD, EMA, Bollinger Bands)
- **Monitoring** : Stack Prometheus + Grafana pour métriques système et applicatives
- **Multi-utilisateurs** : Gestion des rôles (Admin/User) avec JWT

## ✨ Fonctionnalités

### Pour les Utilisateurs

- 📊 **Dashboard Interactif**
  - Vue d'ensemble du marché avec top gainers/losers
  - Heatmap des cryptomonnaies
  - Graphiques en temps réel (TradingView)
  
- 🔔 **Système d'Alertes**
  - Création d'alertes sur seuils de prix
  - Notifications email automatiques
  - Historique des alertes déclenchées

- 💼 **Portefeuille Virtuel**
  - Trading virtuel avec solde simulé
  - Historique des transactions
  - Suivi des profits/pertes
  - Ajout de fonds virtuels

- 📈 **Analyse Technique**
  - Graphiques OHLC (Open, High, Low, Close)
  - Indicateurs: RSI, MACD, EMA, Bollinger Bands
  - Historique des prix avec période personnalisable

### Pour les Administrateurs

- 👥 **Gestion Utilisateurs**
  - Liste complète des utilisateurs
  - Activation/désactivation des comptes
  - Statistiques d'utilisation

- 📊 **Monitoring Système**
  - Dashboards Grafana préconfigurés
  - Métriques en temps réel (CPU, RAM, requêtes)
  - Alertes système

## 🏗️ Architecture

### Stack Technique

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│                    Port: 3000                            │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────────┐
│              Backend API (Django REST)                   │
│                    Port: 8000                            │
└─────────┬───────────────────┬──────────────────────────┘
          │                   │
          ↓                   ↓
┌─────────────────┐  ┌──────────────────┐
│  PostgreSQL DB  │  │   Redis Cache    │
│   Port: 5432    │  │   Port: 6379     │
└─────────────────┘  └──────────────────┘
          │
          ↓
┌─────────────────────────────────────────────────────────┐
│           Celery Workers & Beat Scheduler                │
│         (Tâches asynchrones & CRON jobs)                 │
└─────────────────────────────────────────────────────────┘
          │
          ↓
┌─────────────────────────────────────────────────────────┐
│  Prometheus (9090) → Grafana (4000)                      │
│         Monitoring & Visualisation                       │
└─────────────────────────────────────────────────────────┘
```

### Services Docker

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Application Next.js avec UI React |
| Backend | 8000 | API Django REST Framework |
| PostgreSQL | 5432 | Base de données principale |
| Redis | 6379 | Cache et message broker Celery |
| Celery Worker | - | Traitement tâches asynchrones |
| Celery Beat | - | Planificateur CRON |
| Prometheus | 9090 | Collecte des métriques |
| Grafana | 4000 | Dashboards de monitoring |

## 🛠️ Technologies

### Backend
- **Django 4.1** - Framework web Python
- **Django REST Framework** - API RESTful
- **PostgreSQL 15** - Base de données
- **Redis 7** - Cache & message broker
- **Celery 5.4** - Tâches asynchrones
- **django-prometheus 2.3** - Métriques système
- **JWT** - Authentification

### Frontend
- **Next.js 14** - Framework React
- **TypeScript** - Typage statique
- **TailwindCSS** - Styling
- **shadcn/ui** - Composants UI
- **Recharts** - Graphiques
- **Axios** - Requêtes HTTP

### Monitoring
- **Prometheus** - Collecte métriques
- **Grafana** - Visualisation
- **django-prometheus** - Instrumentation

### DevOps
- **Docker & Docker Compose** - Conteneurisation
- **Gunicorn** - Serveur WSGI
- **GitHub Actions** - CI/CD (optionnel)

## 📦 Installation

### Prérequis

- Docker Desktop (Windows/Mac) ou Docker Engine (Linux)
- Docker Compose
- Git

### Étapes d'Installation

1. **Cloner le repository**
```bash
git clone <repository-url>
cd crypto_platform
```

2. **Configuration des variables d'environnement**
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer les variables nécessaires
# Voir section Configuration ci-dessous
```

3. **Lancer tous les services**
```powershell
# Windows PowerShell
.\start.ps1
```

```bash
# Linux/Mac
docker-compose up -d
```

4. **Vérifier que tous les conteneurs sont actifs**
```bash
docker ps
```

5. **Accéder aux services**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin Django: http://localhost:8000/admin
- Grafana: http://localhost:4000
- Prometheus: http://localhost:9090

## ⚙️ Configuration

### Variables d'Environnement (.env)

```env
# Django
DEBUG=True
DJANGO_SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgres://postgres:admin123@db:5432/crypto_db

# Redis
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# Email (pour les alertes)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# API Keys (optionnel)
COINGECKO_API_KEY=your-api-key

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Grafana

**Identifiants par défaut:**
- Username: `admin`
- Password: `admin123`

### Premier Utilisateur Admin

```bash
# Créer un superutilisateur Django
docker exec -it crypto_backend python manage.py createsuperuser
```

## 🚀 Utilisation

### Démarrage Rapide

```powershell
# Démarrer tous les services
.\start.ps1

# Redémarrer tous les services
.\restart.ps1

# Arrêter tous les services
.\stop.ps1
```

### Commandes Utiles

```bash
# Voir les logs d'un service
docker logs crypto_backend -f
docker logs crypto_frontend -f
docker logs crypto_celery_worker -f

# Exécuter des migrations
docker exec -it crypto_backend python manage.py migrate

# Collecter les fichiers statiques
docker exec -it crypto_backend python manage.py collectstatic --noinput

# Shell Django
docker exec -it crypto_backend python manage.py shell

# Tests
docker exec -it crypto_backend python manage.py test
```

### Accès aux Dashboards

1. **Application Web**: http://localhost:3000
   - Inscription/Connexion
   - Vue des marchés
   - Gestion des alertes
   - Portefeuille virtuel

2. **Admin Django**: http://localhost:8000/admin
   - Gestion des utilisateurs
   - Configuration des assets
   - Vue des transactions

3. **Grafana**: http://localhost:4000
   - Dashboard "Django Crypto Platform" : Métriques métier
   - Dashboard "System Performance" : Métriques système
   - Configuration des alertes

## 📊 Monitoring

### Implémentation Prometheus + Grafana

**1. Configuration Django-Prometheus**
- Middleware `django-prometheus` capture automatiquement:
  - Requêtes HTTP (count, latence, status)
  - Opérations base de données
  - Utilisation CPU/RAM du backend
  - File descriptors et threads

**2. Prometheus**
- Scrape les métriques toutes les 15 secondes
- Endpoint: `/metrics/metrics`
- Configuration: `prometheus.yml`

**3. Grafana**
- Provisioning automatique de la datasource Prometheus
- 2 dashboards préconfigurés:
  - **Django Crypto Platform**: Users, Assets, Alerts, Requests
  - **System Performance**: CPU, RAM, Network, Latency

**4. Métriques Collectées**
```
# Exemples de métriques disponibles
django_http_requests_total_by_method_total
django_http_requests_latency_seconds
process_resident_memory_bytes
process_cpu_seconds_total
users_total
assets_total
alerts_total
```

### Dashboards Grafana

Les dashboards sont automatiquement provisionnés au démarrage dans:
```
grafana/provisioning/
├── datasources/
│   └── prometheus.yml
└── dashboards/
    ├── dashboard.yml
    ├── django-dashboard.json
    └── system-dashboard.json
```

## 🧪 Tests

### Backend Tests

```bash
# Lancer tous les tests
docker exec -it crypto_backend python manage.py test

# Tests spécifiques
docker exec -it crypto_backend python manage.py test core.tests.test_models
docker exec -it crypto_backend python manage.py test core.tests.test_views
docker exec -it crypto_backend python manage.py test core.tests.test_tasks

# Avec coverage
docker exec -it crypto_backend coverage run manage.py test
docker exec -it crypto_backend coverage report
```

### Frontend Tests

```bash
# Lancer les tests Jest
docker exec -it crypto_frontend npm test

# Avec coverage
docker exec -it crypto_frontend npm run test:coverage
```

## 📁 Structure du Projet

```
crypto_platform/
├── backend/                      # API Django
│   ├── backend/                  # Configuration Django
│   │   ├── settings.py          # Settings + Django-Prometheus
│   │   ├── urls.py              # URLs + /metrics endpoint
│   │   ├── celery.py            # Configuration Celery
│   │   └── wsgi.py
│   ├── core/                     # Application principale
│   │   ├── models.py            # User, Asset, Alert, Portfolio
│   │   ├── views.py             # API Views (REST)
│   │   ├── serializers.py       # DRF Serializers
│   │   ├── tasks.py             # Tâches Celery
│   │   ├── utils.py             # Fonctions utilitaires
│   │   └── tests/               # Tests unitaires
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                     # Application Next.js
│   ├── app/                      # Pages (App Router)
│   │   ├── page.tsx             # Homepage
│   │   ├── markets/             # Page marchés
│   │   ├── portfolio/           # Portefeuille
│   │   ├── alerts/              # Alertes
│   │   └── admin/               # Interface admin
│   ├── components/               # Composants React
│   │   ├── ui/                  # shadcn/ui
│   │   ├── dashboard/
│   │   └── alerts/
│   ├── context/                  # React Context (Auth)
│   ├── lib/                      # Utilitaires
│   │   └── api-service.ts       # Client API
│   ├── package.json
│   └── Dockerfile
├── grafana/
│   └── provisioning/
│       ├── datasources/          # Config Prometheus
│       └── dashboards/           # Dashboards JSON
├── docker-compose.yml            # Orchestration services
├── prometheus.yml                # Config Prometheus
├── start.ps1                     # Script démarrage Windows
├── stop.ps1                      # Script arrêt
├── restart.ps1                   # Script redémarrage
└── README.md                     # Ce fichier
```

## 📡 API Documentation

### Endpoints Principaux

#### Authentification
```
POST /api/auth/register/          # Inscription
POST /api/auth/login/             # Connexion (JWT)
POST /api/auth/refresh/           # Refresh token
POST /api/auth/logout/            # Déconnexion
GET  /api/auth/me/                # Profil utilisateur
```

#### Marchés
```
GET  /api/assets/                 # Liste des cryptos
GET  /api/assets/{symbol}/price/  # Prix actuel
GET  /api/price-history/{symbol}/ # Historique prix
GET  /api/ohlc/{symbol}/          # Données OHLC
GET  /api/indicators/{symbol}/    # Indicateurs techniques
GET  /api/heatmap/                # Heatmap du marché
```

#### Alertes
```
GET    /api/alerts/               # Mes alertes
POST   /api/alerts/               # Créer alerte
DELETE /api/alerts/{id}/          # Supprimer alerte
GET    /api/notifications/        # Mes notifications
```

#### Portefeuille Virtuel
```
GET  /api/virtual-portfolio/            # Résumé portfolio
GET  /api/virtual-portfolio/trades/     # Historique trades
POST /api/virtual-portfolio/trades/     # Nouveau trade
POST /api/virtual-portfolio/fund/       # Ajouter fonds
GET  /api/virtual-portfolio/funding-history/ # Historique fonds
```

#### Admin
```
GET   /api/admin/users/           # Liste utilisateurs
PATCH /api/admin/users/{id}/status/ # Activer/Désactiver
```

### Format Réponse

```json
{
  "success": true,
  "data": { /* ... */ },
  "message": "Operation successful"
}
```


## 👥 Auteurs

- **Yassine Ben Jeddou** - Développement initial

## 🙏 Remerciements

- API CoinGecko pour les données crypto
- Communauté Django & Next.js
- Stack Prometheus + Grafana

---

**Note**: Ce projet est à but éducatif. N'investissez jamais d'argent réel sans faire vos propres recherches.
