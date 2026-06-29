$ErrorActionPreference = "Stop"

$edgeCandidates = @(
  "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
)

$projectName = if ($edgeCandidates | Where-Object { Test-Path $_ }) { "microsoft-edge" } else { "chromium" }

Write-Output "PLAYWRIGHT_PROJECT=$projectName"
Write-Output "SCREENSHOT_ROOT=$(Join-Path (Get-Location) 'output\playwright\screenshots')"

npm run test:acceptance -- --project $projectName
