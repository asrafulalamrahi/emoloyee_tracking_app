$nodeBin  = "g:\My Drive\Work\ASH BAZAR\APPS_Development\remix_-employee-tracker (1)\.bin\node-v22.4.1-win-x64"
$npm      = "$nodeBin\npm.cmd"
$node     = "$nodeBin\node.exe"
$localDir = "C:\AppModules\backend"
$projDir  = "g:\My Drive\Work\ASH BAZAR\APPS_Development\remix_-employee-tracker (1)"

# Add node bin to PATH so postinstall/bcrypt compilation can find it
$env:PATH = "$nodeBin;" + $env:PATH

Write-Host "=== Clean old local backend node_modules ===" -ForegroundColor Yellow
Remove-Item -Recurse -Force "$localDir\node_modules" -ErrorAction SilentlyContinue
Write-Host "Old node_modules removed"

Write-Host "=== Copy backend package.json to local ===" -ForegroundColor Cyan
Copy-Item -Path "$projDir\backend\package.json" -Destination "$localDir\package.json" -Force

Write-Host "=== Running npm install ===" -ForegroundColor Cyan
Set-Location $localDir
& $npm install --prefix $localDir
Write-Host "=== Install complete ===" -ForegroundColor Green

Write-Host "=== Link backend/node_modules -> C:\AppModules\backend\node_modules ===" -ForegroundColor Cyan
$nm = "$projDir\backend\node_modules"
if (Test-Path $nm) {
    cmd /c rmdir "$nm"
    if (Test-Path $nm) {
        Remove-Item -Recurse -Force $nm -ErrorAction SilentlyContinue
    }
}
cmd /c mklink /J `"$nm`" `"$localDir\node_modules`"
Write-Host "Link created: $nm -> $localDir\node_modules" -ForegroundColor Green

# Verify key package (e.g., @nestjs/core)
$ok = Test-Path "$localDir\node_modules\@nestjs\core"
Write-Host "NestJS Core Present: $ok" -ForegroundColor $(if ($ok) {"Green"} else {"Red"})
