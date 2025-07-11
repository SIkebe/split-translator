@echo off
echo ==========================================
echo Chrome Web Store Package Builder
echo ==========================================
echo.

REM Create output directory
if not exist "dist" mkdir dist

REM Remove existing ZIP file
if exist "dist\split-translator.zip" del "dist\split-translator.zip"

echo [*] Creating package...

REM Create ZIP file using PowerShell
powershell -Command "& { Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [System.IO.Compression.ZipFile]::Open('dist\split-translator.zip', 'Create'); $files = @('manifest.json', 'popup.html', 'popup.js', 'background.js', 'LICENSE', 'PRIVACY_POLICY.md'); foreach ($file in $files) { if (Test-Path $file) { [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file, $file) | Out-Null; Write-Host \"+ $file\" } }; if (Test-Path 'icons') { Get-ChildItem 'icons\*.png' | ForEach-Object { [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, 'icons\' + $_.Name) | Out-Null; Write-Host \"+ icons\$($_.Name)\" } }; $zip.Dispose() }"

echo.
echo [OK] Package created successfully: dist\split-translator.zip
echo.

REM Display package contents
echo [INFO] Package contents:
powershell -Command "& { Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [System.IO.Compression.ZipFile]::OpenRead('dist\split-translator.zip'); $zip.Entries | ForEach-Object { Write-Host \"   $($_.FullName)\" }; $zip.Dispose() }"

REM Check if size is under 10MB (Chrome Web Store limit)
REM Display package size
echo [INFO] Package size:
powershell -Command @"
$size = (Get-Item 'dist\split-translator.zip').Length
Write-Host "   Size: $([math]::Round($size/(1024*1024), 2)) MB"
if ($size -gt 10485760) {
    Write-Host '[ERROR] Package size exceeds 10MB limit!' -ForegroundColor Red
    exit 1
} else {
    exit 0
}
"@
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Package creation failed due to size limit.
    exit /B %ERRORLEVEL%
)
echo.
echo Ready to upload to Chrome Web Store!
echo.
echo Next steps:
echo    1. Access Chrome Web Store Developer Dashboard
echo    2. Create a new item
echo    3. Upload dist\split-translator.zip
echo    4. Fill in store listing information
echo    5. Submit for review
echo.
pause
