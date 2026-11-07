$edgePath = (Get-Item 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe', 'C:\Program Files\Microsoft\Edge\Application\msedge.exe' -ErrorAction SilentlyContinue | Select-Object -First 1).FullName
Write-Host "Edge Path: $edgePath"

if ($edgePath) {
    $url = "file:///" + (Resolve-Path "$PSScriptRoot/../index.html").Path.Replace('\', '/')
    Write-Host "Testing URL: $url"
    $proc = Start-Process -FilePath $edgePath -ArgumentList "--headless", "--dump-dom", "$url" -PassThru -NoNewWindow -Wait -RedirectStandardOutput "$PSScriptRoot/dom_dump.txt"
    $dump = Get-Content "$PSScriptRoot/dom_dump.txt" -Raw
    Write-Host "DOM dump length: $($dump.Length)"
}

