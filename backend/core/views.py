# views.py
from datetime import timedelta
from django.utils.timezone import now
from django.contrib.auth import get_user_model, authenticate
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes
from .models import Asset, PriceHistory
from .serializers import PriceHistorySerializer
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

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
    access = str(refresh.access_token)
    refresh_token = str(refresh)

    response = Response({'access': access})
    # set httpOnly refresh cookie
    # For development on localhost, secure=False. Set secure=True in production with HTTPS.
    response.set_cookie(
        'refresh_token',
        refresh_token,
        httponly=True,
        secure=False,
        samesite='Lax',
        path='/',
    )
    return response


@api_view(['POST'])
def refresh_token(request):
    # Read refresh token from cookie (httpOnly) or body fallback
    refresh_token = request.COOKIES.get('refresh_token') or request.data.get('refresh')
    if not refresh_token:
        return Response({'detail': 'Missing refresh token'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        refresh = RefreshToken(refresh_token)
        # Optionally rotate: issue new refresh and set cookie - for now just return access
        access = str(refresh.access_token)
        response = Response({'access': access})
        return response
    except Exception:
        return Response({'detail': 'Invalid refresh token'}, status=status.HTTP_401_UNAUTHORIZED)



@api_view(['POST'])
def logout_view(request):
    # blacklist refresh token if provided in cookie or body, then clear cookie
    token = request.COOKIES.get('refresh_token') or request.data.get('refresh')
    if token:
        try:
            rt = RefreshToken(token)
            # blacklist (requires token_blacklist app)
            try:
                rt.blacklist()
            except AttributeError:
                # blacklist not enabled/available
                pass
        except Exception:
            pass

    response = Response({'detail': 'Logged out'}, status=status.HTTP_200_OK)
    # delete cookie
    response.delete_cookie('refresh_token', path='/')
    return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')

    if not current_password or not new_password:
        return Response({'detail': 'Missing fields'}, status=status.HTTP_400_BAD_REQUEST)

    user = request.user
    if not user.check_password(current_password):
        return Response({'detail': 'Current password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()

    # Blacklist any outstanding refresh tokens for this user so password change invalidates sessions
    try:
        for token in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=token)
    except Exception:
        # token blacklisting may not be available; ignore errors
        pass

    response = Response({'detail': 'Password changed'}, status=status.HTTP_200_OK)
    # remove refresh cookie so client must re-login to obtain a new refresh token
    response.delete_cookie('refresh_token', path='/')
    return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update user's profile: first_name (full name), email, phone, country"""
    user = request.user
    full_name = request.data.get('full_name')
    email = request.data.get('email')
    phone = request.data.get('phone')
    country = request.data.get('country')

    # Validate required fields (email optional but if provided must be unique)
    if email and email != user.email:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if User.objects.filter(email=email).exclude(pk=user.pk).exists():
            return Response({'detail': 'Email already in use'}, status=status.HTTP_400_BAD_REQUEST)

    if full_name is not None:
        user.first_name = full_name
    if email is not None:
        user.email = email
    if phone is not None:
        user.phone = phone
    if country is not None:
        user.country = country

    user.save()

    return Response({'id': user.id, 'email': user.email, 'name': user.first_name, 'phone': user.phone, 'country': user.country})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    return Response({'id': user.id, 'email': user.email, 'name': user.first_name, 'phone': getattr(user, 'phone', None), 'country': getattr(user, 'country', None)})