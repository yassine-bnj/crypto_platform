from django.core.management.base import BaseCommand
from django_celery_beat.models import IntervalSchedule, PeriodicTask
import json

class Command(BaseCommand):
    help = 'Setup periodic tasks for Celery'

    def handle(self, *args, **kwargs):
        # 1. Interval (every 1 minute)
        schedule, created = IntervalSchedule.objects.get_or_create(
            every=1,
            period=IntervalSchedule.MINUTES
        )

        # 2. Task
        task, created = PeriodicTask.objects.get_or_create(
            interval=schedule,
            name='Fetch crypto prices every minute',
            task='core.tasks.fetch_crypto_prices',
        )

        self.stdout.write(self.style.SUCCESS('Periodic task configured successfully !'))
