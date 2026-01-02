"""
Tests pour les tâches Celery (collecte de données)
Couvre: fetch_crypto_prices, check_alerts
"""
from decimal import Decimal
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from core.models import Asset, PriceHistory, Alert, Notification
from core.tasks import fetch_crypto_prices, check_alerts

User = get_user_model()


class FetchCryptoPricesTaskTest(TestCase):
    """Tests pour la collecte des prix crypto depuis CoinGecko"""
    
    @patch('core.tasks.requests.get')
    def test_fetch_crypto_prices_success(self, mock_get):
        """Test collecte réussie des prix depuis l'API"""
        # Mock réponse API CoinGecko
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
            }
        ]
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        # Exécuter la tâche
        result = fetch_crypto_prices()
        
        # Vérifications
        self.assertIn("2 actifs", result)
        self.assertEqual(Asset.objects.count(), 2)
        
        # Vérifier Bitcoin
        btc = Asset.objects.get(symbol='BTC')
        self.assertEqual(btc.name, 'Bitcoin')
        self.assertEqual(btc.coingecko_id, 'bitcoin')
        
        # Vérifier Ethereum
        eth = Asset.objects.get(symbol='ETH')
        self.assertEqual(eth.name, 'Ethereum')
        
        # Vérifier stockage des prix
        self.assertTrue(PriceHistory.objects.filter(asset=btc).exists())
        self.assertTrue(PriceHistory.objects.filter(asset=eth).exists())
        
        btc_price = PriceHistory.objects.filter(asset=btc).first()
        self.assertEqual(btc_price.price_usd, Decimal('50000'))
        self.assertEqual(btc_price.price_change_percentage_24h, 2.3)
    
    @patch('core.tasks.requests.get')
    def test_fetch_crypto_prices_api_error(self, mock_get):
        """Test gestion d'erreur API"""
        mock_get.side_effect = Exception("API connection failed")
        
        result = fetch_crypto_prices()
        
        self.assertIn("Erreur", result)
        self.assertEqual(Asset.objects.count(), 0)
    
    @patch('core.tasks.requests.get')
    def test_fetch_crypto_prices_update_existing(self, mock_get):
        """Test mise à jour d'actifs existants"""
        # Créer un actif existant
        Asset.objects.create(
            coingecko_id='bitcoin',
            symbol='OLD',
            name='Old Bitcoin Name'
        )
        
        # Mock nouvelle donnée
        mock_response = MagicMock()
        mock_response.json.return_value = [{
            "id": "bitcoin",
            "symbol": "btc",
            "name": "Bitcoin",
            "current_price": 51000,
            "total_volume": 1100000000,
            "market_cap": 960000000000,
            "last_updated": "2026-01-09T11:00:00.000Z",
            "price_change_percentage_1h_in_currency": 0.6,
            "price_change_percentage_24h_in_currency": 2.5,
            "price_change_percentage_7d_in_currency": -1.0
        }]
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response
        
        fetch_crypto_prices()
        
        # Vérifier mise à jour
        btc = Asset.objects.get(coingecko_id='bitcoin')
        self.assertEqual(btc.symbol, 'BTC')  # Mis à jour
        self.assertEqual(btc.name, 'Bitcoin')  # Mis à jour
        self.assertEqual(Asset.objects.count(), 1)  # Pas de doublon


class CheckAlertsTaskTest(TestCase):
    """Tests pour la vérification des alertes de prix"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='alertuser',
            email='alert@example.com',
            password='pass123'
        )
        self.asset = Asset.objects.create(
            coingecko_id='bitcoin',
            symbol='BTC',
            name='Bitcoin'
        )
    
    @patch('core.tasks.send_notification_email')
    def test_check_alerts_above_triggered(self, mock_send_email):
        """Test alerte déclenchée quand prix dépasse seuil"""
        # Créer une alerte "above 45000"
        alert = Alert.objects.create(
            user=self.user,
            asset=self.asset,
            condition='above',
            target_price=Decimal('45000'),
            is_active=True
        )
        
        # Créer un prix actuel de 50000
        PriceHistory.objects.create(
            asset=self.asset,
            price_usd=Decimal('50000'),
            volume_24h=Decimal('1000000000'),
            market_cap=Decimal('950000000000'),
            timestamp=timezone.now()
        )
        
        # Exécuter la vérification
        result = check_alerts()
        
        # Vérifications
        self.assertIn("triggered 1", result)
        
        alert.refresh_from_db()
        self.assertFalse(alert.is_active)  # Alerte désactivée
        self.assertIsNotNone(alert.triggered_at)
        
        # Vérifier création de notification
        notif = Notification.objects.filter(user=self.user).first()
        self.assertIsNotNone(notif)
        self.assertIn('Bitcoin', notif.message)
        self.assertIn('50000', notif.message)
        
        # Vérifier email envoyé
        mock_send_email.assert_called_once()
    
    @patch('core.tasks.send_notification_email')
    def test_check_alerts_below_triggered(self, mock_send_email):
        """Test alerte déclenchée quand prix passe sous seuil"""
        alert = Alert.objects.create(
            user=self.user,
            asset=self.asset,
            condition='below',
            target_price=Decimal('55000'),
            is_active=True
        )
        
        PriceHistory.objects.create(
            asset=self.asset,
            price_usd=Decimal('50000'),
            volume_24h=Decimal('1000000000'),
            market_cap=Decimal('950000000000'),
            timestamp=timezone.now()
        )
        
        result = check_alerts()
        
        self.assertIn("triggered 1", result)
        alert.refresh_from_db()
        self.assertFalse(alert.is_active)
    
    def test_check_alerts_not_triggered(self):
        """Test alerte non déclenchée si condition pas remplie"""
        Alert.objects.create(
            user=self.user,
            asset=self.asset,
            condition='above',
            target_price=Decimal('60000'),  # Prix actuel sera 50000
            is_active=True
        )
        
        PriceHistory.objects.create(
            asset=self.asset,
            price_usd=Decimal('50000'),
            volume_24h=Decimal('1000000000'),
            market_cap=Decimal('950000000000'),
            timestamp=timezone.now()
        )
        
        result = check_alerts()
        
        self.assertIn("triggered 0", result)
        self.assertTrue(Alert.objects.get(user=self.user).is_active)
        self.assertEqual(Notification.objects.count(), 0)
    
    def test_check_alerts_no_price_data(self):
        """Test alerte quand pas de données de prix"""
        Alert.objects.create(
            user=self.user,
            asset=self.asset,
            condition='above',
            target_price=Decimal('50000'),
            is_active=True
        )
        
        # Pas de PriceHistory créé
        result = check_alerts()
        
        # Alerte reste active (pas de prix pour comparer)
        self.assertTrue(Alert.objects.get(user=self.user).is_active)
