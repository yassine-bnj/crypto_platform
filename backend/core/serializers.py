# serializers.py
from rest_framework import serializers
from .models import PriceHistory
from .models import Alert, Notification, Asset

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


class AlertSerializer(serializers.ModelSerializer):
    asset_symbol = serializers.CharField(source='asset.symbol', read_only=True)

    class Meta:
        model = Alert
        fields = ['id', 'user', 'asset', 'asset_symbol', 'condition', 'target_price', 'is_active', 'created_at', 'triggered_at']
        read_only_fields = ['id', 'user', 'asset_symbol', 'created_at', 'triggered_at']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'message', 'read', 'created_at']
        read_only_fields = ['id', 'user', 'message', 'created_at']