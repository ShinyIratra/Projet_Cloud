@echo off
REM Script de lancement du serveur HTTP pour test-carte.html
REM Utilisation: Double-cliquer sur ce fichier ou l'executer dans PowerShell

echo ========================================
echo   Module Carte - Serveur HTTP Local
echo ========================================
echo.
echo Demarrage du serveur HTTP sur le port 3000...
echo.
echo IMPORTANT:
echo   - Ce terminal doit rester OUVERT
echo   - Ouvrir: http://localhost:3000/test-carte.html
echo   - Pour arreter: CTRL+C
echo.
echo ========================================
echo.

cd /d "%~dp0"
python -m http.server 3000

pause
