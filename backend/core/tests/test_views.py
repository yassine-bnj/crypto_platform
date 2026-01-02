"""
Tests pour les API endpoints (visualisation des données)
Couvre: price_history, ohlc_data, heatmap, indicators, alerts API
"""
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Asset, PriceHistory, Alert, Notification

User = get_user_model()


class PriceHistoryViewTest(TestCase):
    """Tests pour l'endpoint /api/price-history/{symbol}/ (visualisation)"""
    
    def setUp(self):
        self.client = APIClient()
        self.asset = Asset.objects.create(
            coingecko_id='bitcoin',
            symbol='BTC',
            name='Bitcoin'
        )
        
        # Créer des points de prix sur 7 jours
        now = timezone.now()
        for i in range(7):
            PriceHistory.objects.create(
                asset=self.asset,
                price_usd=Decimal(50000 + i * 100),
                volume_24h=Decimal('1000000000'),
                market_cap=Decimal('950000000000'),
                timestamp=now - timezone.timedelta(days=6-i)
            )
    
    def test_get_price_history_24h(self):
        """Test récupération historique 24h"""
        response = self.client.get('/api/price-history/BTC/?range=24h')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.json(), list)
        self.assertGreater(len(response.json()), 0)
    
    def test_get_price_history_7d(self):
        """Test récupération historique 7 jours"""
        response = self.client.get('/api/price-history/BTC/?range=7d')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 7)
        
        # Vérifier structure
        self.assertIn('price_usd', data[0])
        self.assertIn('timestamp', data[0])
    
    def test_get_price_history_invalid_symbol(self):
        """Test erreur pour symbole inexistant"""
        response = self.client.get('/api/price-history/INVALID/?range=24h')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.json())
    
    def test_get_price_history_default_range(self):
        """Test range par défaut (24h)"""
        response = self.client.get('/api/price-history/BTC/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class OHLCDataViewTest(TestCase):
    """Tests pour l'endpoint /api/ohlc/{symbol}/ (données chandelier)"""
    
    def setUp(self):
        self.client = APIClient()
        self.asset = Asset.objects.create(
            coingecko_id='ethereum',
            symbol='ETH',
            name='Ethereum'
        )
        
        # Créer plusieurs points dans la même heure
        now = timezone.now().replace(minute=0, second=0, microsecond=0)
        prices = [3000, 3050, 2980, 3020, 3100]
        for i, price in enumerate(prices):
            PriceHistory.objects.create(
                asset=self.asset,
                price_usd=Decimal(price),
                volume_24h=Decimal('500000000'),
                market_cap=Decimal('360000000000'),
                timestamp=now + timezone.timedelta(minutes=i*10)
            )
    
    def test_get_ohlc_data(self):
        """Test récupération données OHLC"""
        response = self.client.get('/api/ohlc/ETH/?interval=1h&range=24h')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIsInstance(data, list)
        
        if len(data) > 0:
            candle = data[0]
            self.assertIn('open', candle)
            self.assertIn('close', candle)
            self.assertIn('high', candle)
            self.assertIn('low', candle)
            self.assertIn('timestamp', candle)
    
    def test_get_ohlc_invalid_asset(self):
        """Test erreur pour asset invalide"""
        response = self.client.get('/api/ohlc/NOTEXIST/?interval=1h&range=24h')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class HeatmapViewTest(TestCase):
    """Tests pour l'endpoint /api/heatmap/ (vue d'ensemble marché)"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Créer plusieurs assets avec prix
        assets_data = [
            ('bitcoin', 'BTC', 'Bitcoin', 50000),
            ('ethereum', 'ETH', 'Ethereum', 3000),
            ('cardano', 'ADA', 'Cardano', 0.5)
        ]
        
        now = timezone.now()
        for cg_id, symbol, name, price in assets_data:
            asset = Asset.objects.create(
                coingecko_id=cg_id,
                symbol=symbol,
                name=name
            )
            PriceHistory.objects.create(
                asset=asset,
                price_usd=Decimal(price),
                volume_24h=Decimal('1000000000'),
                market_cap=Decimal('500000000000'),
                price_change_percentage_1h=0.5,
                price_change_percentage_24h=2.3,
                price_change_percentage_7d=-1.2,
                timestamp=now
            )
    
    def test_get_heatmap_24h(self):
        """Test récupération heatmap 24h"""
        response = self.client.get('/api/heatmap/?range=24h')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertIsInstance(data, dict)
        self.assertIn('BTC', data)
        self.assertIn('ETH', data)
        self.assertIn('ADA', data)
        
        # Vérifier structure Bitcoin
        btc = data['BTC']
        self.assertEqual(btc['name'], 'Bitcoin')
        self.assertEqual(btc['price'], 50000.0)
        self.assertIn('percent_change_24h', btc)
    
    def test_get_heatmap_7d(self):
        """Test heatmap sur 7 jours"""
        response = self.client.get('/api/heatmap/?range=7d')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.json(), dict)
    
    def test_get_heatmap_invalid_range(self):
        """Test erreur pour range invalide"""
        response = self.client.get('/api/heatmap/?range=invalid')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class IndicatorsViewTest(TestCase):
    """Tests pour l'endpoint /api/indicators/{symbol}/ (indicateurs techniques)"""
    
    def setUp(self):
        self.client = APIClient()
        self.asset = Asset.objects.create(
            coingecko_id='bitcoin',
            symbol='BTC',
            name='Bitcoin'
        )
        
        # Créer 30 points de prix pour calculer SMA
        now = timezone.now()
        for i in range(30):
            PriceHistory.objects.create(
                asset=self.asset,
                price_usd=Decimal(50000 + i * 10),
                volume_24h=Decimal('1000000000'),
                market_cap=Decimal('950000000000'),
                timestamp=now - timezone.timedelta(hours=29-i)
            )
    
    def test_get_indicators(self):
        """Test calcul des indicateurs (SMA)"""
        response = self.client.get('/api/indicators/BTC/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertIn('SMA_7', data)
        self.assertIn('SMA_25', data)
        self.assertIsNotNone(data['SMA_7'])
        self.assertIsNotNone(data['SMA_25'])
    
    def test_get_indicators_invalid_symbol(self):
        """Test erreur pour symbole invalide"""
        response = self.client.get('/api/indicators/INVALID/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class AlertsAPITest(TestCase):
    """Tests pour les endpoints d'alertes"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.asset = Asset.objects.create(
            coingecko_id='bitcoin',
            symbol='BTC',
            name='Bitcoin'
        )
        
        # Authentifier le client
        self.client.force_authenticate(user=self.user)
    
    def test_create_alert(self):
        """Test création d'une alerte"""
        data = {
            'currency': 'BTC',
            'condition': 'above',
            'price': '60000.00'
        }
        
        response = self.client.post('/api/alerts/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Alert.objects.count(), 1)
        
        alert = Alert.objects.first()
        self.assertEqual(alert.user, self.user)
        self.assertEqual(alert.asset, self.asset)
        self.assertTrue(alert.is_active)
    
    def test_list_user_alerts(self):
        """Test liste des alertes de l'utilisateur"""
        Alert.objects.create(
            user=self.user,
            asset=self.asset,
            condition='above',
            target_price=Decimal('60000')
        )
        Alert.objects.create(
            user=self.user,
            asset=self.asset,
            condition='below',
            target_price=Decimal('40000')
        )
        
        response = self.client.get('/api/alerts/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 2)
    
    def test_delete_alert(self):
        """Test suppression d'une alerte"""
        alert = Alert.objects.create(
            user=self.user,
            asset=self.asset,
            condition='above',
            target_price=Decimal('60000')
        )
        
        response = self.client.delete(f'/api/alerts/{alert.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Alert.objects.count(), 0)
    
    def test_alerts_require_authentication(self):
        """Test que les alertes nécessitent authentification"""
        self.client.force_authenticate(user=None)
        
        response = self.client.get('/api/alerts/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class NotificationsAPITest(TestCase):
    """Tests pour les endpoints de notifications"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='notifuser',
            email='notif@example.com',
            password='pass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_list_notifications(self):
        """Test liste des notifications"""
        Notification.objects.create(
            user=self.user,
            message='Bitcoin price alert!',
            read=False
        )
        Notification.objects.create(
            user=self.user,
            message='Ethereum price alert!',
            read=True
        )
        
        response = self.client.get('/api/notifications/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 2)
    
    def test_mark_notification_as_read(self):
        """Test marquer notification comme lue"""
        notif = Notification.objects.create(
            user=self.user,
            message='Test notification',
            read=False
        )
        
        response = self.client.post(f'/api/notifications/{notif.id}/read/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notif.refresh_from_db()
        self.assertTrue(notif.read)
