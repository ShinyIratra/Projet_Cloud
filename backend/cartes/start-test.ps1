# Script PowerShell pour lancer le module carte
# Utilisation: .\start-test.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Module Carte - Test Complet" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Étape 1 : Vérifier Docker
Write-Host "Etape 1: Verification du serveur Docker..." -ForegroundColor Yellow
$container = docker ps --filter "name=osm-tile-server-run" --format "{{.Status}}"

if ($container) {
    Write-Host "OK Serveur Docker actif: $container" -ForegroundColor Green
} else {
    Write-Host "X Serveur Docker arrete. Demarrage..." -ForegroundColor Red
    docker start osm-tile-server-run
    Start-Sleep -Seconds 3
    Write-Host "OK Serveur Docker demarre" -ForegroundColor Green
}

Write-Host ""

# Étape 2 : Tester l'accès aux tuiles
Write-Host "Etape 2: Test acces aux tuiles..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/tile/0/0/0.png" -Method Head -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "OK Tuiles accessibles (HTTP $($response.StatusCode))" -ForegroundColor Green
    }
} catch {
    Write-Host "X Erreur d acces aux tuiles: $_" -ForegroundColor Red
    Write-Host "Verifiez que le conteneur Docker est bien demarre" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""

# Étape 3 : Lancer serveur HTTP
Write-Host "Etape 3: Lancement du serveur HTTP (port 3000)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Serveur HTTP en cours d execution" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URL de test: " -NoNewline
Write-Host "http://localhost:3000/test-carte.html" -ForegroundColor Green
Write-Host ""
Write-Host "Instructions:" -ForegroundColor Yellow
Write-Host "  1. Ouvrir l URL ci-dessus dans votre navigateur"
Write-Host "  2. Ouvrir la console (F12) pour voir le chargement des tuiles"
Write-Host "  3. Patienter 10-30 secondes pour la premiere generation"
Write-Host "  4. Rafraichir (F5) si necessaire"
Write-Host ""
Write-Host "Pour arreter le serveur: CTRL+C" -ForegroundColor Red
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ouvrir automatiquement le navigateur
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000/test-carte.html"

# Démarrer le serveur HTTP (bloquant)
Set-Location $PSScriptRoot
python -m http.server 3000
