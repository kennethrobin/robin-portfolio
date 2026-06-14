@echo off
rem Builds the deployable site into the dist\ folder.
rem When it finishes, drag dist\ onto Netlify to publish.
set "PATH=C:\Users\kenneth\AppData\Local\node-portable\node-v24.16.0-win-x64;%PATH%"
cd /d "%~dp0"
npm run build
echo.
echo Done! Drag this folder onto Netlify:  %~dp0dist
pause
