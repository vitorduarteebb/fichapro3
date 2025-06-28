@echo off
echo Iniciando FichaPro para acesso de rede...
echo.

echo 1. Iniciando Backend Django...
cd fichapro_backend
start "Backend Django" cmd /k "venv\Scripts\activate && python manage.py runserver 0.0.0.0:8000"

echo 2. Aguardando 3 segundos...
timeout /t 3 /nobreak > nul

echo 3. Iniciando Frontend React...
cd ..\fichapro
start "Frontend React" cmd /k "npm run dev"

echo.
echo Sistema iniciado com sucesso!
echo.
echo Para acessar de outros computadores na rede:
echo - Frontend: http://192.168.0.181:5173
echo - Backend: http://192.168.0.181:8000
echo.
echo Para descobrir seu IP, execute: ipconfig
echo.
pause 