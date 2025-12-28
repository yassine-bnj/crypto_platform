# serializers.py
from rest_framework import serializers
from .models import PriceHistory
from .models import Alert, Notification, Asset, VirtualHolding, VirtualTrade, VirtualPortfolio, VirtualFundingTransaction
from decimal import Decimal

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


class VirtualHoldingSerializer(serializers.ModelSerializer):
    symbol = serializers.CharField(source='asset.symbol', read_only=True)
    name = serializers.CharField(source='asset.name', read_only=True)
    latest_price = serializers.SerializerMethodField()
    market_value = serializers.SerializerMethodField()
    pnl_abs = serializers.SerializerMethodField()
    pnl_pct = serializers.SerializerMethodField()

    class Meta:
        model = VirtualHolding
        fields = ['symbol', 'name', 'quantity', 'avg_price', 'latest_price', 'market_value', 'pnl_abs', 'pnl_pct']
        read_only_fields = fields

    def _latest_price(self, holding: VirtualHolding):
        cache = self.context.get('price_cache', {}) if hasattr(self, 'context') else {}
        if holding.asset_id in cache:
            return cache[holding.asset_id]
        price = PriceHistory.objects.filter(asset=holding.asset).order_by('-timestamp').first()
        if price:
            value = Decimal(price.price_usd)
            cache[holding.asset_id] = value
            self.context['price_cache'] = cache
            return value
        return None

    def get_latest_price(self, obj: VirtualHolding):
        price = self._latest_price(obj)
        return float(price) if price is not None else None

    def get_market_value(self, obj: VirtualHolding):
        price = self._latest_price(obj)
        if price is None:
            return 0.0
        return float((price * obj.quantity).quantize(Decimal('0.01')))

    def get_pnl_abs(self, obj: VirtualHolding):
        price = self._latest_price(obj)
        if price is None:
            return 0.0
        pnl = (price - obj.avg_price) * obj.quantity
        return float(pnl.quantize(Decimal('0.01')))

    def get_pnl_pct(self, obj: VirtualHolding):
        price = self._latest_price(obj)
        if price is None or obj.avg_price == 0:
            return 0.0
        pct = ((price - obj.avg_price) / obj.avg_price) * 100
        return float(round(pct, 4))


class VirtualTradeSerializer(serializers.ModelSerializer):
    symbol = serializers.CharField(source='asset.symbol', read_only=True)
    name = serializers.CharField(source='asset.name', read_only=True)

    class Meta:
        model = VirtualTrade
        fields = ['id', 'side', 'symbol', 'name', 'quantity', 'price_usd', 'total_usd', 'created_at']
        read_only_fields = fields


class VirtualPortfolioSerializer(serializers.ModelSerializer):
    holdings = VirtualHoldingSerializer(many=True, read_only=True)
    holdings_value = serializers.SerializerMethodField()
    equity = serializers.SerializerMethodField()
    pnl = serializers.SerializerMethodField()
    pnl_pct = serializers.SerializerMethodField()

    class Meta:
        model = VirtualPortfolio
        fields = [
            'initial_balance',
            'cash_balance',
            'realized_pnl',
            'holdings_value',
            'equity',
            'pnl',
            'pnl_pct',
            'holdings',
        ]
        read_only_fields = fields

    def get_holdings_value(self, obj: VirtualPortfolio):
        total = Decimal('0')
        holdings = self.context.get('holdings') or obj.holdings.all()
        cache = self.context.get('price_cache', {})
        for holding in holdings:
            price = cache.get(holding.asset_id)
            if price is None:
                price_obj = PriceHistory.objects.filter(asset=holding.asset).order_by('-timestamp').first()
                price = Decimal(price_obj.price_usd) if price_obj else None
                cache[holding.asset_id] = price
            if price is not None:
                total += price * holding.quantity
        self.context['price_cache'] = cache
        return float(total.quantize(Decimal('0.01')))

    def get_equity(self, obj: VirtualPortfolio):
        holdings_value = Decimal(str(self.get_holdings_value(obj)))
        equity = holdings_value + obj.cash_balance
        return float(equity.quantize(Decimal('0.01')))

    def get_pnl(self, obj: VirtualPortfolio):
        equity = Decimal(str(self.get_equity(obj)))
        pnl = equity - obj.initial_balance
        return float(pnl.quantize(Decimal('0.01')))

    def get_pnl_pct(self, obj: VirtualPortfolio):
        pnl = Decimal(str(self.get_pnl(obj)))
        if obj.initial_balance == 0:
            return 0.0
        pct = (pnl / obj.initial_balance) * 100
        return float(round(pct, 4))


class VirtualFundingTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = VirtualFundingTransaction
        fields = ['id', 'direction', 'amount', 'created_at']
        read_only_fields = fields
