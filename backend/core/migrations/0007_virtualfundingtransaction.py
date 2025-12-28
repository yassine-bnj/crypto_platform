from django.db import migrations, models
import django.db.models.deletion
from decimal import Decimal


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_virtual_portfolio'),
    ]

    operations = [
        migrations.CreateModel(
            name='VirtualFundingTransaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('direction', models.CharField(choices=[('deposit', 'Deposit'), ('withdraw', 'Withdraw')], max_length=8)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('portfolio', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='funding_transactions', to='core.virtualportfolio')),
            ],
            options={'ordering': ['-created_at']},
        ),
    ]
