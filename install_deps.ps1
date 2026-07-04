$node = "g:\My Drive\Work\ASH BAZAR\APPS_Development\remix_-employee-tracker (1)\.bin\node-v22.4.1-win-x64\node.exe"
$npm  = "g:\My Drive\Work\ASH BAZAR\APPS_Development\remix_-employee-tracker (1)\.bin\node-v22.4.1-win-x64\npm.cmd"
$cwd  = "g:\My Drive\Work\ASH BAZAR\APPS_Development\remix_-employee-tracker (1)"

Write-Host "Installing root dependencies..."
& $npm install --prefix $cwd
Write-Host "Done installing."
