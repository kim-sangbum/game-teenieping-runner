$lines = Get-Content "$PSScriptRoot/../js/app.bundle.js"
for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    if ($line -match 'new THREE\.Mesh\(([^,]+),\s*([^)]+)\)') {
        $geo = $matches[1].Trim()
        $mat = $matches[2].Trim()
        Write-Host "Line $($i+1): geo=$geo, mat=$mat"
    }
}

