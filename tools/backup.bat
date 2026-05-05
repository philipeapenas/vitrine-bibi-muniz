@echo off
REM Backup do projeto Vitrine - Bibi Muniz -> philipeapenas/vitrine-bibi-muniz (main)
REM Uso: clique duplo. Stage tudo que o .gitignore deixa passar, commit com timestamp, push.

REM Sobe 1 nivel: tools/ -> raiz do projeto
cd /d "%~dp0.."

echo.
echo === Vitrine - Bibi Muniz backup ===
echo Repo: %CD%
echo.

REM Timestamp YYYY-MM-DD_HH-MM-SS (locale-independente via PowerShell)
for /f "delims=" %%i in ('powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'"') do set TS=%%i

git add -A
if errorlevel 1 goto :err

REM Sai limpo se nao houver nada pra commitar
git diff --cached --quiet
if not errorlevel 1 (
    echo Nada novo pra commitar. Tentando push mesmo assim...
    goto :push
)

git commit -m "backup %TS%"
if errorlevel 1 goto :err

:push
git push origin main
if errorlevel 1 goto :err

echo.
echo === OK: backup %TS% concluido ===
echo.
pause
exit /b 0

:err
echo.
echo === ERRO no backup. Veja a saida acima. ===
echo.
pause
exit /b 1
