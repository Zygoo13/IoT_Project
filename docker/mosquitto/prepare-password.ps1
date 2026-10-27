param(
    [switch]$Replace
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$credentialFile = Join-Path $projectRoot 'Backend/.env.bth4'
$passwordFile = Join-Path $PSScriptRoot '.passwords'

if ((Test-Path -LiteralPath $passwordFile) -and -not $Replace) {
    Write-Output 'Password file already exists; kept unchanged.'
    exit 0
}

$settings = @{}
foreach ($line in Get-Content -LiteralPath $credentialFile -Encoding UTF8) {
    $separator = $line.IndexOf('=')
    if ($separator -gt 0 -and -not $line.TrimStart().StartsWith('#')) {
        $settings[$line.Substring(0, $separator).Trim()] = $line.Substring($separator + 1)
    }
}
if ([string]::IsNullOrWhiteSpace($settings['IOT_MQTT_USER']) -or
    [string]::IsNullOrEmpty($settings['IOT_MQTT_PASSWORD'])) {
    throw 'Configure IOT_MQTT_USER and IOT_MQTT_PASSWORD in Backend/.env.bth4 first.'
}

# Tạo hash bằng đúng image broker; không đưa mật khẩu vào tham số Docker hoặc log.
$dockerArguments = @('run', '--rm', '--env-file', $credentialFile, '--entrypoint', 'sh',
    'eclipse-mosquitto:2.0.22', '-c',
    'mosquitto_passwd -b -c /tmp/passwords "$IOT_MQTT_USER" "$IOT_MQTT_PASSWORD" >/dev/null && cat /tmp/passwords')
$passwordLines = @(& docker @dockerArguments)
if ($LASTEXITCODE -ne 0 -or $passwordLines.Count -eq 0) {
    throw 'Could not generate the MQTT password file.'
}

[IO.File]::WriteAllText($passwordFile, ($passwordLines -join "`n") + "`n",
    [Text.UTF8Encoding]::new($false))
Write-Output 'Local MQTT password file prepared; no credentials printed.'
