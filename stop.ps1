#!/usr/bin/env pwsh
# Script d'arret de la plateforme Crypto

Write-Host "Arret de la plateforme Crypto..." -ForegroundColor Cyan
Write-Host ""

# Arret des containers
Write-Host "Arret des containers..." -ForegroundColor Yellow
docker-compose down

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Tous les containers ont ete arretes" -ForegroundColor Green
    Write-Host ""
    Write-Host "Pour supprimer aussi les volumes (base de donnees):" -ForegroundColor Yellow
    Write-Host "   docker-compose down -v" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "Erreur lors de l'arret des containers" -ForegroundColor Red
}
