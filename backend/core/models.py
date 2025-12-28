# models.py
from decimal import Decimal
from django.db import models
from django.contrib.auth.models import AbstractUser

# ====== Modèle utilisateur  ======
class User(AbstractUser):
    role = models.CharField(max_length=10, default='user')
    phone = models.CharField(max_length=30, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)

# ====== Modèle Asset : données fixes sur la crypto ======
class Asset(models.Model):
    coingecko_id = models.CharField(max_length=100, unique=True)  # ex: 'bitcoin'
    symbol = models.CharField(max_length=20)                      # ex: 'btc'
    name = models.CharField(max_length=100)                       # ex: 'Bitcoin'

    def __str__(self):
        return f"{self.name} ({self.symbol.upper()})"

# ====== Modèle PriceHistory : données temporelles ======
class PriceHistory(models.Model):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='price_history')
    
    price_usd = models.DecimalField(max_digits=25, decimal_places=8)
    volume_24h = models.DecimalField(max_digits=30, decimal_places=2)
    market_cap = models.DecimalField(max_digits=30, decimal_places=2)
    
    price_change_percentage_1h = models.FloatField(null=True)
    price_change_percentage_24h = models.FloatField(null=True)
    price_change_percentage_7d = models.FloatField(null=True)
    
    timestamp = models.DateTimeField()  # ⚠️ Important : pas auto_now_add !

    class Meta:
        ordering = ['-timestamp']
        unique_together = ('asset', 'timestamp')
        indexes = [
            models.Index(fields=['asset', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        return f"{self.asset.symbol.upper()} @ {self.timestamp}: ${self.price_usd}"


# ====== Alerts & Notifications ======
from django.conf import settings


class Alert(models.Model):
    CONDITION_CHOICES = [
        ("above", "Above"),
        ("below", "Below"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='alerts')
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='alerts')
    condition = models.CharField(max_length=10, choices=CONDITION_CHOICES)
    target_price = models.DecimalField(max_digits=25, decimal_places=8)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    triggered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Alert({self.user}, {self.asset.symbol} {self.condition} {self.target_price})"


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification({self.user}, read={self.read})"


# ====== Virtual Portfolio (paper trading) ======
class VirtualPortfolio(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='virtual_portfolio')
    initial_balance = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal("100000.00"))
    cash_balance = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal("100000.00"))
    realized_pnl = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal("0"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Paper portfolio for {self.user}"  # simple admin label


class VirtualHolding(models.Model):
    portfolio = models.ForeignKey(VirtualPortfolio, on_delete=models.CASCADE, related_name='holdings')
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='virtual_holdings')
    quantity = models.DecimalField(max_digits=30, decimal_places=10, default=Decimal("0"))
    avg_price = models.DecimalField(max_digits=25, decimal_places=8, default=Decimal("0"))

    class Meta:
        unique_together = ('portfolio', 'asset')

    def __str__(self):
        return f"{self.asset.symbol} ({self.quantity})"


class VirtualTrade(models.Model):
    SIDE_CHOICES = [
        ("buy", "Buy"),
        ("sell", "Sell"),
    ]

    portfolio = models.ForeignKey(VirtualPortfolio, on_delete=models.CASCADE, related_name='trades')
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='virtual_trades')
    side = models.CharField(max_length=4, choices=SIDE_CHOICES)
    quantity = models.DecimalField(max_digits=30, decimal_places=10)
    price_usd = models.DecimalField(max_digits=25, decimal_places=8)
    total_usd = models.DecimalField(max_digits=25, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.side.upper()} {self.quantity} {self.asset.symbol}"


class VirtualFundingTransaction(models.Model):
    DIRECTION_CHOICES = [
        ("deposit", "Deposit"),
        ("withdraw", "Withdraw"),
    ]

    portfolio = models.ForeignKey(VirtualPortfolio, on_delete=models.CASCADE, related_name='funding_transactions')
    direction = models.CharField(max_length=8, choices=DIRECTION_CHOICES)
    amount = models.DecimalField(max_digits=20, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.direction.upper()} {self.amount}"
