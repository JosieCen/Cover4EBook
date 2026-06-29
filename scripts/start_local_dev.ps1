param(
  [int]$Port = 3000,
  [switch]$AcceptanceMock
)

$ErrorActionPreference = "Stop"

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logDir = Join-Path (Get-Location) ".tmp\dev_server"
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

$stdoutPath = Join-Path $logDir "next_dev_${Port}_$timestamp.out.log"
$stderrPath = Join-Path $logDir "next_dev_${Port}_$timestamp.err.log"

if ($AcceptanceMock) {
  $env:COVER4EBOOK_ACCEPTANCE_MOCK = "1"
} else {
  Remove-Item Env:\COVER4EBOOK_ACCEPTANCE_MOCK -ErrorAction SilentlyContinue
}

$process = Start-Process -FilePath "npm.cmd" `
  -ArgumentList "run", "dev", "--", "--hostname", "127.0.0.1", "--port", "$Port" `
  -WorkingDirectory (Get-Location) `
  -RedirectStandardOutput $stdoutPath `
  -RedirectStandardError $stderrPath `
  -PassThru `
  -WindowStyle Hidden

Write-Output "PID=$($process.Id)"
Write-Output "PORT=$Port"
Write-Output "ACCEPTANCE_MOCK=$($AcceptanceMock.IsPresent)"
Write-Output "STDOUT=$stdoutPath"
Write-Output "STDERR=$stderrPath"
