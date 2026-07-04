$nodeBin  = "g:\My Drive\Work\ASH BAZAR\APPS_Development\remix_-employee-tracker (1)\.bin\node-v22.4.1-win-x64"
$npm      = "$nodeBin\npm.cmd"
$node     = "$nodeBin\node.exe"
$localDir = "C:\AppModules\metrologix"
$projDir  = "g:\My Drive\Work\ASH BAZAR\APPS_Development\remix_-employee-tracker (1)"

# Add portable node to PATH for this session so prisma/postinstall scripts work
$env:PATH = "$nodeBin;" + $env:PATH

Write-Host "=== Step 1: Clean old broken node_modules ===" -ForegroundColor Yellow
Remove-Item -Recurse -Force "$localDir\node_modules" -ErrorAction SilentlyContinue
Write-Host "Removed old node_modules"

Write-Host "=== Step 2: Clean npm cache ===" -ForegroundColor Yellow
& $npm cache clean --force
Write-Host "Cache cleaned"

Write-Host "=== Step 3: Copy updated package.json ===" -ForegroundColor Cyan
Copy-Item -Path "$projDir\package.json" -Destination "$localDir\package.json" -Force
Write-Host "package.json copied"

Write-Host "=== Step 4: Install dependencies ===" -ForegroundColor Cyan
Set-Location $localDir
& $npm install --prefix $localDir
Write-Host "=== Install finished ===" -ForegroundColor Green

Write-Host "=== Step 5: Remove any existing symlink in project ===" -ForegroundColor Cyan
$nm = "$projDir\node_modules"
if (Test-Path $nm) {
    cmd /c rmdir "$nm"
    if (Test-Path $nm) {
        Remove-Item -Recurse -Force $nm -ErrorAction SilentlyContinue
    }
}

Write-Host "=== Step 6: Create symlink ===" -ForegroundColor Cyan
cmd /c mklink /D "$nm" "$localDir\node_modules"
Write-Host "Symlink: $nm -> $localDir\node_modules" -ForegroundColor Green

# Verify
$viteOk   = Test-Path "$localDir\node_modules\vite"
$reactOk  = Test-Path "$localDir\node_modules\react"
$lucideOk = Test-Path "$localDir\node_modules\lucide-react"
Write-Host "vite:        $viteOk"   -ForegroundColor $(if ($viteOk)   {"Green"} else {"Red"})
Write-Host "react:       $reactOk"  -ForegroundColor $(if ($reactOk)  {"Green"} else {"Red"})
Write-Host "lucide-react:$lucideOk" -ForegroundColor $(if ($lucideOk) {"Green"} else {"Red"})
