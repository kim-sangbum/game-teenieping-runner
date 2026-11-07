$content = Get-Content "$PSScriptRoot/../js/app.bundle.js" -Raw

# Check for specific suspicious patterns
$suspicious = @("limbMat", "undefined_var", "headMat", "bodyMat", "legMat", "armMat")
foreach ($s in $suspicious) {
    if ($content -match "\b$s\b") {
        Write-Host "Found suspicious token: $s"
    }
}

# Check for syntax errors by testing Function constructor via powershell / mshta or cscript if possible
# Let's check for any missing properties or unmatched variables in GameEngine3D
Write-Host "Checking GameEngine3D properties..."
$engineLines = Get-Content "$PSScriptRoot/../js/app.bundle.js" | Select-String -Pattern "this\.[a-zA-Z0-9_]+"
Write-Host "Total 'this.' references: $($engineLines.Count)"

