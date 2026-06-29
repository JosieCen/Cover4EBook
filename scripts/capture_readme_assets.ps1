$ErrorActionPreference = "Stop"

$env:COVER4EBOOK_ACCEPTANCE_MOCK = "1"

$edgeCandidates = @(
  "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
)

$projectName = if ($edgeCandidates | Where-Object { Test-Path $_ }) { "microsoft-edge" } else { "chromium" }

Write-Output "PLAYWRIGHT_PROJECT=$projectName"
Write-Output "COVER4EBOOK_ACCEPTANCE_MOCK=$env:COVER4EBOOK_ACCEPTANCE_MOCK"
Write-Output "README_ASSET_ROOT=$(Join-Path (Get-Location) 'assets\readme')"

npx playwright test tests/acceptance/readme_assets.spec.ts --project $projectName

if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

$requiredAssets = @(
  "hero.png",
  "workflow.png",
  "gallery-1.png",
  "gallery-2.png",
  "gallery-3.png",
  "editor.png"
)

foreach ($assetName in $requiredAssets) {
  $assetPath = Join-Path "assets\readme" $assetName
  if (-not (Test-Path -LiteralPath $assetPath -PathType Leaf)) {
    throw "Missing README asset: $assetPath"
  }
}

Write-Output "README_ASSETS_VERIFIED=$($requiredAssets.Count)"
