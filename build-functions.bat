@echo off
REM Build script for Firebase Functions

echo Building Firebase Functions...
cd functions
npm run build
cd ..
echo Build complete!
