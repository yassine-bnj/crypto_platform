# views.py
from datetime import timedelta
from django.utils.timezone import now
from django.contrib.auth import get_user_model, authenticate
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Asset, PriceHistory
from .serializers import PriceHistorySerializer

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

    try:
        asset = Asset.objects.get(symbol=symbol.upper())
    except Asset.DoesNotExist:
        return Response({"error": "Asset not found"}, status=404)

    prices = PriceHistory.objects.filter(
        asset=asset,
        timestamp__range=[start, end]
    ).order_by('timestamp')

    return Response(PriceHistorySerializer(prices, many=True).data)


@api_view(['GET'])
def ohlc_data(request, symbol):
    interval = request.GET.get("interval", "1h")
    range_param = request.GET.get("range", "24h")

    end = now()
    ranges = {
        "1h": end - timedelta(hours=1),
        "24h": end - timedelta(days=1),
        "7d": end - timedelta(days=7),
        "30d": end - timedelta(days=30),
    }
    start = ranges.get(range_param, end - timedelta(days=1))

    try:
        asset = Asset.objects.get(symbol=symbol.upper())
    except Asset.DoesNotExist:
        return Response({"error": "Asset not found"}, status=404)

    prices = PriceHistory.objects.filter(
        asset=asset,
        timestamp__range=[start, end]
    ).order_by('timestamp')

    if not prices.exists():
        return Response([])

    # Définir la taille du bucket (en minutes)
    bucket_minutes = {
        "1m": 1,
        "5m": 5,
        "15m": 15,
        "1h": 60,
        "4h": 240,
        "1d": 1440,
    }.get(interval, 60)

    from collections import defaultdict
    buckets = defaultdict(list)

    for p in prices:
        # Tronquer le timestamp à l'intervalle
        minutes = (p.timestamp.hour * 60 + p.timestamp.minute) // bucket_minutes * bucket_minutes
        bucket_time = p.timestamp.replace(
            hour=minutes // 60,
            minute=minutes % 60,
            second=0,
            microsecond=0
        )
        buckets[bucket_time].append(p)

    candles = []
    for bucket_start in sorted(buckets.keys()):
        group = buckets[bucket_start]
        prices_in_bucket = [float(p.price_usd) for p in group]
        candles.append({
            "timestamp": bucket_start.isoformat(),
            "open": prices_in_bucket[0],
            "close": prices_in_bucket[-1],
            "low": min(prices_in_bucket),
            "high": max(prices_in_bucket),
        })

    return Response(candles)


@api_view(["GET"])
def heatmap(request):
    range_param = request.GET.get("range", "24h")
    now_time = now()

    range_deltas = {
        "1h": timedelta(hours=1),
        "24h": timedelta(days=1),
        "7d": timedelta(days=7),
    }
    
    if range_param not in range_deltas:
        return Response({"error": "Invalid range"}, status=400)

    start_time = now_time - range_deltas[range_param]

    # Récupérer le dernier point de chaque actif dans la plage
    from django.db.models import Max
    latest_timestamps = PriceHistory.objects.filter(
        timestamp__gte=start_time
    ).values('asset').annotate(latest_ts=Max('timestamp'))

    # Créer une liste de (asset_id, latest_ts)
    latest_list = [(item['asset'], item['latest_ts']) for item in latest_timestamps]

    # Récupérer les objets PriceHistory correspondants
    from django.db.models import Q
    query = Q()
    for asset_id, ts in latest_list:
        query |= Q(asset_id=asset_id, timestamp=ts)

    latest_prices = PriceHistory.objects.filter(query).select_related('asset')

    data = {}
    for p in latest_prices:
        data[p.asset.symbol] = {
            "symbol": p.asset.symbol,
            "name": p.asset.name,
            "price": float(p.price_usd),
            "percent_change_1h": p.price_change_percentage_1h,
            "percent_change_24h": p.price_change_percentage_24h,
            "percent_change_7d": p.price_change_percentage_7d,
            "market_cap": float(p.market_cap),
        }

    return Response(data)


@api_view(['GET'])
def indicators(request, symbol):
    try:
        asset = Asset.objects.get(symbol=symbol.upper())
    except Asset.DoesNotExist:
        return Response({"error": "Asset not found"}, status=404)

    # Prendre les 100 derniers points (ou plus si besoin)
    prices = PriceHistory.objects.filter(
        asset=asset
    ).order_by("timestamp").values_list('price_usd', flat=True)

    values = [float(p) for p in prices]

    def sma(data, window):
        if len(data) < window:
            return None
        return sum(data[-window:]) / window

    return Response({
        "SMA_7": sma(values, 7),
        "SMA_25": sma(values, 25),
    })


@api_view(['POST'])
def register(request):
    name = request.data.get('name')
    email = request.data.get('email')
    password = request.data.get('password')

    if not name or not email or not password:
        return Response({'detail': 'Missing fields'}, status=status.HTTP_400_BAD_REQUEST)

    User = get_user_model()
    if User.objects.filter(email=email).exists():
        return Response({'detail': 'Email already in use'}, status=status.HTTP_400_BAD_REQUEST)

    # create a unique username based on email local-part
    base_username = email.split('@')[0]
    username = base_username
    i = 1
    while User.objects.filter(username=username).exists():
        username = f"{base_username}{i}"
        i += 1

    user = User(username=username, email=email, first_name=name)
    user.set_password(password)
    user.save()

    return Response({'detail': 'User created'}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({'detail': 'Missing credentials'}, status=status.HTTP_400_BAD_REQUEST)

    User = get_user_model()
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    user_auth = authenticate(username=user.username, password=password)
    if not user_auth:
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    refresh = RefreshToken.for_user(user_auth)
    return Response({'access': str(refresh.access_token), 'refresh': str(refresh)})