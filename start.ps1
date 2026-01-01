#!/usr/bin/env pwsh
# Script de demarrage automatique de la plateforme Crypto

Write-Host "Demarrage de la plateforme Crypto..." -ForegroundColor Cyan
Write-Host ""

# Etape 1: Build des images
Write-Host "[1/6] Construction des images Docker..." -ForegroundColor Yellow
docker-compose build --no-cache
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors du build des images" -ForegroundColor Red
    exit 1
}
Write-Host "Images construites avec succes" -ForegroundColor Green
Write-Host ""

# Etape 2: Demarrage des containers
Write-Host "[2/6] Demarrage des containers..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors du demarrage des containers" -ForegroundColor Red
    exit 1
}
Write-Host "Containers demarres" -ForegroundColor Green
Write-Host ""

# Etape 3: Attente que les services soient prets
Write-Host "[3/6] Attente que les services soient prets (15 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15
Write-Host "Services prets" -ForegroundColor Green
Write-Host ""

# Etape 4: Application des migrations
Write-Host "[4/6] Application des migrations Django..." -ForegroundColor Yellow
docker-compose exec backend python manage.py migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors des migrations" -ForegroundColor Red
    exit 1
}
Write-Host "Migrations appliquees" -ForegroundColor Green
Write-Host ""

# Etape 5: Creation du superuser
Write-Host "[5/6] Creation du compte administrateur..." -ForegroundColor Yellow
docker-compose exec backend python create_superuser.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de la creation du superuser (peut-etre existe deja)" -ForegroundColor Yellow
}
Write-Host ""

# Etape 6: Configuration des taches periodiques
Write-Host "[6/6] Configuration des taches periodiques Celery..." -ForegroundColor Yellow
docker-compose exec backend python manage.py setup_periodic_task
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de la configuration des taches periodiques" -ForegroundColor Yellow
}
Write-Host ""

# Verification finale
Write-Host "Verification de l'etat des containers..." -ForegroundColor Cyan
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host ""

# Affichage des informations de connexion
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "Plateforme Crypto demarree avec succes!" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Acces a l'application:" -ForegroundColor White
Write-Host "   - Frontend:    http://localhost:3000" -ForegroundColor Cyan
Write-Host "   - Admin Panel: http://localhost:8000/admin" -ForegroundColor Cyan
Write-Host "   - API:         http://localhost:8000/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "Identifiants administrateur:" -ForegroundColor White
Write-Host "   - Email:    admin@example.com" -ForegroundColor Yellow
Write-Host "   - Password: admin123456" -ForegroundColor Yellow
Write-Host ""
Write-Host "Services actifs:" -ForegroundColor White
Write-Host "   - PostgreSQL (port 5432)" -ForegroundColor Gray
Write-Host "   - Redis (port 6379)" -ForegroundColor Gray
Write-Host "   - Django Backend (port 8000)" -ForegroundColor Gray
Write-Host "   - Next.js Frontend (port 3000)" -ForegroundColor Gray
Write-Host "   - Celery Worker + Beat" -ForegroundColor Gray
Write-Host ""
Write-Host "Commandes utiles:" -ForegroundColor White
Write-Host "   - Arreter:    .\stop.ps1" -ForegroundColor Gray
Write-Host "   - Redemarrer: .\restart.ps1" -ForegroundColor Gray
Write-Host "   - Logs:       docker-compose logs -f [service]" -ForegroundColor Gray
Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
