from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    role = models.CharField(max_length=10, default='user')
from django.db import models

class CryptoPrice(models.Model):
    symbol = models.CharField(max_length=20)  # ex: BTC, ETH
    name = models.CharField(max_length=50)    # ex: Bitcoin
    price_usd = models.FloatField()
    volume_24h = models.FloatField()
    market_cap = models.FloatField()
    percent_change_1h = models.FloatField()
    percent_change_24h = models.FloatField()
    percent_change_7d = models.FloatField()
    last_updated = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.symbol} - {self.price_usd}$"
