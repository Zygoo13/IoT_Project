param([switch]$Build)

$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    # Dùng lại MySQL hiện có, không tạo container hoặc volume mới.
    docker start iot_backend_mysql_20261005 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw 'Start Docker Desktop and check the existing MySQL container first.'
    }

    & ./docker/mosquitto/prepare-password.ps1
    $composeArguments = @('compose', '--env-file', 'Backend/.env', 'up', '-d')
    if ($Build) {
        $composeArguments += '--build'
    }
    & docker @composeArguments
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not start the project. Check port 1325 and Compose logs.'
    }
    docker compose --env-file Backend/.env ps
} finally {
    Pop-Location
}
