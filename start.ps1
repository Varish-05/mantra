# MANTRA Startup Helper Script
Write-Host "Starting MANTRA Threat Response Platform..." -ForegroundColor Blue

if (-not (Test-Path "backend\.env")) {
    Write-Host "Error: backend\.env is missing!" -ForegroundColor Red
    Exit
}

# Run database migrations
Write-Host "Running database migrations..." -ForegroundColor Yellow
cd backend
.venv\Scripts\alembic upgrade head
if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Migrations failed. Ensure your database is running and credentials in backend\.env are correct." -ForegroundColor Red
}

# Start backend in a new window
Write-Host "Launching FastAPI Backend Server..." -ForegroundColor Green
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "Write-Host 'MANTRA FastAPI Backend running...'; .venv\Scripts\uvicorn app.main:app --reload" -WindowStyle Normal

# Start frontend in a new window
Write-Host "Launching Next.js Frontend Dev Server..." -ForegroundColor Green
cd ../frontend
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "Write-Host 'MANTRA Next.js Frontend running...'; npm run dev" -WindowStyle Normal

Write-Host "--------------------------------------------------" -ForegroundColor Blue
Write-Host "MANTRA services initiated!" -ForegroundColor Blue
Write-Host "- Frontend Dashboard: http://localhost:3000"
Write-Host "- Backend API Swagger Docs: http://localhost:8000/docs"
Write-Host "--------------------------------------------------" -ForegroundColor Blue
