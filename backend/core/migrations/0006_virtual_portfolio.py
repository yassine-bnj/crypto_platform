from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
from decimal import Decimal


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_alert_notification'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='VirtualPortfolio',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('initial_balance', models.DecimalField(decimal_places=2, default=Decimal('100000.00'), max_digits=20)),
                ('cash_balance', models.DecimalField(decimal_places=2, default=Decimal('100000.00'), max_digits=20)),
                ('realized_pnl', models.DecimalField(decimal_places=2, default=Decimal('0'), max_digits=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='virtual_portfolio', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='VirtualTrade',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('side', models.CharField(choices=[('buy', 'Buy'), ('sell', 'Sell')], max_length=4)),
                ('quantity', models.DecimalField(decimal_places=10, max_digits=30)),
                ('price_usd', models.DecimalField(decimal_places=8, max_digits=25)),
                ('total_usd', models.DecimalField(decimal_places=2, max_digits=25)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('asset', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='virtual_trades', to='core.asset')),
                ('portfolio', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='trades', to='core.virtualportfolio')),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='VirtualHolding',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity', models.DecimalField(decimal_places=10, default=Decimal('0'), max_digits=30)),
                ('avg_price', models.DecimalField(decimal_places=8, default=Decimal('0'), max_digits=25)),
                ('asset', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='virtual_holdings', to='core.asset')),
                ('portfolio', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='holdings', to='core.virtualportfolio')),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='virtualholding',
            unique_together={('portfolio', 'asset')},
        ),
    ]
