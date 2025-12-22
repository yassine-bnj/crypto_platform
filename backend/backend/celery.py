from __future__ import absolute_import
import os
from pathlib import Path
from dotenv import load_dotenv
from celery import Celery

# Load .env so the Celery worker/beat get access to SENDGRID_API_KEY et al.
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('backend')

app.config_from_object('django.conf:settings', namespace='CELERY')

app.autodiscover_tasks()
