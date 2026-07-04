$projDir  = "g:\My Drive\Work\ASH BAZAR\APPS_Development\remix_-employee-tracker (1)"
$localDir = "C:\AppModules\metrologix"
robocopy "$projDir\src" "$localDir\src" /E /NFL /NDL /NJH /NJS
Write-Host "Synced src/ to local dir" -ForegroundColor Green
