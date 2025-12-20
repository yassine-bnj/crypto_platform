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
    path('auth/refresh/', views.refresh_token, name='token_refresh'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/change-password/', views.change_password, name='change_password'),
    path('auth/update-profile/', views.update_profile, name='update_profile'),
    path('auth/me/', views.me, name='me'),
]