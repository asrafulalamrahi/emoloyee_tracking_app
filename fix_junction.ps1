$nm     = "g:\My Drive\Work\ASH BAZAR\APPS_Development\remix_-employee-tracker (1)\node_modules"
$target = "C:\AppModules\metrologix\node_modules"

Write-Host "=== Removing old Google Drive node_modules ===" -ForegroundColor Yellow
Remove-Item -Recurse -Force -LiteralPath $nm -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 500

if (Test-Path -LiteralPath $nm) {
    Write-Host "Remove-Item failed, trying cmd rmdir /s /q..." -ForegroundColor Yellow
    $arg = "/s /q `"$nm`""
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c rmdir $arg" -Wait -NoNewWindow
    Start-Sleep -Seconds 2
}

if (-not (Test-Path -LiteralPath $nm)) {
    Write-Host "=== Creating directory junction ===" -ForegroundColor Cyan
    $arg2 = "/J `"$nm`" `"$target`""
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c mklink $arg2" -Wait -NoNewWindow
    Write-Host "Junction created!" -ForegroundColor Green
} else {
    Write-Host "ERROR: node_modules still exists, cannot create junction!" -ForegroundColor Red
}

Write-Host "=== Verifying vite accessible ===" -ForegroundColor Cyan
$ok = Test-Path "$nm\vite"
Write-Host "vite present: $ok" -ForegroundColor $(if ($ok) {"Green"} else {"Red"})
