from celery import shared_task
import requests
from .models import CryptoPrice

@shared_task
def test_task():
    print("Celery marche bien !")
    return "OK"

@shared_task
def fetch_crypto_prices():
    print ("Fetching crypto prices...")
    url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {
        "vs_currency": "usd",
        "order": "market_cap_desc",
        "per_page": 100,   # nombre de cryptos à récupérer
        "page": 1,
        "sparkline": False
    }
    response = requests.get(url, params=params)
    data = response.json()
    print("Données reçues :", data)
    for coin in data:
        CryptoPrice.objects.update_or_create(
            symbol=coin["symbol"].upper(),
            defaults={
                "name": coin["name"],
                "price_usd": coin["current_price"],
                "volume_24h": coin["total_volume"],
                "market_cap": coin["market_cap"],
                "percent_change_1h": coin.get("price_change_percentage_1h_in_currency") or 0,
                "percent_change_24h": coin.get("price_change_percentage_24h") or 0,
                "percent_change_7d": coin.get("price_change_percentage_7d_in_currency") or 0
            }
        )
    return f"{len(data)} crypto prices updated."