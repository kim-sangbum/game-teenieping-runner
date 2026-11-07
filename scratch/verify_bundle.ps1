$content = [System.IO.File]::ReadAllText("$PSScriptRoot/../js/app.bundle.js")
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

Write-Host "Braces balance: $braces (0 is balanced)"
Write-Host "Parens balance: $parens (0 is balanced)"
Write-Host "Brackets balance: $brackets (0 is balanced)"

