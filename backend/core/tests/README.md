# Rapport de tests - crypto_platform

## Tests implémentés

### 1. Tests unitaires - Modèles (Stockage)
**Fichier**: `backend/core/tests/test_models.py`

Tests couvrant les modèles de base de données:
- **Asset**: Création, unicité coingecko_id
- **PriceHistory**: Création, contrainte unique (asset, timestamp), ordering
- **Alert**: Création, conditions (above/below)
- **VirtualPortfolio**: Création, relation OneToOne avec User
- **Notification**: Création, statut read

**Total**: 10 tests

---

### 2. Tests des tâches Celery (Collecte)
**Fichier**: `backend/core/tests/test_tasks.py`

Tests de la collecte automatique de données:
- **fetch_crypto_prices**: 
  - Collecte réussie depuis API CoinGecko (mock)
  - Gestion erreur API
  - Mise à jour d'actifs existants
- **check_alerts**:
  - Déclenchement alerte "above"
  - Déclenchement alerte "below"
  - Alerte non déclenchée si condition non remplie
  - Gestion absence de données

**Total**: 7 tests

---

### 3. Tests des API Views (Visualisation)
**Fichier**: `backend/core/tests/test_views.py`

Tests des endpoints de visualisation:
- **price_history**: Récupération historique 24h/7d, symbole invalide
- **ohlc_data**: Données chandelier (OHLC)
- **heatmap**: Vue marché (24h/7d), validation range
- **indicators**: Calcul SMA_7, SMA_25
- **alerts API**: Création, liste, suppression, authentification
- **notifications API**: Liste, marquage lecture

**Total**: 13 tests

---

### 4. Tests d'intégration (Pipeline complet)
**Fichier**: `backend/core/tests/test_integration.py`

Tests du workflow end-to-end:
- **Pipeline complet**: Collecte → Stockage → API
- **Workflow alertes**: Création alerte → Collecte prix → Déclenchement → Notification
- **Multi-assets**: Collecte et visualisation de plusieurs cryptos
- **Accumulation historique**: Plusieurs points de prix dans le temps

**Total**: 8 tests

---

## Résumé

- **Total tests**: 38 tests
- **Statut**: ✅ Tous passent
- **Couverture**: Collecte, Stockage, Visualisation

## Commandes

Exécuter tous les tests:
```bash
python manage.py test core.tests
```

Tests avec coverage:
```bash
coverage run --source='.' manage.py test
coverage report
coverage html
```

Tests par catégorie:
```bash
python manage.py test core.tests.test_models
python manage.py test core.tests.test_tasks
python manage.py test core.tests.test_views
python manage.py test core.tests.test_integration
```
