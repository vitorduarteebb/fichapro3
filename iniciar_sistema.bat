@echo off
echo ========================================
echo    INICIANDO SISTEMA FICHAPRO
echo ========================================
echo.

echo 1. Iniciando Backend Django...
cd fichapro_backend
call venv\Scripts\activate
start "Backend Django" cmd /k "python manage.py runserver"
cd ..

echo.
echo 2. Iniciando Frontend React...
cd fichapro\fichapro
start "Frontend React" cmd /k "npm run dev"
cd ..\..

echo.
echo ========================================
echo    SISTEMA INICIADO COM SUCESSO!
echo ========================================
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Pressione qualquer tecla para sair...
pause > nul 