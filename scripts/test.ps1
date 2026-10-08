param([string]$NodePath)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $NodePath) {
    $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeCommand) { $NodePath = $nodeCommand.Source }
    else { throw 'Install Node.js or pass -NodePath with a Node/Electron executable.' }
}
$previousElectronMode = $env:ELECTRON_RUN_AS_NODE
$previousLocation = Get-Location
try {
    Set-Location -LiteralPath $projectRoot
    $env:ELECTRON_RUN_AS_NODE = '1'
    $testFiles = @(rg --files tests -g '*.test.js')
    & $NodePath --test @testFiles | Out-String | Write-Output
    $testExitCode = $LASTEXITCODE
} finally {
    $env:ELECTRON_RUN_AS_NODE = $previousElectronMode
    Set-Location -LiteralPath $previousLocation.Path
}
exit $testExitCode
