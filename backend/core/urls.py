# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('price-history/<str:symbol>/', views.price_history, name='price_history'),
    path('ohlc/<str:symbol>/', views.ohlc_data, name='ohlc_data'),
    path('heatmap/', views.heatmap, name='heatmap'),
    path('indicators/<str:symbol>/', views.indicators, name='indicators'),
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login_view, name='login'),
]