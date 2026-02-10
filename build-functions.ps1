# Build script for Firebase Functions

Write-Host "Building Firebase Functions..." -ForegroundColor Cyan

Set-Location functions
npm run build
Set-Location ..

Write-Host "Build complete!" -ForegroundColor Green
