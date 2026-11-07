$files = @(
    "js/engine/Stickman3D.js",
    "js/engine/GameEngine3D.js",
    "js/engine/DifficultyManager.js",
    "js/engine/ParticleSystem.js",
    "js/engine/SoundFx.js",
    "js/engine/Obstacles3D.js",
    "js/database/CustomizationSchema.js",
    "js/database/UserDatabase.js",
    "js/ui/UIManager.js",
    "js/app.bundle.js"
)

foreach ($file in $files) {
    $fullPath = Join-Path "$PSScriptRoot/.." $file
    $content = [System.IO.File]::ReadAllText($fullPath)
    $braces = 0
    $parens = 0
    $brackets = 0

    for ($i = 0; $i -lt $content.Length; $i++) {
        $c = $content[$i]
        if ($c -eq '{') { $braces++ }
        elseif ($c -eq '}') { $braces-- }
        elseif ($c -eq '(') { $parens++ }
        elseif ($c -eq ')') { $parens-- }
        elseif ($c -eq '[') { $brackets++ }
        elseif ($c -eq ']') { $brackets-- }
    }

    Write-Host "$file -> Braces: $braces, Parens: $parens, Brackets: $brackets"
}

