#!/bin/sh

# Fonction pour attendre un service
wait_for() {
  echo "Waiting for $1 to listen on $2..."
  while ! nc -z "$1" "$2"; do
    sleep 1
  done
}

# Attendre PostgreSQL (port 5432) et Redis (port 6379)
wait_for db 5432
wait_for redis 6379

echo "All services ready. Applying migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

# Exécuter la commande finale (ex: gunicorn ou celery)
exec "$@"