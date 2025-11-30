from django.urls import path
from . import views

urlpatterns = [
    # path("", views.index, name="index"),
    # path("latest/<str:symbol>/", views.latest_price, name="latest-price"),
    path("history/<str:symbol>/", views.price_history, name="price-history"),
    path("ohlc/<str:symbol>/", views.ohlc_data, name="ohlc-data"),
    path("heatmap/", views.heatmap, name="heatmap"),
    path("indicators/<str:symbol>/", views.indicators, name="indicators"),
    # path("symbols/", views.symbols_list, name="symbols-list"),
]
