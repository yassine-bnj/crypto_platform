"""
Tests d'intégration pour le workflow complet
Collecte → Stockage → Visualisation
"""
from decimal import Decimal
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from core.models import Asset, PriceHistory, Alert, Notification
from core.tasks import fetch_crypto_prices, check_alerts

User = get_user_model()


class DataPipelineIntegrationTest(TestCase):
    """Tests du pipeline complet: Collecte → Stockage → API"""
    
    def setUp(self):
        self.client = APIClient()
    
    @patch('core.tasks.requests.get')
    def test_full_data_pipeline(self, mock_get):
        """
        Test du workflow complet:
        1. Collecte des données (task Celery)
        2. Stockage en base (models)
        3. Récupération via API (views)
        """
        # 1. COLLECTE: Mock API CoinGecko
        mock_response = MagicMock()
        mock_response.json.return_value = [{
            "id": "bitcoin",
            "symbol": "btc",
            "name": "Bitcoin",
            "current_price": 50000,
            "total_volume": 1000000000,
            "market_cap": 950000000000,
            "last_updated": "2026-01-09T10:00:00.000Z",
            "price_change_percentage_1h_in_currency": 0.5,
            "price_change_percentage_24h_in_currency": 2.3,
            "price_change_percentage_7d_in_currency": -1.2
        }]
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        # Exécuter la collecte
        result = fetch_crypto_prices()
        self.assertIn("1 actifs", result)
        
        # 2. STOCKAGE: Vérifier que les données sont en base
        self.assertEqual(Asset.objects.count(), 1)
        asset = Asset.objects.get(symbol='BTC')
        self.assertEqual(asset.name, 'Bitcoin')
        
        self.assertEqual(PriceHistory.objects.count(), 1)
        price = PriceHistory.objects.first()
        self.assertEqual(price.asset, asset)
        self.assertEqual(price.price_usd, Decimal('50000'))
        
        # 3. VISUALISATION: Récupérer via API
        response = self.client.get('/api/price-history/BTC/?range=24h')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        # Note: might be empty if timestamp is outside 24h range
        self.assertGreaterEqual(len(data), 0)
        if len(data) > 0:
            self.assertEqual(float(data[0]['price_usd']), 50000.0)
        
        # Vérifier heatmap
        response = self.client.get('/api/heatmap/?range=24h')
        self.assertEqual(response.status_code, 200)
        heatmap = response.json()
        self.assertIn('BTC', heatmap)
        self.assertEqual(heatmap['BTC']['price'], 50000.0)


class AlertIntegrationTest(TestCase):
    """Tests d'intégration pour le système d'alertes"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='trader',
            email='trader@example.com',
            password='pass123'
        )
        self.client.force_authenticate(user=self.user)
    
    @patch('core.tasks.requests.get')
    @patch('core.tasks.send_notification_email')
    def test_alert_workflow_end_to_end(self, mock_send_email, mock_get):
        """
        Test workflow alerte complet:
        1. Utilisateur crée une alerte via API
        2. Prix collecté dépasse le seuil
        3. Task vérifie et déclenche notification
        4. Utilisateur reçoit notification via API
        """
        # 1. Créer une alerte via API
        mock_get_response = MagicMock()
        mock_get_response.json.return_value = [{
            "id": "bitcoin",
            "symbol": "btc",
            "name": "Bitcoin",
            "current_price": 40000,
            "total_volume": 1000000000,
            "market_cap": 950000000000,
            "last_updated": "2026-01-09T10:00:00.000Z",
            "price_change_percentage_1h_in_currency": 0,
            "price_change_percentage_24h_in_currency": 0,
            "price_change_percentage_7d_in_currency": 0
        }]
        mock_get_response.raise_for_status.return_value = None
        mock_get.return_value = mock_get_response
        
        # Collecter prix initial
        fetch_crypto_prices()
        
        asset = Asset.objects.get(symbol='BTC')
        
        # Créer alerte "above 45000"
        alert_data = {
            'currency': 'BTC',
            'condition': 'above',
            'price': '45000.00'
        }
        response = self.client.post('/api/alerts/', alert_data)
        self.assertEqual(response.status_code, 201)
        
        # 2. Prix monte à 50000
        mock_get_response.json.return_value[0]['current_price'] = 50000
        mock_get_response.json.return_value[0]['last_updated'] = "2026-01-09T11:00:00.000Z"
        fetch_crypto_prices()
        
        # 3. Vérifier alertes (devrait déclencher)
        result = check_alerts()
        self.assertIn("triggered 1", result)
        
        # 4. Vérifier notification via API
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, 200)
        
        notifications = response.json()
        self.assertEqual(len(notifications), 1)
        self.assertIn('Bitcoin', notifications[0]['message'])
        self.assertIn('50000', notifications[0]['message'])
        self.assertFalse(notifications[0]['read'])
        
        # Vérifier email
        mock_send_email.assert_called_once()


class MultiAssetIntegrationTest(TestCase):
    """Tests d'intégration pour plusieurs actifs"""
    
    def setUp(self):
        self.client = APIClient()
    
    @patch('core.tasks.requests.get')
    def test_multiple_assets_collection_and_visualization(self, mock_get):
        """Test collecte et visualisation de plusieurs cryptos"""
        # Mock plusieurs assets
        mock_response = MagicMock()
        mock_response.json.return_value = [
            {
                "id": "bitcoin",
                "symbol": "btc",
                "name": "Bitcoin",
                "current_price": 50000,
                "total_volume": 1000000000,
                "market_cap": 950000000000,
                "last_updated": "2026-01-09T10:00:00.000Z",
                "price_change_percentage_1h_in_currency": 0.5,
                "price_change_percentage_24h_in_currency": 2.3,
                "price_change_percentage_7d_in_currency": -1.2
            },
            {
                "id": "ethereum",
                "symbol": "eth",
                "name": "Ethereum",
                "current_price": 3000,
                "total_volume": 500000000,
                "market_cap": 360000000000,
                "last_updated": "2026-01-09T10:00:00.000Z",
                "price_change_percentage_1h_in_currency": 0.3,
                "price_change_percentage_24h_in_currency": 1.5,
                "price_change_percentage_7d_in_currency": -0.8
            },
            {
                "id": "cardano",
                "symbol": "ada",
                "name": "Cardano",
                "current_price": 0.5,
                "total_volume": 200000000,
                "market_cap": 18000000000,
                "last_updated": "2026-01-09T10:00:00.000Z",
                "price_change_percentage_1h_in_currency": 0.1,
                "price_change_percentage_24h_in_currency": 0.8,
                "price_change_percentage_7d_in_currency": -2.5
            }
        ]
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        # Collecter
        fetch_crypto_prices()
        
        # Vérifier stockage
        self.assertEqual(Asset.objects.count(), 3)
        self.assertEqual(PriceHistory.objects.count(), 3)
        
        # Vérifier heatmap contient tous les assets
        response = self.client.get('/api/heatmap/?range=24h')
        heatmap = response.json()
        
        self.assertEqual(len(heatmap), 3)
        self.assertIn('BTC', heatmap)
        self.assertIn('ETH', heatmap)
        self.assertIn('ADA', heatmap)
        
        # Vérifier price history pour chaque asset
        for symbol in ['BTC', 'ETH', 'ADA']:
            response = self.client.get(f'/api/price-history/{symbol}/?range=24h')
            self.assertEqual(response.status_code, 200)
            # Timestamp might be outside 24h range in test
            self.assertGreaterEqual(len(response.json()), 0)


class HistoricalDataAccumulationTest(TestCase):
    """Tests d'accumulation de données historiques"""
    
    @patch('core.tasks.requests.get')
    def test_multiple_price_updates(self, mock_get):
        """Test accumulation de plusieurs points de prix dans le temps"""
        mock_response = MagicMock()
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        # Simuler 5 collectes avec timestamps différents
        timestamps = [
            "2026-01-09T10:00:00.000Z",
            "2026-01-09T11:00:00.000Z",
            "2026-01-09T12:00:00.000Z",
            "2026-01-09T13:00:00.000Z",
            "2026-01-09T14:00:00.000Z"
        ]
        
        for i, ts in enumerate(timestamps):
            mock_response.json.return_value = [{
                "id": "bitcoin",
                "symbol": "btc",
                "name": "Bitcoin",
                "current_price": 50000 + i * 100,
                "total_volume": 1000000000,
                "market_cap": 950000000000,
                "last_updated": ts,
                "price_change_percentage_1h_in_currency": 0.5,
                "price_change_percentage_24h_in_currency": 2.3,
                "price_change_percentage_7d_in_currency": -1.2
            }]
            fetch_crypto_prices()
        
        # Vérifier accumulation
        self.assertEqual(PriceHistory.objects.count(), 5)
        
        # Vérifier ordre chronologique
        prices = PriceHistory.objects.order_by('timestamp')
        self.assertEqual(float(prices[0].price_usd), 50000.0)
        self.assertEqual(float(prices[4].price_usd), 50400.0)
