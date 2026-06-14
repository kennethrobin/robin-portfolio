@echo off
rem Starts the Vite dev server using the portable Node install.
set "PATH=C:\Users\kenneth\AppData\Local\node-portable\node-v24.16.0-win-x64;%PATH%"
cd /d "%~dp0"
npm run dev
