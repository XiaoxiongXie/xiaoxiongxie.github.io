param([string]$Version = '1.11.9')
$ErrorActionPreference = 'Stop'
if ($Version -notmatch '^\d+\.\d+\.\d+$') { throw 'Use a stable numeric version, for example 1.11.9.' }
$projectRoot = Split-Path -Parent $PSScriptRoot
$toolsDirectory = Join-Path $projectRoot '.tools'
$archive = Join-Path $toolsDirectory "quarto-$Version-win.zip"
$destination = Join-Path $toolsDirectory 'quarto'
New-Item -ItemType Directory -Force -Path $toolsDirectory | Out-Null
$release = Invoke-RestMethod -Uri "https://api.github.com/repos/quarto-dev/quarto-cli/releases/tags/v$Version"
$asset = $release.assets | Where-Object name -eq "quarto-$Version-win.zip"
if (-not $asset -or -not $asset.digest) { throw 'Official release asset or checksum unavailable.' }
Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $archive
$actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $archive).Hash.ToLower()
if ('sha256:' + $actual -ne $asset.digest) { throw 'Checksum mismatch; archive has not been extracted.' }
Expand-Archive -LiteralPath $archive -DestinationPath $destination -Force
Write-Output "Installed a SHA256-verified portable Quarto release in $destination"
& (Join-Path $destination 'bin\quarto.cmd') --version
