$nodeBin = "g:\My Drive\Work\ASH BAZAR\APPS_Development\remix_-employee-tracker (1)\.bin\node-v22.4.1-win-x64"
$node    = "$nodeBin\node.exe"
$npm     = "$nodeBin\npm.cmd"
$projDir = "g:\My Drive\Work\ASH BAZAR\APPS_Development\remix_-employee-tracker (1)"
$localDir = "C:\AppModules\metrologix"
$vite    = "$localDir\node_modules\vite\bin\vite.js"

# Add node to PATH
$env:PATH = "$nodeBin;" + $env:PATH

Write-Host "=== Syncing source files to local dir ===" -ForegroundColor Cyan

# Copy all source files (not node_modules) to local dir
robocopy $projDir $localDir /E /XD node_modules .bin .git .vite-temp dist /XF "*.log" /NFL /NDL /NJH /NJS
Write-Host "Sync complete" -ForegroundColor Green

Write-Host "=== Launching Vite from local dir ===" -ForegroundColor Green
Set-Location $localDir
& $node $vite --port 5173 --open
