from datetime import timedelta
from django.utils.timezone import now
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import CryptoPrice
from .serializers import CryptoPriceSerializer
from django.utils import timezone

@api_view(['GET'])
def price_history(request, symbol):
    range_param = request.GET.get("range", "24h")
    end = now()

    ranges = {
        "1h": end - timedelta(hours=1),
        "6h": end - timedelta(hours=6),
        "24h": end - timedelta(days=1),
        "7d": end - timedelta(days=7),
        "30d": end - timedelta(days=30),
        "90d": end - timedelta(days=90),
    }

    start = ranges.get(range_param, end - timedelta(days=1))

    prices = CryptoPrice.objects.filter(
        symbol=symbol.upper(),
        last_updated__range=[start, end]
    ).order_by('last_updated')

    return Response(CryptoPriceSerializer(prices, many=True).data)

@api_view(['GET'])
def ohlc_data(request, symbol):
    interval = request.GET.get("interval", "1h")
    range_param = request.GET.get("range", "24h")

    # même logique que price_history pour la plage de temps
    end = now()
    ranges = {
        "1h": end - timedelta(hours=1),
        "24h": end - timedelta(days=1),
        "7d": end - timedelta(days=7),
        "30d": end - timedelta(days=30),
    }
    start = ranges.get(range_param)

    prices = CryptoPrice.objects.filter(
        symbol=symbol.upper(),
        last_updated__range=[start, end]
    ).order_by('last_updated')

    # grouper les données selon l’intervalle
    candles = []
    group = []

    current_bucket = None

    for p in prices:
        bucket = p.last_updated.replace(
            minute=(p.last_updated.minute // 1) * 1,  # à améliorer selon interval
            second=0, microsecond=0
        )

        if current_bucket is None:
            current_bucket = bucket

        if bucket != current_bucket:
            candles.append({
                "timestamp": current_bucket,
                "open": group[0].price,
                "close": group[-1].price,
                "low": min(x.price for x in group),
                "high": max(x.price for x in group),
            })
            group = []
            current_bucket = bucket

        group.append(p)

    return Response(candles)
@api_view(["GET"])
def heatmap(request):
    range_param = request.GET.get("range", "24h")

    now = timezone.now()

    if range_param == "24h":
        start_time = now - timedelta(hours=24)
    elif range_param == "7d":
        start_time = now - timedelta(days=7)
    elif range_param == "1h":
        start_time = now - timedelta(hours=1)
    else:
        return Response({"error": "Invalid range"}, status=400)

    prices = CryptoPrice.objects.filter(last_updated__gte=start_time)

    data = {}

    for p in prices:
        data[p.symbol] = {
            "symbol": p.symbol,
            "name": p.name,
            "price": p.price_usd,
            "percent_change_1h": p.percent_change_1h,
            "percent_change_24h": p.percent_change_24h,
            "percent_change_7d": p.percent_change_7d,
            "market_cap": p.market_cap,
        }

    return Response(data)

@api_view(['GET'])
def indicators(request, symbol):
    prices = CryptoPrice.objects.filter(symbol=symbol.upper()).order_by("last_updated")

    values = [p.price_usd for p in prices]

    def sma(data, window):
        if len(data) < window:
            return None
        return sum(data[-window:]) / window

    return Response({
        "SMA_7": sma(values, 7),
        "SMA_25": sma(values, 25),
    })
