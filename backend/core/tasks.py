# tasks.py
from celery import shared_task
import requests
from django.utils.dateparse import parse_datetime
from .models import Asset, PriceHistory
from .models import Alert, Notification
from django.utils import timezone
from django.conf import settings
from .utils import send_notification_email

@shared_task
def test_task():
    print("Celery marche bien !")
    return "OK"

@shared_task
def fetch_crypto_prices():
    print("Fetching crypto prices from CoinGecko...")
    url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {
        "vs_currency": "usd",
        "order": "market_cap_desc",
        "per_page": 100,
        "page": 1,
        "sparkline": False,
        "price_change_percentage": "1h,24h,7d"
    }
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        print(f"Données reçues : {len(data)} cryptos")
    except Exception as e:
        print(f"Erreur lors de la requête CoinGecko : {e}")
        return f"Erreur : {e}"

    for coin in data:
        try:
            # 1. Créer/mettre à jour l'actif
            asset, created = Asset.objects.update_or_create(
                coingecko_id=coin["id"],
                defaults={
                    "symbol": coin["symbol"].upper(),
                    "name": coin["name"],
                }
            )

            # 2. Parser le timestamp (format ISO 8601)
            last_updated = parse_datetime(coin["last_updated"])
            if not last_updated:
                continue  # saute si timestamp invalide

            # 3. Ajouter un point historique (sans écraser)
            PriceHistory.objects.get_or_create(
                asset=asset,
                timestamp=last_updated,
                defaults={
                    "price_usd": coin["current_price"],
                    "volume_24h": coin["total_volume"],
                    "market_cap": coin["market_cap"],
                    "price_change_percentage_1h": coin.get("price_change_percentage_1h_in_currency") or 0,
                    "price_change_percentage_24h": coin.get("price_change_percentage_24h_in_currency") or 0,
                    "price_change_percentage_7d": coin.get("price_change_percentage_7d_in_currency") or 0,
                }
            )
        except Exception as e:
            print(f"Erreur lors du traitement de {coin.get('id')}: {e}")
            continue

    return f"{len(data)} actifs mis à jour avec historique."


@shared_task
def check_alerts():
    """Check active alerts against the latest stored price and create notifications."""
    alerts = Alert.objects.filter(is_active=True).select_related('asset', 'user')
    count = 0
    for alert in alerts:
        # get latest price point for asset
        latest = PriceHistory.objects.filter(asset=alert.asset).order_by('-timestamp').first()
        if not latest:
            continue

        try:
            current_price = float(latest.price_usd)
        except Exception:
            continue

        triggered = False
        if alert.condition == 'above' and current_price >= float(alert.target_price):
            triggered = True
        if alert.condition == 'below' and current_price <= float(alert.target_price):
            triggered = True

        if triggered:
            # create notification and disable alert
            msg = f"{alert.asset.name} ({alert.asset.symbol}) price is now ${current_price:.2f} — condition {alert.condition} {float(alert.target_price)} met."
            Notification.objects.create(user=alert.user, message=msg)
            # send email to user if email present (delegated to utils)
            try:
                send_notification_email(alert.user, f"Price alert: {alert.asset.symbol} {alert.condition}", msg)
            except Exception as e:
                # the utility handles logging; ensure task doesn't crash
                print(f"Email utility raised for alert {alert.id}: {e}")
            alert.is_active = False
            alert.triggered_at = timezone.now()
            alert.save()
            count += 1

    return f"Checked {alerts.count()} alerts, triggered {count}" 