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
from .models import Asset, PriceHistory, VirtualPortfolio, VirtualHolding, VirtualTrade, VirtualFundingTransaction
from .serializers import PriceHistorySerializer
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from .models import Alert, Notification
from .serializers import AlertSerializer, NotificationSerializer, VirtualPortfolioSerializer, VirtualTradeSerializer, VirtualFundingTransactionSerializer
from decimal import Decimal
from django.shortcuts import get_object_or_404
from django.db import transaction

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
        max_age=86400,  # 24 hours
    )
    return response


@api_view(['POST'])
def admin_login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({'detail': 'Missing credentials'}, status=status.HTTP_400_BAD_REQUEST)

    User = get_user_model()
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    # Check if user is staff or superuser
    if not (user.is_staff or user.is_superuser):
        return Response({'detail': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    user_auth = authenticate(username=user.username, password=password)
    if not user_auth:
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    refresh = RefreshToken.for_user(user_auth)
    access = str(refresh.access_token)
    refresh_token = str(refresh)

    response = Response({'access': access})
    # set httpOnly refresh cookie
    response.set_cookie(
        'refresh_token',
        refresh_token,
        httponly=True,
        secure=False,
        samesite='Lax',
        path='/',
        max_age=86400,  # 24 hours
    )
    return response


@api_view(['POST'])
def refresh_token(request):
    # Read refresh token from cookie (httpOnly) or body fallback
    refresh_token_str = request.COOKIES.get('refresh_token') or request.data.get('refresh')
    print(f"[Refresh] Cookie refresh_token exists: {'refresh_token' in request.COOKIES}")
    print(f"[Refresh] Body refresh token exists: {'refresh' in request.data}")
    
    if not refresh_token_str:
        print("[Refresh] Missing refresh token in both cookie and body")
        return Response({'detail': 'Missing refresh token'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        refresh = RefreshToken(refresh_token_str)
        # Generate new access token
        access = str(refresh.access_token)
        
        # Optional: rotate refresh token (generate new one)
        new_refresh = str(refresh)
        
        response = Response({'access': access})
        # Set new refresh token in httpOnly cookie
        response.set_cookie(
            'refresh_token',
            new_refresh,
            httponly=True,
            secure=False,
            samesite='Lax',
            path='/',
            max_age=86400,  # 24 hours
        )
        print(f"[Refresh] Success: issued new access token")
        return response
    except Exception as e:
        print(f"[Refresh Token Error] {str(e)}")
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
    return Response({
        'id': user.id, 
        'email': user.email, 
        'name': user.first_name, 
        'phone': getattr(user, 'phone', None), 
        'country': getattr(user, 'country', None),
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser
    })


# Alerts API
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def alerts_list_create(request):
    user = request.user
    if request.method == 'GET':
        alerts = Alert.objects.filter(user=user).select_related('asset')
        return Response(AlertSerializer(alerts, many=True).data)

    # POST -> create
    data = request.data
    currency = data.get('currency') or data.get('asset') or data.get('symbol')
    price = data.get('price') or data.get('target_price')
    condition = data.get('condition')

    if not currency or not price or not condition:
        return Response({'detail': 'Missing fields'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        asset = Asset.objects.get(symbol=currency.upper())
    except Asset.DoesNotExist:
        return Response({'detail': 'Asset not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        target_price = Decimal(str(price))
    except Exception:
        return Response({'detail': 'Invalid price'}, status=status.HTTP_400_BAD_REQUEST)

    alert = Alert.objects.create(user=user, asset=asset, condition=condition, target_price=target_price)
    return Response(AlertSerializer(alert).data, status=status.HTTP_201_CREATED)


@api_view(['DELETE', 'PATCH'])
@permission_classes([IsAuthenticated])
def alert_detail(request, pk):
    user = request.user
    alert = get_object_or_404(Alert, pk=pk, user=user)

    if request.method == 'DELETE':
        alert.delete()
        return Response({'detail': 'Alert deleted'}, status=status.HTTP_200_OK)

    # PATCH: allow toggling active state
    is_active = request.data.get('is_active')
    if is_active is not None:
        alert.is_active = bool(is_active)
        alert.save()
        return Response(AlertSerializer(alert).data)

    return Response({'detail': 'No changes provided'}, status=status.HTTP_400_BAD_REQUEST)


# Notifications
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications_list(request):
    user = request.user
    notes = Notification.objects.filter(user=user)
    return Response(NotificationSerializer(notes, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def notification_mark_read(request, pk):
    user = request.user
    note = get_object_or_404(Notification, pk=pk, user=user)
    note.read = True
    note.save()
    return Response(NotificationSerializer(note).data)


@api_view(['GET'])
def assets_list(request):
    """
    Return list of available crypto assets ordered by popularity/market cap
    """
    assets = Asset.objects.all().order_by('id')  # Or order by market_cap if field exists
    data = [
        {
            'symbol': asset.symbol.upper(),
            'name': asset.name,
        }
        for asset in assets
    ]
    return Response(data)


# ====== Virtual portfolio (paper trading) ======

def _get_or_create_virtual_portfolio(user):
    portfolio, _ = VirtualPortfolio.objects.get_or_create(
        user=user,
        defaults={
            'initial_balance': Decimal('100000.00'),
            'cash_balance': Decimal('100000.00'),
        },
    )
    return portfolio


def _latest_price(asset):
    last_price = PriceHistory.objects.filter(asset=asset).order_by('-timestamp').first()
    return Decimal(last_price.price_usd) if last_price else None


def _portfolio_payload(portfolio: VirtualPortfolio):
    holdings = list(VirtualHolding.objects.filter(portfolio=portfolio).select_related('asset'))
    price_cache = {}
    for holding in holdings:
        if holding.asset_id not in price_cache:
            price_cache[holding.asset_id] = _latest_price(holding.asset)

    portfolio._prefetched_objects_cache = {'holdings': holdings}
    serializer = VirtualPortfolioSerializer(
        portfolio,
        context={'price_cache': price_cache, 'holdings': holdings},
    )
    return serializer.data


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def virtual_portfolio_summary(request):
    portfolio = _get_or_create_virtual_portfolio(request.user)
    return Response(_portfolio_payload(portfolio))


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def virtual_portfolio_trades(request):
    portfolio = _get_or_create_virtual_portfolio(request.user)

    if request.method == 'GET':
        trades = VirtualTrade.objects.filter(portfolio=portfolio).select_related('asset')
        return Response(VirtualTradeSerializer(trades, many=True).data)

    # POST => place simulated trade
    side = (request.data.get('side') or '').lower()
    symbol = request.data.get('symbol') or request.data.get('asset')
    quantity_raw = request.data.get('quantity')
    price_raw = request.data.get('price')

    if side not in ['buy', 'sell']:
        return Response({'detail': 'Invalid side, must be buy or sell'}, status=status.HTTP_400_BAD_REQUEST)
    if not symbol or quantity_raw is None:
        return Response({'detail': 'symbol and quantity are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        quantity = Decimal(str(quantity_raw))
    except Exception:
        return Response({'detail': 'Invalid quantity'}, status=status.HTTP_400_BAD_REQUEST)

    if quantity <= 0:
        return Response({'detail': 'Quantity must be positive'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        asset = Asset.objects.get(symbol=symbol.upper())
    except Asset.DoesNotExist:
        return Response({'detail': 'Asset not found'}, status=status.HTTP_404_NOT_FOUND)

    price = None
    if price_raw is not None:
        try:
            price = Decimal(str(price_raw))
        except Exception:
            return Response({'detail': 'Invalid price'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        price = _latest_price(asset)

    if price is None:
        return Response({'detail': 'No price available for this asset'}, status=status.HTTP_400_BAD_REQUEST)

    total = (price * quantity).quantize(Decimal('0.01'))

    with transaction.atomic():
        portfolio = VirtualPortfolio.objects.select_for_update().get(pk=portfolio.pk)

        if side == 'buy':
            if portfolio.cash_balance < total:
                return Response({'detail': 'Insufficient virtual cash'}, status=status.HTTP_400_BAD_REQUEST)

            holding, _ = VirtualHolding.objects.select_for_update().get_or_create(
                portfolio=portfolio,
                asset=asset,
                defaults={'quantity': Decimal('0'), 'avg_price': price},
            )

            new_qty = holding.quantity + quantity
            # Calculate new average price using exact price, not rounded total
            new_avg = ((holding.quantity * holding.avg_price) + (price * quantity)) / new_qty
            holding.quantity = new_qty
            holding.avg_price = new_avg.quantize(Decimal('0.00000001'))
            holding.save()

            portfolio.cash_balance = (portfolio.cash_balance - total).quantize(Decimal('0.01'))
            portfolio.save()

        else:  # sell
            try:
                holding = VirtualHolding.objects.select_for_update().get(portfolio=portfolio, asset=asset)
            except VirtualHolding.DoesNotExist:
                return Response({'detail': 'Nothing to sell for this asset'}, status=status.HTTP_400_BAD_REQUEST)

            if holding.quantity < quantity:
                return Response({'detail': 'Sell quantity exceeds holding'}, status=status.HTTP_400_BAD_REQUEST)

            new_qty = holding.quantity - quantity
            # Calculate realized profit using exact price
            realized = (price - holding.avg_price) * quantity

            portfolio.cash_balance = (portfolio.cash_balance + total).quantize(Decimal('0.01'))
            portfolio.realized_pnl = (portfolio.realized_pnl + realized).quantize(Decimal('0.01'))

            if new_qty == 0:
                holding.delete()
            else:
                holding.quantity = new_qty
                holding.save()

            portfolio.save()

        trade = VirtualTrade.objects.create(
            portfolio=portfolio,
            asset=asset,
            side=side,
            quantity=quantity,
            price_usd=price,
            total_usd=total,
        )

    refreshed = VirtualPortfolio.objects.get(pk=portfolio.pk)
    payload = {
        'trade': VirtualTradeSerializer(trade).data,
        'portfolio': _portfolio_payload(refreshed),
    }
    return Response(payload, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def virtual_portfolio_fund(request):
    portfolio = _get_or_create_virtual_portfolio(request.user)
    direction = (request.data.get('direction') or 'deposit').lower()
    amount_raw = request.data.get('amount')

    if amount_raw is None:
        return Response({'detail': 'amount is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        amount = Decimal(str(amount_raw))
    except Exception:
        return Response({'detail': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)

    if amount <= 0:
        return Response({'detail': 'Amount must be positive'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        portfolio = VirtualPortfolio.objects.select_for_update().get(pk=portfolio.pk)

        if direction == 'deposit':
            portfolio.cash_balance = (portfolio.cash_balance + amount).quantize(Decimal('0.01'))
            portfolio.initial_balance = (portfolio.initial_balance + amount).quantize(Decimal('0.01'))
        elif direction == 'withdraw':
            if amount > portfolio.cash_balance:
                return Response({'detail': 'Insufficient virtual cash'}, status=status.HTTP_400_BAD_REQUEST)
            portfolio.cash_balance = (portfolio.cash_balance - amount).quantize(Decimal('0.01'))
            portfolio.initial_balance = (portfolio.initial_balance - amount).quantize(Decimal('0.01'))
            if portfolio.initial_balance < 0:
                portfolio.initial_balance = Decimal('0.00')
        else:
            return Response({'detail': 'Invalid direction, use deposit or withdraw'}, status=status.HTTP_400_BAD_REQUEST)

        portfolio.save()

        # Create funding transaction record
        VirtualFundingTransaction.objects.create(
            portfolio=portfolio,
            direction=direction,
            amount=amount,
        )

    refreshed = VirtualPortfolio.objects.get(pk=portfolio.pk)
    return Response({'portfolio': _portfolio_payload(refreshed)})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def virtual_portfolio_funding_history(request):
    portfolio = _get_or_create_virtual_portfolio(request.user)
    transactions = VirtualFundingTransaction.objects.filter(portfolio=portfolio)
    return Response(VirtualFundingTransactionSerializer(transactions, many=True).data)


@api_view(['GET'])
def assets_list(request):
    """
    Return list of available crypto assets ordered by popularity/market cap
    """
    assets = Asset.objects.all().order_by('id')
    data = [
        {
            'id': asset.id,
            'symbol': asset.symbol.upper(),
            'name': asset.name,
        }
        for asset in assets
    ]
    return Response(data)


@api_view(['GET'])
def asset_current_price(request, symbol):
    """Return the latest known price for a given asset symbol."""
    try:
        asset = Asset.objects.get(symbol=symbol.upper())
    except Asset.DoesNotExist:
        return Response({'detail': 'Asset not found'}, status=status.HTTP_404_NOT_FOUND)

    price_obj = PriceHistory.objects.filter(asset=asset).order_by('-timestamp').first()
    if not price_obj:
        return Response({'detail': 'No price data available'}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'symbol': asset.symbol.upper(),
        'name': asset.name,
        'price': float(price_obj.price_usd),
        'timestamp': price_obj.timestamp.isoformat(),
    })


# Admin Users Management
@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def users_list(request):
    """List all users or delete a user (admin only)"""
    User = get_user_model()
    
    # Check if user is admin or superuser
    if not (request.user.is_staff or request.user.is_superuser):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        # Get all users except admin/superuser accounts
        users = User.objects.exclude(is_staff=True, is_superuser=True).values('id', 'email', 'username', 'first_name', 'last_name', 'date_joined', 'is_active', 'is_staff', 'is_superuser')
        user_list = []
        for user in users:
            # Get portfolio value for each user
            try:
                portfolio = VirtualPortfolio.objects.get(user_id=user['id'])
                # Calculate equity: cash_balance + value of all holdings
                holdings_value = Decimal('0')
                for holding in portfolio.holdings.all():
                    # Get latest price for this asset
                    try:
                        latest_price = PriceHistory.objects.filter(asset=holding.asset).latest('timestamp')
                        holdings_value += holding.quantity * Decimal(str(latest_price.price_usd))
                    except PriceHistory.DoesNotExist:
                        pass
                equity = float(portfolio.cash_balance + holdings_value)
            except VirtualPortfolio.DoesNotExist:
                equity = 0.0
            
            user_list.append({
                'id': user['id'],
                'email': user['email'],
                'username': user['username'],
                'full_name': f"{user['first_name']} {user['last_name']}".strip() or 'N/A',
                'join_date': user['date_joined'].isoformat(),
                'status': 'active' if user['is_active'] else 'inactive',
                'portfolio_value': f"${equity:,.2f}",
                'is_admin': user['is_staff'] or user['is_superuser'],
            })
        return Response(user_list)
    
    elif request.method == 'DELETE':
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
            user.delete()
            return Response({'detail': 'User deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def user_update_status(request, user_id):
    """Update user status (active/inactive)"""
    User = get_user_model()
    
    # Check if user is admin or superuser
    if not (request.user.is_staff or request.user.is_superuser):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    is_active = request.data.get('is_active')
    if is_active is not None:
        user.is_active = is_active
        user.save()
        return Response({'detail': 'User status updated'})
    
    return Response({'error': 'is_active field required'}, status=status.HTTP_400_BAD_REQUEST)