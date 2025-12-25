# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('assets/', views.assets_list, name='assets_list'),
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
    # Alerts
    path('alerts/', views.alerts_list_create, name='alerts_list_create'),
    path('alerts/<int:pk>/', views.alert_detail, name='alert_detail'),
    path('notifications/', views.notifications_list, name='notifications_list'),
    path('notifications/<int:pk>/read/', views.notification_mark_read, name='notification_mark_read'),
]