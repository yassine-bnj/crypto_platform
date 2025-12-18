# serializers.py
from rest_framework import serializers
from .models import PriceHistory

class PriceHistorySerializer(serializers.ModelSerializer):
    symbol = serializers.CharField(source='asset.symbol')
    name = serializers.CharField(source='asset.name')

    class Meta:
        model = PriceHistory
        fields = [
            'symbol', 'name', 'price_usd', 'volume_24h', 'market_cap',
            'price_change_percentage_1h', 'price_change_percentage_24h', 'price_change_percentage_7d',
            'timestamp'
        ]