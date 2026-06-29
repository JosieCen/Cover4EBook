$ErrorActionPreference = "Stop"

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$tempRoot = Join-Path $env:TEMP "cover4ebook_build_verify_$timestamp"
Write-Output "TEMP_BUILD_ROOT=$tempRoot"

New-Item -ItemType Directory -Path $tempRoot | Out-Null
New-Item -ItemType Directory -Path (Join-Path $tempRoot "src") | Out-Null

$filesToCopy = @(
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next-env.d.ts",
  "next.config.ts",
  "eslint.config.mjs",
  "vitest.config.ts",
  "vitest.setup.ts",
  ".env.example",
  "README.md"
)

foreach ($file in $filesToCopy) {
  Copy-Item -LiteralPath $file -Destination (Join-Path $tempRoot $file)
}

Copy-Item -Path "src\*" -Destination (Join-Path $tempRoot "src") -Recurse

$nodeModulesDestination = Join-Path $tempRoot "node_modules"
$robocopyArgs = @(
  "node_modules",
  $nodeModulesDestination,
  "/E",
  "/NFL",
  "/NDL",
  "/NJH",
  "/NJS",
  "/NC",
  "/NS"
)

robocopy @robocopyArgs | Out-Null
$robocopyExit = $LASTEXITCODE
if ($robocopyExit -ge 8) {
  throw "robocopy failed with exit code $robocopyExit"
}

Push-Location $tempRoot
try {
  npm run build
}
finally {
  Pop-Location
}
