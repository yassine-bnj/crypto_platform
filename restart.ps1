#!/usr/bin/env pwsh
# Script de redemarrage rapide (sans rebuild)

Write-Host "Redemarrage de la plateforme Crypto..." -ForegroundColor Cyan
Write-Host ""

# Arret
Write-Host "Arret des containers..." -ForegroundColor Yellow
docker-compose down
Write-Host ""

# Demarrage
Write-Host "Demarrage des containers..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Start-Sleep -Seconds 5
    
    Write-Host "Etat des containers:" -ForegroundColor Cyan
    docker ps --format "table {{.Names}}\t{{.Status}}"
    
    Write-Host ""
    Write-Host "Plateforme redemarree!" -ForegroundColor Green
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "   Backend:  http://localhost:8000" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Erreur lors du redemarrage" -ForegroundColor Red
}
