"""
Tests unitaires pour les modèles (stockage)
Couvre: Asset, PriceHistory, Alert, VirtualPortfolio
"""
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from core.models import (
    Asset, PriceHistory, Alert, Notification,
    VirtualPortfolio, VirtualHolding, VirtualTrade, VirtualFundingTransaction
)

User = get_user_model()


class AssetModelTest(TestCase):
    """Tests pour le modèle Asset (stockage crypto de base)"""
    
    def test_create_asset(self):
        """Test création d'un actif crypto"""
        asset = Asset.objects.create(
            coingecko_id='bitcoin',
            symbol='BTC',
            name='Bitcoin'
        )
        self.assertEqual(asset.symbol, 'BTC')
        self.assertEqual(str(asset), 'Bitcoin (BTC)')
    
    def test_asset_unique_coingecko_id(self):
        """Test contrainte d'unicité sur coingecko_id"""
        Asset.objects.create(coingecko_id='bitcoin', symbol='BTC', name='Bitcoin')
        
        with self.assertRaises(Exception):
            Asset.objects.create(coingecko_id='bitcoin', symbol='BTC2', name='Bitcoin2')


class PriceHistoryModelTest(TestCase):
    """Tests pour le modèle PriceHistory (stockage prix temporel)"""
    
    def setUp(self):
        self.asset = Asset.objects.create(
            coingecko_id='bitcoin',
            symbol='BTC',
            name='Bitcoin'
        )
    
    def test_create_price_history(self):
        """Test création d'un point d'historique de prix"""
        timestamp = timezone.now()
        price = PriceHistory.objects.create(
            asset=self.asset,
            price_usd=Decimal('50000.12345678'),
            volume_24h=Decimal('1000000000.00'),
            market_cap=Decimal('950000000000.00'),
            price_change_percentage_1h=0.5,
            price_change_percentage_24h=2.3,
            price_change_percentage_7d=-1.2,
            timestamp=timestamp
        )
        
        self.assertEqual(price.asset, self.asset)
        self.assertEqual(price.price_usd, Decimal('50000.12345678'))
        self.assertIn('BTC', str(price))
    
    def test_price_history_unique_together(self):
        """Test contrainte unique sur (asset, timestamp)"""
        timestamp = timezone.now()
        PriceHistory.objects.create(
            asset=self.asset,
            price_usd=Decimal('50000'),
            volume_24h=Decimal('1000000000'),
            market_cap=Decimal('950000000000'),
            timestamp=timestamp
        )
        
        # Même timestamp pour le même asset devrait échouer
        with self.assertRaises(Exception):
            PriceHistory.objects.create(
                asset=self.asset,
                price_usd=Decimal('50001'),
                volume_24h=Decimal('1000000001'),
                market_cap=Decimal('950000000001'),
                timestamp=timestamp
            )
    
    def test_price_history_ordering(self):
        """Test ordre décroissant par timestamp"""
        now = timezone.now()
        p1 = PriceHistory.objects.create(
            asset=self.asset,
            price_usd=Decimal('50000'),
            volume_24h=Decimal('1000000000'),
            market_cap=Decimal('950000000000'),
            timestamp=now - timezone.timedelta(hours=2)
        )
        p2 = PriceHistory.objects.create(
            asset=self.asset,
            price_usd=Decimal('51000'),
            volume_24h=Decimal('1100000000'),
            market_cap=Decimal('960000000000'),
            timestamp=now - timezone.timedelta(hours=1)
        )
        
        prices = list(PriceHistory.objects.all())
        self.assertEqual(prices[0], p2)  # Plus récent en premier
        self.assertEqual(prices[1], p1)


class AlertModelTest(TestCase):
    """Tests pour les alertes de prix"""
    
    def setUp(self):
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
    
    def test_create_alert(self):
        """Test création d'une alerte de prix"""
        alert = Alert.objects.create(
            user=self.user,
            asset=self.asset,
            condition='above',
            target_price=Decimal('60000'),
            is_active=True
        )
        
        self.assertTrue(alert.is_active)
        self.assertIsNone(alert.triggered_at)
        self.assertIn('Alert', str(alert))
    
    def test_alert_conditions(self):
        """Test conditions valides pour les alertes"""
        alert_above = Alert.objects.create(
            user=self.user,
            asset=self.asset,
            condition='above',
            target_price=Decimal('60000')
        )
        alert_below = Alert.objects.create(
            user=self.user,
            asset=self.asset,
            condition='below',
            target_price=Decimal('40000')
        )
        
        self.assertEqual(alert_above.condition, 'above')
        self.assertEqual(alert_below.condition, 'below')


class VirtualPortfolioModelTest(TestCase):
    """Tests pour le portfolio virtuel (paper trading)"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='trader',
            email='trader@example.com',
            password='pass123'
        )
    
    def test_create_portfolio(self):
        """Test création d'un portfolio virtuel"""
        portfolio = VirtualPortfolio.objects.create(
            user=self.user,
            initial_balance=Decimal('100000.00'),
            cash_balance=Decimal('100000.00')
        )
        
        self.assertEqual(portfolio.cash_balance, Decimal('100000.00'))
        self.assertEqual(portfolio.realized_pnl, Decimal('0'))
        self.assertIn('Paper portfolio', str(portfolio))
    
    def test_portfolio_one_to_one(self):
        """Test relation OneToOne avec User"""
        VirtualPortfolio.objects.create(user=self.user)
        
        # Créer un deuxième portfolio pour le même user devrait échouer
        with self.assertRaises(Exception):
            VirtualPortfolio.objects.create(user=self.user)


class NotificationModelTest(TestCase):
    """Tests pour les notifications"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='notifuser',
            email='notif@example.com',
            password='pass123'
        )
    
    def test_create_notification(self):
        """Test création d'une notification"""
        notif = Notification.objects.create(
            user=self.user,
            message='Bitcoin price alert triggered!',
            read=False
        )
        
        self.assertFalse(notif.read)
        self.assertIn('Notification', str(notif))
