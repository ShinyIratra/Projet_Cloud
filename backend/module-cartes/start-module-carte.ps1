# Script de démarrage complet du Module Carte
# Automatise les 3 tâches : Docker + Import + Test

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " MODULE CARTE - Démarrage automatique" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Variables
$MODULE_DIR = "D:\ITU_V2\Mr_Rojo\Projet_Cloud\backend\module-cartes"
$OSM_FILE = "madagascar.osm.pbf"

# Vérification 1 : Docker est installé
Write-Host "[1/7] Vérification Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "  ✅ Docker trouvé : $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Docker n'est pas installé ou démarré" -ForegroundColor Red
    exit 1
}

# Vérification 2 : Fichier OSM présent
Write-Host "[2/7] Vérification fichier OSM..." -ForegroundColor Yellow
Set-Location $MODULE_DIR
if (Test-Path $OSM_FILE) {
    $fileSize = [math]::Round((Get-Item $OSM_FILE).Length / 1MB, 2)
    Write-Host "  ✅ Fichier trouvé : $OSM_FILE ($fileSize MB)" -ForegroundColor Green
} else {
    Write-Host "  ❌ Fichier $OSM_FILE introuvable" -ForegroundColor Red
    exit 1
}

# Étape 3 : Vérifier si l'import a déjà été fait
Write-Host "[3/7] Vérification de l'import..." -ForegroundColor Yellow
$volumeExists = docker volume ls | Select-String "module-cartes_osm-data"
if ($volumeExists) {
    Write-Host "  ℹ️  Volume Docker existant détecté" -ForegroundColor Cyan
    $response = Read-Host "  Voulez-vous réimporter les données ? (o/N)"
    if ($response -eq "o" -or $response -eq "O") {
        Write-Host "  ⚠️  Suppression du volume existant..." -ForegroundColor Yellow
        docker-compose down -v
        Write-Host "  ✅ Volume supprimé" -ForegroundColor Green
        $needsImport = $true
    } else {
        Write-Host "  ⏭️  Import ignoré (données déjà présentes)" -ForegroundColor Cyan
        $needsImport = $false
    }
} else {
    Write-Host "  ℹ️  Aucun import précédent détecté" -ForegroundColor Cyan
    $needsImport = $true
}

# Étape 4 : Pull de l'image Docker
Write-Host "[4/7] Téléchargement de l'image Docker..." -ForegroundColor Yellow
Write-Host "  ⏳ Cela peut prendre 5-10 minutes (2.14 GB)" -ForegroundColor Cyan
docker-compose pull
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Image Docker prête" -ForegroundColor Green
} else {
    Write-Host "  ❌ Échec du téléchargement" -ForegroundColor Red
    exit 1
}

# Étape 5 : Import des données
if ($needsImport) {
    Write-Host "[5/7] Import des données OSM..." -ForegroundColor Yellow
    Write-Host "  ⏳ Cela peut prendre 15-30 minutes" -ForegroundColor Cyan
    docker-compose run --rm osm-tile-server import
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Import terminé avec succès" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Échec de l'import" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[5/7] Import ignoré" -ForegroundColor Gray
}

# Étape 6 : Démarrage du serveur
Write-Host "[6/7] Démarrage du serveur de tuiles..." -ForegroundColor Yellow
docker-compose up -d
Start-Sleep -Seconds 3

$container = docker ps --filter "name=osm-tile-server" --format "{{.Names}}"
if ($container) {
    Write-Host "  ✅ Serveur démarré : $container" -ForegroundColor Green
} else {
    Write-Host "  ❌ Le conteneur n'a pas démarré" -ForegroundColor Red
    Write-Host "  Logs :" -ForegroundColor Yellow
    docker logs osm-tile-server --tail 20
    exit 1
}

# Étape 7 : Test d'une tuile
Write-Host "[7/7] Test du serveur..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/tile/0/0/0.png" -UseBasicParsing -TimeoutSec 30
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ Serveur opérationnel (HTTP 200)" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠️  Serveur pas encore prêt (normal au premier démarrage)" -ForegroundColor Yellow
}

# Récapitulatif
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " ✅ MODULE CARTE DÉMARRÉ" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📌 URLs importantes :" -ForegroundColor White
Write-Host "  Serveur de tuiles : http://localhost:8080" -ForegroundColor Cyan
Write-Host "  Test d'une tuile  : http://localhost:8080/tile/0/0/0.png" -ForegroundColor Cyan
Write-Host ""
Write-Host "🧪 Pour tester l'affichage :" -ForegroundColor White
Write-Host "  1. Ouvrir un nouveau terminal PowerShell" -ForegroundColor Gray
Write-Host "  2. cd $MODULE_DIR" -ForegroundColor Gray
Write-Host "  3. python -m http.server 8000" -ForegroundColor Gray
Write-Host "  4. Ouvrir : http://localhost:8000/test-affichage.html" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 Commandes utiles :" -ForegroundColor White
Write-Host "  Logs       : docker logs osm-tile-server --tail 50 --follow" -ForegroundColor Gray
Write-Host "  Arrêter    : docker-compose down" -ForegroundColor Gray
Write-Host "  Redémarrer : docker-compose restart" -ForegroundColor Gray
Write-Host ""
