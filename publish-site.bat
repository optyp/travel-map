@echo off
setlocal

cd /d "%~dp0"

echo Preparing site update...
git add -A
if errorlevel 1 goto :error

git diff --cached --quiet
if errorlevel 2 goto :error
if not errorlevel 1 goto :nothing

for /f "delims=" %%I in ('powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd HH:mm:ss'"') do set "timestamp=%%I"

git commit -m "Update site: %timestamp%"
if errorlevel 1 goto :error

git push origin main
if errorlevel 1 goto :error

echo.
echo Site update sent successfully.
echo GitHub Pages may need a minute to publish it.
goto :end

:nothing
echo.
echo Nothing changed. There is nothing to publish.
goto :end

:error
echo.
echo Publishing failed. Review the messages above.
echo No files were deleted.

:end
echo.
pause
endlocal
