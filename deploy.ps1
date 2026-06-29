# MANTRA Automated Cloud Deployment Script
Write-Host "==================================================" -ForegroundColor Blue
Write-Host "       MANTRA Production Deployment Helper" -ForegroundColor Blue
Write-Host "==================================================" -ForegroundColor Blue

# 1. Ask for Supabase connection string
Write-Host "`n[Step 1/3] Database Initialization" -ForegroundColor Yellow
$supabaseUri = Read-Host "Enter your Supabase URI (e.g. postgresql+asyncpg://postgres:pass@aws-0-us-east-1.pooler.supabase.com:6543/postgres)"
if (-not $supabaseUri) {
    Write-Host "Supabase URI is required. Aborting deployment." -ForegroundColor Red
    Exit
}

# Generate sync connection string for alembic migrations
$supabaseSyncUri = $supabaseUri.Replace("postgresql+asyncpg://", "postgresql+psycopg2://")

# Update backend/.env file with Supabase URL
Write-Host "Updating backend/.env with production credentials..." -ForegroundColor Green
$envContent = @"
# MANTRA Production Environment Variables
DATABASE_URL=$supabaseUri
DATABASE_SYNC_URL=$supabaseSyncUri
SECRET_KEY=$( [guid]::NewGuid().ToString() )
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ENVIRONMENT=production
"@
Set-Content -Path "backend\.env" -Value $envContent

# Run database migrations on Supabase
Write-Host "Running database migrations on Supabase..." -ForegroundColor Green
cd backend
.venv\Scripts\alembic upgrade head
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Database migrations failed! Check database status and password in your connection string." -ForegroundColor Red
    cd ..
    Exit
}
cd ..

# 2. Vercel Frontend Deployment
Write-Host "`n[Step 2/3] Authenticate with Vercel" -ForegroundColor Yellow
Write-Host "A browser window will open for you to log in to your Vercel account." -ForegroundColor Gray
npx vercel login
if ($LASTEXITCODE -ne 0) {
    Write-Host "Vercel authentication failed. Aborting." -ForegroundColor Red
    Exit
}

Write-Host "`n[Step 3/3] Deploying Frontend to Vercel..." -ForegroundColor Yellow
cd frontend

# Deploy using npx vercel
npx vercel --yes
if ($LASTEXITCODE -ne 0) {
    Write-Host "Vercel deployment failed." -ForegroundColor Red
    cd ..
    Exit
}
cd ..

Write-Host "`n==================================================" -ForegroundColor Blue
Write-Host "       Deployment Sequence Completed Successfully!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Blue
Write-Host "Next steps:"
Write-Host "1. Link your github repository to Render or Railway to host your backend."
Write-Host "2. Copy your backend Render URL and set it as NEXT_PUBLIC_API_URL on Vercel project settings."
Write-Host "3. Run 'npx vercel --prod' in the frontend directory to update production links."
