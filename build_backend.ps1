$projDir  = "g:\My Drive\Work\ASH BAZAR\APPS_Development\remix_-employee-tracker (1)"
$localDir = "C:\AppModules\backend"
$nodeBin  = "$projDir\.bin\node-v22.4.1-win-x64"

# Add node to path
$env:PATH = "$nodeBin;" + $env:PATH

Write-Host "=== Syncing backend source to local dir ===" -ForegroundColor Cyan
robocopy "$projDir\backend" "$localDir" /E /XD node_modules /NFL /NDL /NJH /NJS
Write-Host "Sync complete" -ForegroundColor Green

Write-Host "=== Running Prisma generate ===" -ForegroundColor Cyan
Set-Location $localDir
& "$nodeBin\node.exe" ".\node_modules\prisma\build\index.js" generate
Write-Host "Prisma Client Generated" -ForegroundColor Green

Write-Host "=== Building NestJS Backend ===" -ForegroundColor Cyan
& "$nodeBin\node.exe" ".\node_modules\typescript\bin\tsc"
Write-Host "NestJS Build finished!" -ForegroundColor Green
